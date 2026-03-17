import { Post } from "@/lib/types";
import { http } from "@/lib/http";

const BASE_URL = "https://jsonplaceholder.typicode.com";

export async function getPosts(): Promise<Post[]> {
  return http<Post[]>(`${BASE_URL}/posts`);
}

export async function createPost(data: Partial<Post>) {
  return http<Post>(`${BASE_URL}/posts`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
