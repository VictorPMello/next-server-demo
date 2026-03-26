# 🚀 Next.js App Router — Da mentalidade SPA para Full Stack

> Um projeto de estudo para entender como estruturar aplicações Next.js de forma profissional, separando corretamente as responsabilidades entre UI, dados e estado.

---

## 📌 Contexto — Por que esse projeto existe?

Quando começamos a usar Next.js, é muito comum cair num padrão errado: tratar ele como se fosse um React puro (SPA), buscando dados com `useEffect`, misturando lógica de banco com UI, e criando backends separados para coisas simples.

Esse projeto existe para mostrar **o jeito certo** de usar o Next.js App Router — aproveitando os recursos que ele oferece para simplificar a arquitetura.

---

## 🧠 O Problema — Como eu usava antes

```ts
// ❌ Padrão antigo (SPA clássica dentro do Next.js)

useEffect(() => {
  fetch("/api/tasks")
    .then((res) => res.json())
    .then((data) => setTasks(data));
}, []);
```

Os problemas desse padrão:

- **`useEffect` para buscar dados** → causa bugs de renderização, requisições duplicadas e código difícil de manter
- **Lógica misturada** → o mesmo arquivo cuidava da UI, do estado e de chamar a API ao mesmo tempo
- **Zustand como cache** → usar uma biblioteca de estado global para guardar dados do servidor não é o papel dela
- **Backend separado em Express** → para operações simples de CRUD, manter um servidor Node/Express separado adiciona complexidade desnecessária

> ⚠️ Funcionava? Sim. Mas era mais complexo do que precisava ser.

---

## 🎯 Objetivo

Reestruturar a aplicação usando corretamente os recursos do Next.js App Router:

- ✅ **Server Components** → buscar dados no servidor, sem precisar de `useEffect`
- ✅ **Server Actions** → fazer alterações no banco direto do client, sem criar rotas de API manualmente
- ✅ **TanStack Query** → gerenciar cache e estado assíncrono no client de forma previsível
- ✅ **Supabase + Drizzle** → banco de dados real com acesso tipado
- ✅ **Separação clara de responsabilidades** → cada parte do código tem um único papel

---

## 🧱 Tecnologias utilizadas

| Tecnologia                   | Para que serve nesse projeto                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Next.js 14+ (App Router)** | Framework principal. Permite misturar Server e Client Components na mesma aplicação                                      |
| **React + TypeScript**       | Construção da UI com tipagem estática para evitar erros em tempo de desenvolvimento                                      |
| **TanStack Query**           | Gerencia cache, loading, error e sincronização de dados no client — substitui o `useEffect` para fetch                   |
| **Supabase (Postgres)**      | Banco de dados PostgreSQL na nuvem, gratuito para estudos                                                                |
| **Drizzle ORM**              | Camada que permite escrever queries SQL com tipagem TypeScript, evitando erros de digitação e facilitando o autocomplete |

---

## 🏗️ Arquitetura — Como o projeto é organizado

A ideia central é: **cada camada tem uma responsabilidade única**.

```
📁 Estrutura de pastas

app/
├── api/
│   └── tasks/
│       └── route.ts        → API Route (leitura via HTTP para o TanStack)
├── actions/
│   └── task.actions.ts     → Server Actions (mutações: criar, editar, deletar)
├── components/
│   └── TaskList.tsx        → Client Component (interface do usuário)
└── page.tsx                → Server Component (página principal)

services/
└── task.service.ts         → Acesso ao banco de dados (Drizzle + Supabase)

db/
└── schema.ts               → Definição das tabelas do banco
```

---

## 📐 Camadas em detalhe

### 1️⃣ Banco de dados — Schema (Drizzle)

O schema define a estrutura da tabela. É como um "molde" do que cada registro vai ter.

```ts
// db/schema.ts

import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(), // ID gerado automaticamente
  title: text("title").notNull(), // Título obrigatório
  description: text("description"), // Descrição opcional
  status: text("status").default("todo"), // Status da tarefa
  createdAt: timestamp("created_at").defaultNow(), // Data preenchida automaticamente
});
```

---

### 2️⃣ Service — Camada de acesso ao banco

O Service é responsável **somente** por se comunicar com o banco. Não conhece nada sobre a UI nem sobre HTTP — só sabe buscar e salvar dados.

