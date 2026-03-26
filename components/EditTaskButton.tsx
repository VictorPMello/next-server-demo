"use client";

import { updateTask } from "@/app/actions";
import { Task } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function EditTaskButton({ id, task }: { id: string; task: Task }) {
  const { status } = task;
  console.log(status);

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: Partial<Task>) => await updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  return (
    <button onClick={() => mutation.mutate({ status: "done" })}>Editar</button>
  );
}
