# Next.js App Router — Da mentalidade SPA para Full Stack

> Uma mudança de mentalidade: de "fazer funcionar" para "entender o fluxo e a arquitetura".

---

## O problema

Eu usava Next.js praticamente como uma SPA convencional:

- Fetches dentro de `useEffect`
- Lógica de dados, estado e UI misturados no mesmo componente
- Zustand para tentar simular cache de dados
- Backend separado em Node.js/Express para mutações simples
- Bugs de re-renderização e requisições desnecessárias

Tudo funcionava — mas com complexidade e inconsistência desnecessárias.

---

## Objetivo

Reestruturar a aplicação usando corretamente:

- **Server Components** para fetch de dados no servidor
- **Server Actions** para mutações sem backend separado
- **TanStack Query** para estado assíncrono no cliente
- **Separação clara de responsabilidades** entre UI, dados e estado

---

## Tecnologias

| Tecnologia           | Uso                       |
| -------------------- | ------------------------- |
| Next.js (App Router) | Framework principal       |
| React + TypeScript   | UI e tipagem              |
| TanStack Query       | Estado assíncrono e cache |
| JSONPlaceholder      | API fake para testes      |

---

## Arquitetura

### 1. Server Component — fetch inicial no servidor

```tsx
// app/page.tsx
export default async function Home() {
  const data = await getPosts();
  return <Posts initialData={data} />;
}
```

Dados buscados no servidor antes de chegar ao cliente. Sem `useEffect`, sem estado de loading manual.

---

### 2. Camada HTTP + Service — separação de infraestrutura e lógica

A aplicação separa o acesso à API em duas camadas distintas:

**`lib/http.ts` — cliente HTTP genérico**

```ts
// lib/http.ts
export async function http<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

  return res.json();
}
```

**`services/posts.service.ts` — lógica de domínio**

```ts
// services/posts.service.ts
import { Post } from "@/lib/types";
import { http } from "@/lib/http";

const BASE_URL = "https://jsonplaceholder.typicode.com";

export async function getPosts(): Promise<Post[]> {
  return http<Post[]>(`${BASE_URL}/posts`);
}

export async function createPost(data: Partial<Post>): Promise<Post> {
  return http<Post>(`${BASE_URL}/posts`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
```

**Por que isso é melhor do que um `fetch` direto?**

|                       | `fetch` direto                      | `http()` + `service`                         |
| --------------------- | ----------------------------------- | -------------------------------------------- |
| Headers repetidos     | Em cada chamada                     | Centralizados em um lugar                    |
| Tratamento de erro    | Duplicado por toda a base           | Único, consistente                           |
| Troca de API/base URL | Editar múltiplos arquivos           | Alterar só o `service`                       |
| Testabilidade         | Mockar `fetch` em cada teste        | Mockar `http` ou o `service` inteiro         |
| Legibilidade          | Detalhes HTTP misturados com lógica | Intenção clara: `getPosts()`, `createPost()` |

Na prática: o `http` é infraestrutura (como fazer a requisição), o `service` é domínio (o que requisitar). Quem chama `getPosts()` não precisa saber nada sobre `fetch`, headers ou status codes.

---

### 3. Server Action — mutações sem backend separado

```ts
// actions/posts.ts
"use server";
import { createPost } from "@/services/posts.service";

export async function createPostAction() {
  return await createPost({
    title: "Novo post",
    body: "Teste",
    userId: 1,
  });
}
```

A lógica de mutação fica no servidor. Nada de rotas API ou Express para casos simples.

---

### 4. Client Component + TanStack Query — interatividade e cache

```ts
const mutation = useMutation({
  mutationFn: createPostAction,
  onSuccess: () => {
    queryClient.setQueriesData(["posts"], (old) => [
      { id: 10000, title: "Novo post (fake)", body: "Teste", userId: 1 },
      ...old,
    ]);
  },
});
```

**O que é uma mutation?**

No TanStack Query, `useMutation` é o hook para operações que **modificam dados** — POST, PATCH, DELETE. É o oposto do `useQuery`, que apenas lê.

A separação faz sentido: leitura e escrita têm comportamentos diferentes. `useQuery` roda automaticamente, tem cache e re-fetch. `useMutation` só executa quando você chama `mutation.mutate()` — você tem controle total sobre quando disparar.

**O que cada parte faz:**

```ts
mutationFn: createPostAction;
// a função que será executada — neste caso, a Server Action
```

```ts
onSuccess: () => { ... }
// callback disparado após a mutação ter sucesso
// aqui atualizamos o cache do React Query manualmente
```

**Por que atualizar o cache manualmente em vez de re-fetch?**

`queryClient.setQueriesData` injeta o novo item diretamente no cache local, sem fazer uma nova requisição à API. A UI atualiza instantaneamente — o usuário não percebe latência, assumimos que o servidor aceitou, e atualizamos a tela antes de confirmar.

Para além do `onSuccess`, o hook expõe outros estados úteis:

```ts
mutation.isPending; // requisição em andamento → desabilitar botão, mostrar spinner
mutation.isError; // algo deu errado → exibir mensagem de erro
mutation.isSuccess; // concluído com sucesso → mostrar feedback positivo
```

O cliente só lida com interação e sincronização de estado — não com fetch bruto.

---

## Fluxo da aplicação

```
Client (UI)
    ↓  interação do usuário
Server Action
    ↓  lógica no servidor
Fetch (API externa)
    ↓  resposta
TanStack Query
    ↓  atualiza o cache
Client (UI re-renderiza)
```

---

## Antes vs. Depois

| Aspecto        | Antes (SPA)              | Depois (App Router)         |
| -------------- | ------------------------ | --------------------------- |
| Fetch de dados | `useEffect` no cliente   | Server Component            |
| Cache          | Zustand manual           | TanStack Query              |
| Mutações       | Backend Express separado | Server Actions              |
| Organização    | Lógica misturada na UI   | Responsabilidades separadas |
| Re-renders     | Imprevisíveis            | Fluxo controlado            |

---

## Principais aprendizados

**Nem tudo precisa ser client-side.**
Server Components eliminam a necessidade de `useEffect` para a maioria dos fetches.

**`useEffect` não é a solução padrão para dados.**
Grande parte dos problemas que eu tinha vinha exatamente desse padrão.

**Server Actions simplificam mutações.**
Para a maioria dos casos de uso, um backend separado é desnecessário.

**TanStack Query resolve o estado assíncrono de forma robusta.**
Cache automático, controle de loading/error e sincronização — sem código manual.

**Separação de responsabilidades muda tudo:**

- **UI** → Client Components
- **Lógica de dados** → Servidor (Server Components + Actions)
- **Estado assíncrono** → TanStack Query

---

## Referências

- [Next.js App Router — Documentação oficial](https://nextjs.org/docs/app)
- [TanStack Query](https://tanstack.com)
- [JSONPlaceholder](https://jsonplaceholder.typicode.com)
