"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPostAction } from "@/app/actions";

import { Post } from "@/lib/types";

export default function CreateButton() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      await createPostAction();
    },
    //    onSuccess: () => {
    //      queryClient.invalidateQueries({ queryKey: ["posts"] });
    //    },
    onSuccess: () => {
      queryClient.setQueriesData({ queryKey: ["posts"] }, (old: Post[]) => [
        {
          id: 10000,
          title: "Novo post (fake)",
          body: "Teste",
          userId: 1,
        },
        ...old,
      ]);
    },
  });

  return (
    <button
      className="cursor-pointer mx-2"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? "Criando..." : "Criar post"}
    </button>
  );
}
