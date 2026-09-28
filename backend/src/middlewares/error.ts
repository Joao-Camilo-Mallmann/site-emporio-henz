import { errorResponse, internalServerError } from "@/lib/response";
import { AppError } from "@/lib/errors";

export function errorHandler(error: unknown): Response {
  if (error instanceof AppError) {
    return errorResponse(error.code, error.message, error.status);
  }

  console.error("Erro interno não capturado no servidor:", error);
  const message =
    error instanceof Error
      ? error.message
      : "Ocorreu um erro interno ao processar a requisição.";

  return internalServerError(message);
}
