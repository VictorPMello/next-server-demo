import FormTask from "@/components/FormTask";
import Tasks from "@/components/Tasks";
import { getTasks } from "@/services/tasks.service";

export default async function Home() {
  const initialData = await getTasks();

  return (
    <>
      <Tasks initialData={initialData} />
      <FormTask />
    </>
  );
}
