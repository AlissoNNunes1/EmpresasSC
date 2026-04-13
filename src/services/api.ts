type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestConfig = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
};

export async function apiRequest<T>(url: string, config: RequestConfig = {}): Promise<T> {
  const response = await fetch(url, {
    method: config.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(config.headers ?? {}),
    },
    body: config.body !== undefined ? JSON.stringify(config.body) : undefined,
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? "Falha na comunicacao com a API.");
  }

  return (await response.json()) as T;
}

//   __  ____ ____ _  _ 
// / _\/ ___) ___) )( \
// /    \___ \___ ) \/ (
// \_/\_(____(____|____/
