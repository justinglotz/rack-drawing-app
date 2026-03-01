import { z } from "zod";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_URL environment variable is not defined");
}

export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!res.ok) {
    const message = await res.text();
    const isDev = process.env.NODE_ENV !== "production";
    throw new Error(isDev ? (message || "Request failed") : "Request failed");
  }

  const data = await res.json();
  return schema.parse(data);
}