```ts
// services/task.service.ts

import { db } from "@/db";
import { tasks } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Task } from "@/lib/types";

// Busca todas as tarefas, ordenadas pela mais recente
// Nota: sem o .orderBy(), o banco retorna em ordem aleatória!
export async function getTasksService() {
  await db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

// Insere uma nova tarefa
export async function createTaskService(data: {
  title: string;
  description?: string;
}) {
  await db.insert(tasks).values(data);
}

// Atualiza campos específicos de uma tarefa pelo ID
export async function updateTaskService(id: string, data: Partial<Task>) {
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

// Remove uma tarefa pelo ID
export async function deleteTaskService(id: string) {
  await db.delete(tasks).where(eq(tasks.id, id));
}
```

> 💡 **Por que separar em Service?** Se você um dia trocar o Supabase por outro banco, só precisa mexer aqui — nenhuma outra parte do código precisa saber disso.

---

### 3️⃣ API Route — Expondo os dados para o client

O TanStack Query precisa de uma URL para buscar dados. A API Route cria esse endpoint de forma simples.

```ts
// app/api/tasks/route.ts

import { getTasksService } from "@/services/task.service";

// Queremos que o TanStack Query controle o cache, não o Next

export async function GET() {
  const data = await getTasksService();
  return Response.json(data);
  // Retorna: [{ id: 1, title: "...", status: "todo", ... }, ...]
}
```

---

### 4️⃣ Server Actions — Mutações sem criar rotas manualmente

Server Actions são funções que **rodam no servidor** mas podem ser chamadas diretamente do client. Funcionam como um "atalho" para não precisar criar rotas de API para cada operação de escrita.

```ts
// app/actions/task.actions.ts

"use server"; // ← Essa diretiva diz ao Next que essa função roda no servidor

import {
  createTaskService,
  updateTaskService,
  deleteTaskService,
} from "@/services/task.service";

export async function createTask(data: {
  title: string;
  description?: string;
}) {
  // 1. Validação — verifica se os dados estão corretos antes de salvar
  if (!data.title) {
    throw new Error("O título é obrigatório");
  }

  // 2. Chama o service para salvar no banco
  await createTaskService(data);

  // 3. O TanStack Query vai cuidar de atualizar a UI (via invalidateQueries)
}

export async function updateTask(id: number, data) {
  if (!id) throw new Error("ID inválido");

  await updateTaskService(id, data);
}

export async function deleteTask(id: number) {
  if (!id) throw new Error("ID inválido");

  await deleteTaskService(id);
}
```

> 💡 **Por que não usar uma API Route para isso também?** Para mutações simples, as Server Actions eliminam a necessidade de criar `/api/tasks/[id]` com método `POST`, `PATCH` e `DELETE`. Menos código, mesmo resultado.

---

### 5️⃣ Client + TanStack Query — Estado e cache no client

O TanStack Query substitui o `useEffect` + `useState` para gerenciar dados que vêm de uma API.

**Buscando dados (GET):**

```ts
import { useQuery } from "@tanstack/react-query";

export function Tasks() {
  return useQuery({
    queryKey: ["tasks"], // Chave única para identificar esse cache
    queryFn: fetchTask, // Função que busca os dados
    initialData,
    staleTime: 1000 * 60 * 2, // Dados ficam "frescos" por 2 minutos.
    //                            Enquanto frescos, não faz nova requisição
  });
}
```

**Criando uma tarefa (POST):**

```ts
// components/CreateTaskForm.tsx

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTask } from "@/app/actions/task.actions";

export function CreateTaskForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: TaskForm) => await createTask(data), // Chama a Server Action diretamente
    onSuccess: () => {
      // Após criar com sucesso, invalida o cache de "tasks"
      // O TanStack vai buscar os dados atualizados automaticamente
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
```

---

## 🔥 Fluxo completo de uma mutação

Aqui está o que acontece passo a passo quando o usuário cria uma tarefa:

```
1. Usuário preenche o formulário e clica em "Criar"
         ↓
2. useMutation chama a Server Action (createTask)
         ↓
3. Server Action valida os dados recebidos
         ↓
4. Server Action chama o Service (createTaskService)
         ↓
5. Service executa o INSERT no banco (Supabase via Drizzle)
         ↓
6. Banco confirma a operação
         ↓
7. onSuccess é chamado → invalidateQueries(["tasks"])
         ↓
8. TanStack Query detecta o cache inválido e faz novo fetch
         ↓
9. UI re-renderiza com a nova tarefa na lista ✅
```

