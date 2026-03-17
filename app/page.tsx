import Posts from "@/components/Posts";
import { getPosts } from "@/lib/api";

export default async function Home() {
  const data = await getPosts();

  return <Posts initialData={data} />;
}
