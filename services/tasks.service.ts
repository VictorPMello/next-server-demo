import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { Task, TaskForm } from "@/lib/types";
import { desc, eq } from "drizzle-orm";

export async function getTasks() {
  await db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function createTaskService(data: TaskForm) {
  await db.insert(tasks).values(data);
}

export async function updateTaskService(id: string, data: Partial<Task>) {
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTaskService(id: string) {
  await db.delete(tasks).where(eq(tasks.id, id));
}
