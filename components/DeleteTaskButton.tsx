"use client";

import { deleteTask } from "@/app/actions";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function DeleteTaskButton({ id }: { id: string }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string) => await deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return (
    <button onClick={() => mutation.mutate(id)} className="cursor-pointer">
      Deletar
    </button>
  );
}
