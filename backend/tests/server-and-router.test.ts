import { describe, expect, it } from "bun:test";
import { handleRequest } from "@/app";
import { Router } from "@/lib/router";
import { ok } from "@/lib/response";

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
});
