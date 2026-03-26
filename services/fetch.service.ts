import { http } from "@/lib/http";
import { Task } from "@/lib/types";

export async function fetchTask(): Promise<Task[]> {
  return http<Task[]>(`${process.env.NEXT_PUBLIC_APP_URL}/api/tasks`);
}
