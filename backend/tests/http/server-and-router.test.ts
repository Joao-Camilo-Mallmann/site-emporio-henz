import { describe, expect, it } from "bun:test";
import { handleRequest } from "@/app";
import { Router } from "@/lib/router";
import { ok } from "@/lib/response";
import { errorHandler } from "@/middlewares/error";

describe("Roteador Nativo e Servidor HTTP", () => {
  it("deve responder 200 no healthcheck GET /api/v1/health com status ok", async () => {
    const req = new Request("http://localhost:3001/api/v1/health", {
      method: "GET",
    });

    const res = await handleRequest(req);
    expect(res.status).toBe(200);

    const data = (await res.json()) as { status: string; uptime: number; timestamp: string };
    expect(data.status).toBe("ok");
    expect(data.timestamp).toBeDefined();
    expect(typeof data.uptime).toBe("number");
  });

  it("deve responder 204 com cabeçalhos CORS em requisições preflight OPTIONS", async () => {
    const req = new Request("http://localhost:3001/api/v1/users", {
      method: "OPTIONS",
    });

    const res = await handleRequest(req);
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });

  it("deve responder 404 padronizado para rota inexistente", async () => {
    const req = new Request("http://localhost:3001/api/v1/rota-inexistente-123", {
      method: "GET",
    });

    const res = await handleRequest(req);
    expect(res.status).toBe(404);

    const data = (await res.json()) as { error: string; message: string };
    expect(data.error).toBe("Not Found");
    expect(data.message).toBeDefined();
  });

  it("deve extrair parâmetros de rota corretamente no roteador", async () => {
    const router = new Router();
    let capturedParam = "";

    router.get("/users/:id", (_req, ctx) => {
      capturedParam = ctx.params.id;
      return ok({ id: ctx.params.id });
    });

    const req = new Request("http://localhost/users/uuid-teste-999");
    const res = await router.handle(req);

    expect(res).not.toBeNull();
    expect(res?.status).toBe(200);
    expect(capturedParam).toBe("uuid-teste-999");
  });

  it("deve responder 500 genérico sem expor a mensagem interna do erro", async () => {
    const res = errorHandler(
      new Error(
        'duplicate key value violates unique constraint "idx_categories_slug_active"',
      ),
      undefined,
      { exposeDetails: false },
    );
    expect(res.status).toBe(500);

    const data = (await res.json()) as ErrorBody;
    expect(data.error).toBe("Internal Server Error");
    expect(data.code).toBe("INTERNAL_ERROR");
    expect(data.requestId).toHaveLength(8);
    expect(data.message).toContain(data.requestId);
    expect(data.message).not.toContain("idx_categories_slug_active");
    expect(data.details).toBeUndefined();
  });
});

interface ErrorBody {
  error: string;
  message: string;
  code: string;
  requestId: string;
  details?: { message: string; sqlState: string | null };
}

// Imita o PostgresError do Bun.SQL: `code` do driver e SQLSTATE em `errno`.
function postgresError(message: string, code: string, errno?: string) {
  return Object.assign(new Error(message), {
    name: "PostgresError",
    code,
    errno,
  });
}

describe("errorHandler com falhas do PostgreSQL", () => {
  const quiet = { exposeDetails: false };

  it("responde 503 DATABASE_UNAVAILABLE quando não conecta no banco", async () => {
    const res = errorHandler(
      postgresError("Failed to connect", "ERR_POSTGRES_CONNECTION_REFUSED"),
      undefined,
      quiet,
    );
    expect(res.status).toBe(503);
    expect(((await res.json()) as ErrorBody).code).toBe("DATABASE_UNAVAILABLE");
  });

  it("responde 503 DATABASE_UNAVAILABLE para host inexistente", async () => {
    const res = errorHandler(
      Object.assign(new Error("getaddrinfo ENOTFOUND postgres"), {
        code: "ENOTFOUND",
      }),
      undefined,
      quiet,
    );
    expect(res.status).toBe(503);
    expect(((await res.json()) as ErrorBody).code).toBe("DATABASE_UNAVAILABLE");
  });

  it("responde 503 DATABASE_AUTH_FAILED com senha errada", async () => {
    const res = errorHandler(
      postgresError(
        'password authentication failed for user "postgres"',
        "ERR_POSTGRES_SERVER_ERROR",
        "28P01",
      ),
      undefined,
      quiet,
    );
    expect(res.status).toBe(503);
    expect(((await res.json()) as ErrorBody).code).toBe("DATABASE_AUTH_FAILED");
  });

  it("responde 500 DATABASE_SCHEMA_OUTDATED quando falta tabela", async () => {
    const res = errorHandler(
      postgresError(
        'relation "products" does not exist',
        "ERR_POSTGRES_SERVER_ERROR",
        "42P01",
      ),
      undefined,
      quiet,
    );
    expect(res.status).toBe(500);

    const data = (await res.json()) as ErrorBody;
    expect(data.code).toBe("DATABASE_SCHEMA_OUTDATED");
    expect(data.message).toContain("bun run migrate");
    expect(data.details).toBeUndefined();
  });

  it("responde 409 FOREIGN_KEY_VIOLATION para chave estrangeira", async () => {
    const res = errorHandler(
      postgresError("violates foreign key", "ERR_POSTGRES_SERVER_ERROR", "23503"),
      undefined,
      quiet,
    );
    expect(res.status).toBe(409);
    expect(((await res.json()) as ErrorBody).code).toBe("FOREIGN_KEY_VIOLATION");
  });

  it("inclui o detalhe cru do driver só quando exposeDetails está ligado", async () => {
    const res = errorHandler(
      postgresError(
        'relation "products" does not exist',
        "ERR_POSTGRES_SERVER_ERROR",
        "42P01",
      ),
      new Request("http://localhost:3001/api/v1/produtos"),
      { exposeDetails: true },
    );

    const data = (await res.json()) as ErrorBody;
    expect(data.details?.message).toBe('relation "products" does not exist');
    expect(data.details?.sqlState).toBe("42P01");
  });
});
