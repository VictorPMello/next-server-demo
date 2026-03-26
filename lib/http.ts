export async function http<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options?.headers,
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

  return res.json();
}
