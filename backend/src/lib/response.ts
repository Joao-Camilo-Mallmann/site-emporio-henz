export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function jsonResponse(
  data: unknown,
  status = 200,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

export function corsPreflightResponse(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export function ok(data: unknown): Response {
  return jsonResponse(data, 200);
}

export function created(data: unknown): Response {
  return jsonResponse(data, 201);
}

export function noContent(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export function errorResponse(
  error: string,
  message: string,
  status = 400,
): Response {
  return jsonResponse({ error, message }, status);
}

export function badRequest(
  message = "Dados da requisição inválidos.",
): Response {
  return errorResponse("Bad Request", message, 400);
}

export function unauthorized(message = "Não autorizado."): Response {
  return errorResponse("Unauthorized", message, 401);
}

export function forbidden(
  message = "Você não possui permissão para executar esta ação.",
): Response {
  return errorResponse("Forbidden", message, 403);
}

export function notFound(message = "Recurso não encontrado."): Response {
  return errorResponse("Not Found", message, 404);
}

export function conflict(message = "Conflito de dados."): Response {
  return errorResponse("Conflict", message, 409);
}

export function internalServerError(
  message = "Ocorreu um erro interno ao processar a requisição.",
): Response {
  return errorResponse("Internal Server Error", message, 500);
}
