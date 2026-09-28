export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(message: string, status = 400, code = "Bad Request") {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "AppError";
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Dados da requisição inválidos.") {
    super(message, 400, "Bad Request");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado.") {
    super(message, 401, "Unauthorized");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Você não possui permissão para executar esta ação.") {
    super(message, 403, "Forbidden");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado.") {
    super(message, 404, "Not Found");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflito de dados.") {
    super(message, 409, "Conflict");
  }
}