---

## 🧠 Decisão de arquitetura — Quem controla o cache?

Uma das decisões mais importantes foi **deixar o TanStack Query controlar o cache**, em vez do Next.js.

|               | Next.js Cache                                                  | TanStack Query                                               |
| ------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| Como funciona | Automático, baseado em tempo                                   | Manual, você decide quando invalidar                         |
| Transparência | Implícito, difícil de rastrear                                 | Explícito, você vê exatamente o que acontece                 |
| Debug         | Difícil — quando os dados ficam "presos" é trabalhoso resolver | Fácil — o DevTools do TanStack mostra o estado de cada query |
| Ideal para    | Sites estáticos, conteúdo que muda pouco                       | Aplicações interativas com dados em tempo real               |

**Por isso:**

- Usamos `cache: "no-store"` no fetch → o Next.js não cacheia nada
- Não usamos `revalidatePath` → o Next.js não precisa saber quando revalidar
- O TanStack Query é o único responsável por decidir quando buscar dados novos

---

## 🔄 CRUD completo

| Operação             | Como é feito                           | Onde fica o código                             |
| -------------------- | -------------------------------------- | ---------------------------------------------- |
| **Listar** (GET)     | API Route → TanStack `useQuery`        | `app/api/tasks/route.ts` + `hooks/useTasks.ts` |
| **Criar** (POST)     | Server Action → TanStack `useMutation` | `app/actions/task.actions.ts`                  |
| **Editar** (PATCH)   | Server Action → TanStack `useMutation` | `app/actions/task.actions.ts`                  |
| **Deletar** (DELETE) | Server Action → TanStack `useMutation` | `app/actions/task.actions.ts`                  |

---

## 📚 Conceitos importantes para entender esse projeto

**Server Component vs Client Component**

- `Server Component` → roda no servidor, tem acesso direto ao banco, **não** pode usar hooks ou eventos do browser
- `Client Component` → roda no browser, pode usar `useState`, `useEffect`, eventos como `onClick`
- Regra prática: comece tudo como Server Component; adicione `"use client"` só quando precisar de interatividade

**Por que o banco retorna em ordem aleatória?**
Bancos relacionais não garantem ordem de retorno. Para sempre exibir as tarefas mais recentes primeiro, é obrigatório usar `.orderBy(desc(createdAt))`.

**O que é `invalidateQueries`?**
É como "avisar" o TanStack Query que os dados em cache podem estar desatualizados. Quando isso acontece, ele busca os dados novamente e atualiza a UI automaticamente.

---

## 📊 Antes vs Depois

| Aspecto             | ❌ Antes (SPA clássica)                       | ✅ Depois (App Router)                       |
| ------------------- | --------------------------------------------- | -------------------------------------------- |
| **Busca de dados**  | `useEffect` + `fetch` manual                  | TanStack Query com `useQuery`                |
| **Cache**           | Zustand (solução errada para o problema)      | TanStack Query (feito para isso)             |
| **Mutações**        | Express + `fetch` com `POST`/`PATCH`/`DELETE` | Server Actions (sem backend separado)        |
| **Banco de dados**  | API fake / mock                               | Supabase real com Drizzle ORM                |
| **Organização**     | Tudo misturado num arquivo só                 | Camadas separadas com responsabilidade única |
| **Previsibilidade** | Baixa — difícil saber de onde vem o bug       | Alta — fluxo linear e rastreável             |

---

## 🚀 Resultado

- ✅ Código mais limpo e fácil de entender
- ✅ Menos bugs de renderização
- ✅ Fluxo de dados previsível e rastreável
- ✅ Arquitetura escalável — fácil de adicionar novas features
- ✅ Sem backend separado para operações simples

---

## 🧠 Conclusão

A principal mudança não foi tecnológica — foi de **mentalidade**:

| Antes                          | Depois                                     |
| ------------------------------ | ------------------------------------------ |
| _"Como eu busco esses dados?"_ | _"Onde essa responsabilidade deve viver?"_ |
| Jogava tudo no mesmo lugar     | Cada camada tem um papel único             |
| Resolvia o sintoma             | Resolve a causa                            |

> Se você entender **quem é responsável pelo quê** em cada camada da aplicação, a escolha das ferramentas vira consequência natural — não o ponto de partida.
