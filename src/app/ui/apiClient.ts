"use client";

import { clearSession } from "./session";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");

  const res = await fetch(path, {
    ...init,
    headers,
    body: init?.json ? JSON.stringify(init.json) : init?.body,
    credentials: "same-origin",
  });

  if (res.status === 401) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new ApiError(401, "UNAUTHORIZED", "Sessão inválida");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const code = data?.error?.code ?? "HTTP_ERROR";
    const message = data?.error?.message ?? "Erro na requisição";
    throw new ApiError(res.status, code, message);
  }

  return data as T;
}
