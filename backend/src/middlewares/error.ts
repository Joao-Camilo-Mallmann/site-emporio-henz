import { errorResponse, internalServerError } from "@/lib/response";
import { AppError } from "@/lib/errors";

export function errorHandler(error: unknown): Response {
  if (error instanceof AppError) {
    return errorResponse(error.code, error.message, error.status);
  }

  // O detalhe da falha (mensagem do driver, constraint, stack) fica só no log do servidor.
  console.error("Erro interno não capturado no servidor:", error);
  return internalServerError();
}
