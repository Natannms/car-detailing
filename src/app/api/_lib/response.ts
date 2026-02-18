import { NextResponse } from "next/server";
import type { DomainError } from "../../../domain/errors";
import { DomainError as DomainErrorBase } from "../../../domain/errors";
import { domainErrorToHttpStatus } from "../../../application/httpErrors";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export function json(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export function errorToResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: error.issues[0]?.message ?? "Requisição inválida" } },
      { status: 400 },
    );
  }

  const domainError = error instanceof DomainErrorBase ? (error as DomainError) : null;
  if (!domainError) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: { code: "CONFLICT", message: "Registro duplicado" } },
          { status: 409 },
        );
      }

      if (error.code === "P2025") {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Registro não encontrado" } },
          { status: 404 },
        );
      }

      if (error.code === "P2021" || error.code === "P2022") {
        return NextResponse.json(
          {
            error: {
              code: "DB_SCHEMA_MISMATCH",
              message: "Banco de dados desatualizado. Rode Prisma db push/migrations e reinicie o servidor.",
            },
          },
          { status: 500 },
        );
      }
    }

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { error: { code: "DB_CONNECTION", message: "Falha ao conectar no banco de dados" } },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Erro inesperado" } },
      { status: 500 },
    );
  }

  return NextResponse.json(
    { error: { code: domainError.code, message: domainError.message } },
    { status: domainErrorToHttpStatus(domainError) },
  );
}
