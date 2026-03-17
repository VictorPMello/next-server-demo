"use server";

export async function createPost() {
  await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    body: JSON.stringify({
      title: "Novo post",
      body: "Teste",
      userId: 1,
    }),
    headers: { "Content-Type": "application/json" },
  });
}
