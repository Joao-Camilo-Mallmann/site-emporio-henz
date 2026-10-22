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

// SQLSTATE 23505 (unique_violation) do PostgreSQL; o Bun.SQL expõe o código em `errno`.
export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { code, errno } = error as { code?: unknown; errno?: unknown };
  return errno === "23505" || code === "23505";
}

// Campos que o PostgresError do Bun.SQL (e erros de sistema como ECONNREFUSED)
// podem trazer. Todos opcionais: o objeto pode vir de qualquer lugar.
export interface DriverErrorFields {
  name?: unknown;
  code?: unknown;
  errno?: unknown;
  message?: unknown;
  hint?: unknown;
  detail?: unknown;
  table?: unknown;
  column?: unknown;
}

// Erro inesperado já traduzido para algo que dá para entender e agir.
export interface ClassifiedError {
  status: number;
  error: string;
  code: string;
  message: string;
}

const SQLSTATE = {
  UNDEFINED_TABLE: "42P01",
  UNDEFINED_COLUMN: "42703",
  UNDEFINED_FUNCTION: "42883",
  INVALID_PASSWORD: "28P01",
  INVALID_AUTHORIZATION: "28000",
  INVALID_CATALOG: "3D000",
  FOREIGN_KEY_VIOLATION: "23503",
  NOT_NULL_VIOLATION: "23502",
  CHECK_VIOLATION: "23514",
  INVALID_TEXT_REPRESENTATION: "22P02",
} as const;

const NETWORK_ERROR_CODES = new Set([
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ETIMEDOUT",
  "ECONNRESET",
]);

function readSqlState(error: DriverErrorFields): string | null {
  if (typeof error.errno === "string") return error.errno;
  // Alguns drivers põem o SQLSTATE (5 caracteres) direto em `code`.
  if (typeof error.code === "string" && /^[0-9A-Z]{5}$/.test(error.code)) {
    return error.code;
  }
  return null;
}

function isConnectionFailure(error: DriverErrorFields): boolean {
  const code = typeof error.code === "string" ? error.code : "";
  return (
    code.startsWith("ERR_POSTGRES_CONNECTION") ||
    code === "ERR_POSTGRES_IDLE_TIMEOUT" ||
    NETWORK_ERROR_CODES.has(code)
  );
}

// Traduz falhas conhecidas do PostgreSQL em resposta com código estável. Erros
// desconhecidos devolvem null e viram o 500 genérico no errorHandler.
export function classifyDatabaseError(error: unknown): ClassifiedError | null {
  if (!error || typeof error !== "object") return null;
  const fields = error as DriverErrorFields;

  if (isConnectionFailure(fields)) {
    return {
      status: 503,
      error: "Service Unavailable",
      code: "DATABASE_UNAVAILABLE",
      message:
        "Banco de dados indisponível. Verifique se o PostgreSQL está rodando e se POSTGRES_HOST/POSTGRES_PORT estão corretos.",
    };
  }

  switch (readSqlState(fields)) {
    case SQLSTATE.INVALID_PASSWORD:
    case SQLSTATE.INVALID_AUTHORIZATION:
      return {
        status: 503,
        error: "Service Unavailable",
        code: "DATABASE_AUTH_FAILED",
        message:
          "Falha de autenticação no banco de dados. Confira POSTGRES_USER e POSTGRES_PASSWORD.",
      };
    case SQLSTATE.INVALID_CATALOG:
      return {
        status: 503,
        error: "Service Unavailable",
        code: "DATABASE_NOT_FOUND",
        message: "O banco de dados configurado em POSTGRES_DB não existe.",
      };
    case SQLSTATE.UNDEFINED_TABLE:
    case SQLSTATE.UNDEFINED_COLUMN:
    case SQLSTATE.UNDEFINED_FUNCTION:
      return {
        status: 500,
        error: "Internal Server Error",
        code: "DATABASE_SCHEMA_OUTDATED",
        message:
          "A estrutura do banco de dados está desatualizada. Rode `bun run migrate` no backend.",
      };
    case SQLSTATE.FOREIGN_KEY_VIOLATION:
      return {
        status: 409,
        error: "Conflict",
        code: "FOREIGN_KEY_VIOLATION",
        message: "O registro relacionado não existe ou ainda está em uso.",
      };
    case SQLSTATE.NOT_NULL_VIOLATION:
    case SQLSTATE.CHECK_VIOLATION:
    case SQLSTATE.INVALID_TEXT_REPRESENTATION:
      return {
        status: 400,
        error: "Bad Request",
        code: "INVALID_DATA",
        message: "Dado inválido ou campo obrigatório ausente.",
      };
    default:
      return null;
  }
}
