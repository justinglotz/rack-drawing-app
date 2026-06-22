import { z } from "zod";

// In the browser, requests go through the host's published port (NEXT_PUBLIC_API_URL).
// During server-side rendering inside Docker, "localhost" is the frontend container,
// so server-side requests use INTERNAL_API_URL (e.g. http://backend:8000/api) when set.
const API_BASE_URL =
  typeof window === "undefined"
    ? process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_URL;

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
