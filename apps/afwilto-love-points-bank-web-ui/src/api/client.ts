// Cliente fetch tipado. Fija el header X-Member-Id y traduce los errores RFC 7807
// del backend a un ApiError con el `code` de dominio, para que la interfaz muestre
// el mensaje junto al campo correcto.

// En standalone, "/api/v1" queda relativo al origen actual (el proxy nginx/vite lo
// reenvía al mismo). Embebido como remote en la plataforma AFWILTO, la página vive en
// el origen del shell host, no en el de este contenedor: VITE_API_URL da la base
// absoluta hacia la API real. Se lee en cada llamada (no memoizado a nivel de módulo)
// para que sea observable/testeable igual que cualquier otra dependencia externa.
function base(): string {
  const origin = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  return `${origin}/api/v1`;
}

export interface Problem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
}

export class ApiError extends Error {
  status: number;
  code: string;
  detail: string;
  constructor(status: number, problem: Problem) {
    super(problem.detail || problem.title || `HTTP ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = problem.code ?? "unknown";
    this.detail = problem.detail ?? "";
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  member?: string; // X-Member-Id
  signal?: AbortSignal;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.member) headers["X-Member-Id"] = opts.member;

  const res = await fetch(base() + path, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });

  if (!res.ok) {
    let problem: Problem = {};
    try {
      problem = await res.json();
    } catch {
      /* respuesta sin cuerpo: dejamos el problem vacío */
    }
    throw new ApiError(res.status, problem);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
