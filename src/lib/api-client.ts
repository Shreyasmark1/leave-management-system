export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

async function toData<T>(response: Response): Promise<T> {
  const json = (await response.json().catch(() => null)) as
    | { status: boolean; data?: T; message?: string }
    | null;

  if (!response.ok) {
    throw new ApiError(response.status, json?.message ?? "Request failed.");
  }

  return json?.data as T;
}

export function apiGet<T>(url: string): Promise<T> {
  return fetch(url).then((response) => toData<T>(response));
}

export function apiPost<T>(url: string, body: unknown): Promise<T> {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((response) => toData<T>(response));
}

export function apiDelete<T>(url: string, params: Record<string, string>): Promise<T> {
  return fetch(`${url}?${new URLSearchParams(params)}`, { method: "DELETE" }).then((response) =>
    toData<T>(response)
  );
}
