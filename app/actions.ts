"use server";

import { createPost } from "@/services/posts.service";

export async function createPostAction() {
  return await createPost({
    title: "Novo post",
    body: "Teste",
    userId: 1,
  });
}
