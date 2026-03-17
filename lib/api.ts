export type Post = {
  id: number;
  userId: number;
  body: string;
  title: string;
};

export async function getPosts(): Promise<Post[]> {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts");
  return res.json();
}
