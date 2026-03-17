import Posts from "@/components/Posts";
import { getPosts } from "@/services/posts.service";

export default async function Home() {
  const data = await getPosts();

  return <Posts initialData={data} />;
}
