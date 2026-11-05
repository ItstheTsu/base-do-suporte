export class ApiError extends Error {
  status: number;
  fields: { field: string; message: string }[];
  constructor(
    status: number,
    message: string,
    fields: { field: string; message: string }[] = [],
  ) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    const data = await response
      .json()
      .catch(() => ({ message: "Não foi possível acessar o serviço." }));
    throw new ApiError(response.status, data.message, data.fields);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export function queryString(values: Record<string, string>) {
  return new URLSearchParams(
    Object.entries(values).filter(([, value]) => value !== ""),
  ).toString();
}
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(date));
export const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Não foi possível concluir a operação.";
