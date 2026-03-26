import { getTasks } from "@/services/tasks.service";

export async function GET() {
  const data = await getTasks();
  return Response.json(data);
}
