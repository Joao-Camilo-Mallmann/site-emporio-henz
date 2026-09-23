import { describe, expect, it } from "bun:test";
import { env } from "@/config/env";
import { signJwt } from "@/lib/jwt";
import { RequestContext } from "@/lib/router";
import { authMiddleware } from "@/middlewares/auth";
import { requireRole, ROLES } from "@/middlewares/role";

describe("Middlewares de Segurança: Bearer JWT e RBAC", () => {
  describe("authMiddleware", () => {
    it("deve rejeitar requisição sem cabeçalho Authorization com 401", async () => {
      const req = new Request("http://localhost/api/v1/auth/me");
      const ctx: RequestContext = { params: {}, url: new URL(req.url) };

      const res = await authMiddleware(req, ctx);
      expect(res).toBeDefined();
      expect(res?.status).toBe(401);

      const body = (await res?.json()) as { error: string; message: string };
      expect(body.error).toBe("Unauthorized");
    });

    it("deve rejeitar cabeçalho Authorization que não seja Bearer com 401", async () => {
      const req = new Request("http://localhost/api/v1/auth/me", {
        headers: { Authorization: "Basic dXNlcjpwYXNz" },
      });
      const ctx: RequestContext = { params: {}, url: new URL(req.url) };

      const res = await authMiddleware(req, ctx);
      expect(res?.status).toBe(401);
    });

    it("deve rejeitar token JWT inválido ou expirado com 401", async () => {
      const req = new Request("http://localhost/api/v1/auth/me", {
        headers: { Authorization: "Bearer token-invalido-xyz" },
      });
      const ctx: RequestContext = { params: {}, url: new URL(req.url) };

      const res = await authMiddleware(req, ctx);
      expect(res?.status).toBe(401);
    });

    it("deve anexar os dados do usuário ao contexto quando o token for válido", async () => {
      const token = await signJwt(
        {
          id: "usuario-uuid-1",
          email: "vendedor@emporio.com.br",
          role: ROLES.SELLER,
        },
        env.JWT_SECRET,
      );

      const req = new Request("http://localhost/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ctx: RequestContext = { params: {}, url: new URL(req.url) };

      const res = await authMiddleware(req, ctx);
      expect(res).toBeUndefined(); // middleware não interrompe execução
      expect(ctx.user).toBeDefined();
      expect(ctx.user?.id).toBe("usuario-uuid-1");
      expect(ctx.user?.email).toBe("vendedor@emporio.com.br");
      expect(ctx.user?.role).toBe(ROLES.SELLER);
    });
  });

  describe("requireRole (RBAC Guard)", () => {
    it("deve bloquear com 403 Forbidden quando usuário tem papel insuficiente", async () => {
      const guard = requireRole(ROLES.ADMIN);
      const req = new Request("http://localhost/api/v1/users");
      const ctx: RequestContext = {
        params: {},
        url: new URL(req.url),
        user: {
          id: "cli-1",
          email: "cliente@emporio.com.br",
          role: ROLES.CUSTOMER,
        },
      };

      const res = await guard(req, ctx);
      expect(res).toBeDefined();
      expect(res?.status).toBe(403);

      const body = (await res?.json()) as { error: string; message: string };
      expect(body.error).toBe("Forbidden");
      expect(body.message).toBe(
        "Você não possui permissão para executar esta ação.",
      );
    });

    it("deve permitir acesso quando o papel do usuário coincide com o permitido", async () => {
      const guard = requireRole(ROLES.SELLER, ROLES.ADMIN);
      const req = new Request("http://localhost/api/v1/suppliers");
      const ctx: RequestContext = {
        params: {},
        url: new URL(req.url),
        user: {
          id: "seller-1",
          email: "vendedor@emporio.com.br",
          role: ROLES.SELLER,
        },
      };

      const res = await guard(req, ctx);
      expect(res).toBeUndefined(); // Permite prosseguir
    });

    it("deve conceder bypass automático para ADMIN (role 3)", async () => {
      const guard = requireRole(ROLES.SELLER); // Rota restrita a vendedores
      const req = new Request("http://localhost/api/v1/rotas-vendedor");
      const ctx: RequestContext = {
        params: {},
        url: new URL(req.url),
        user: {
          id: "admin-1",
          email: "admin@emporio.com.br",
          role: ROLES.ADMIN,
        },
      };

      const res = await guard(req, ctx);
      expect(res).toBeUndefined(); // ADMIN passa
    });
  });
});
