import { env } from "@/config/env";
import { errorResponse } from "@/lib/response";
import {
  AppError,
  classifyDatabaseError,
  type DriverErrorFields,
} from "@/lib/errors";

export interface ErrorHandlerOptions {
  // Inclui a mensagem crua do driver na resposta. Padrão: só em development.
  exposeDetails?: boolean;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function describeError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: String(error), sqlState: null, driverCode: null };
  }
  const fields = error as DriverErrorFields;
  return {
    message: readString(fields.message) ?? String(error),
    sqlState: readString(fields.errno),
    driverCode: readString(fields.code),
    hint: readString(fields.hint),
    detail: readString(fields.detail),
    table: readString(fields.table),
    column: readString(fields.column),
  };
}

export function errorHandler(
  error: unknown,
  req?: Request,
  options: ErrorHandlerOptions = {},
): Response {
  if (error instanceof AppError) {
    return errorResponse(error.code, error.message, error.status);
  }

  const exposeDetails =
    options.exposeDetails ?? env.NODE_ENV === "development";
  const requestId = crypto.randomUUID().slice(0, 8);
  const classified = classifyDatabaseError(error);
  const details = describeError(error);

  // O requestId da resposta é o mesmo do log, para achar a causa a partir da tela.
  const route = req ? `${req.method} ${new URL(req.url).pathname}` : "-";
  const code = classified?.code ?? "INTERNAL_ERROR";
  const reason = [details.driverCode, details.sqlState].filter(Boolean).join(" ");
  console.error(
    `[${requestId}] ${route} → ${code}${reason ? ` (${reason})` : ""}: ${details.message}`,
  );
  console.error(error);

  const extra: Record<string, unknown> = { code, requestId };
  if (exposeDetails) {
    extra.details = details;
  }

  if (classified) {
    return errorResponse(
      classified.error,
      classified.message,
      classified.status,
      extra,
    );
  }

  return errorResponse(
    "Internal Server Error",
    `Ocorreu um erro interno ao processar a requisição. Informe o código ${requestId} para localizar a causa no log do servidor.`,
    500,
    extra,
  );
}
