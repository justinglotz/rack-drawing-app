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
    const responseText = await res.text();
    const isDev = process.env.NODE_ENV !== "production";
    const error = new Error(
      isDev ? (responseText || "Request failed") : "Request failed"
    ) as Error & { status: number; responseText?: string };
    error.status = res.status;
    error.responseText = responseText;
    throw error;
  }

  const data = await res.json();
  return schema.parse(data);
}
