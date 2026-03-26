"use server";

import { Task, TaskForm } from "@/lib/types";
import {
  createTaskService,
  deleteTaskService,
  updateTaskService,
} from "@/services/tasks.service";

export async function createTask(data: TaskForm) {
  if (!data.title) throw new Error("Title not found!");

  await createTaskService(data);
}

export async function updateTask(id: string, data: Partial<Task>) {
  if (!id) throw new Error("Id not found!");

  await updateTaskService(id, data);
}

export async function deleteTask(id: string) {
  if (!id) throw new Error("Id not found!");
  await deleteTaskService(id);
}
