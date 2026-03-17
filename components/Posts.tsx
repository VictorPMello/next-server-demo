"use client";

import { useQuery } from "@tanstack/react-query";
import { getPosts, Post } from "@/lib/api";
import CreateButton from "./CreateButton";

export default function Posts({ initialData }: { initialData: Post[] }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
    initialData,
    staleTime: 1000 * 60 * 2,
    select: (data) =>
      data.slice(0, 15).map((post) => ({
        id: post.id,
        title: post.title.toUpperCase(),
      })),
  });

  if (isLoading) return <p>Carregando...</p>;

  return (
    <div>
      <button className="cursor-pointer" onClick={() => refetch()}>
        Atualizar
      </button>
      <CreateButton />

      {data.map((post) => (
        <div key={post.id}>
          <h3>{post.title}</h3>
        </div>
      ))}
    </div>
  );
}
