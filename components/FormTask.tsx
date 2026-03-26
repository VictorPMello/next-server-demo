"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskForm } from "@/lib/types";
import { useRef } from "react";
import { createTask } from "@/app/actions";

export default function FormTask() {
  const queryClient = useQueryClient();

  const formRef = useRef<HTMLFormElement>(null);

  const mutation = useMutation({
    mutationFn: async (data: TaskForm) => await createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      formRef.current?.reset();
    },
  });

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        const data = {
          title: formData.get("title") as string,
          description: formData.get("description") as string,
          status: formData.get("status") as string,
        };

        mutation.mutate(data);
      }}
    >
      <input name="title" />
      <input name="description" />
      <select name="status" defaultValue="todo">
        <option value="todo">Todo</option>
        <option value="doing">Doing</option>
        <option value="done">Done</option>
      </select>
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Criando..." : "Criar"}
      </button>
    </form>
  );
}
