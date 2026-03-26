"use client";

import { Task } from "@/lib/types";
import { fetchTask } from "@/services/fetch.service";
import { useQuery } from "@tanstack/react-query";
import { EditTaskButton } from "./EditTaskButton";
import { DeleteTaskButton } from "./DeleteTaskButton";

export default function Tasks({ initialData }: { initialData: Task[] }) {
  const { data, isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTask,
    initialData,
    initialDataUpdatedAt: 0,
    staleTime: 30 * 1000,
  });

  if (isLoading) return <p>Carregando...</p>;

  return (
    <div>
      {data.map((task: Task) => (
        <div className="flex gap-2" key={task.id}>
          <h1>{task.title}</h1>
          <p>{task.description}</p>
          <p>{task.status}</p>
          <div className="flex gap-2">
            <EditTaskButton id={task.id} task={task} />
            <DeleteTaskButton id={task.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
