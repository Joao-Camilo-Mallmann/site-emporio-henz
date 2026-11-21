import { describe, expect, it } from "bun:test";
import { env } from "@/config/env";
import { signJwt } from "@/lib/jwt";
import { Router } from "@/lib/router";
import { authMiddleware } from "@/middlewares/auth";
import { AuthController } from "@/modules/auth/auth.controller";
import { AuthService } from "@/modules/auth/auth.service";
import { MockAuthRepository } from "../../mocks/auth.mock";

const authUrl = "http://localhost/api/v1/auth";

function createAuthRouter(): Router {
  const controller = new AuthController(
    new AuthService(new MockAuthRepository()),
  );
  const router = new Router();

  router.post("/api/v1/auth/register", (req) => controller.register(req));
  router.post("/api/v1/auth/login", (req) => controller.login(req));
  router.post("/api/v1/auth/logout", (req) => controller.logout(req));
  router.get("/api/v1/auth/me", authMiddleware, (req, ctx) =>
    controller.me(req, ctx),
  );
  router.put("/api/v1/auth/me", authMiddleware, (req, ctx) =>
    controller.updateProfile(req, ctx),
  );

  return router;
}

async function send(
  router: Router,
  path: string,
  init?: RequestInit,
  baseUrl = authUrl,
): Promise<Response> {
  const response = await router.handle(new Request(`${baseUrl}${path}`, init));
  if (!response) {
    throw new Error(`Rota de autenticação não encontrada: ${path}`);
  }
  return response;
}

function expectTokenCookie(
  cookie: string | null,
  maxAge: number,
  secure: boolean,
): asserts cookie is string {
  expect(cookie).not.toBeNull();
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("SameSite=Lax");
  expect(cookie).toContain("Path=/");
  expect(cookie).toContain(`Max-Age=${maxAge}`);
  expect(cookie).toMatch(/^token=/);
  expect(cookie?.includes("; Secure")).toBe(secure);
}

describe("AuthController", () => {
  it("cadastra usuário sem expor o JWT e envia cookie de sessão", async () => {
    const router = createAuthRouter();
    const response = await send(router, "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Maria Silva",
        email: "maria@exemplo.com",
        password: "senhaSegura123",
      }),
    });

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(Object.keys(body)).toEqual(["user"]);
    expect(body.user.email).toBe("maria@exemplo.com");
    expectTokenCookie(
      response.headers.get("Set-Cookie"),
      env.JWT_EXPIRES_IN_SECONDS,
      false,
    );
  });

  it("faz login com Secure quando o proxy informa HTTPS e não expõe o JWT", async () => {
    const router = createAuthRouter();
    await send(router, "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "João Silva",
        email: "joao@exemplo.com",
        password: "senhaSegura123",
      }),
    });

    const response = await send(router, "/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-proto": "https",
      },
      body: JSON.stringify({
        email: "joao@exemplo.com",
        password: "senhaSegura123",
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Object.keys(body)).toEqual(["user"]);
    expect(body.user.email).toBe("joao@exemplo.com");
    expectTokenCookie(
      response.headers.get("Set-Cookie"),
      env.JWT_EXPIRES_IN_SECONDS,
      true,
    );
  });

  it("autentica GET e PUT /me com o cookie token", async () => {
    const router = createAuthRouter();
    const registered = await send(router, "/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Ana Lima",
        email: "ana@exemplo.com",
        password: "senhaSegura123",
      }),
    });
    const setCookie = registered.headers.get("Set-Cookie");
    const token = setCookie?.match(/^token=([^;]+)/)?.[1];
    expect(token).toBeDefined();

    const profile = await send(router, "/me", {
      headers: { Cookie: `token=${token}` },
    });
    expect(profile.status).toBe(200);
    expect((await profile.json()).email).toBe("ana@exemplo.com");

    const updated = await send(router, "/me", {
      method: "PUT",
      headers: {
        Cookie: `token=${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fullName: "Ana Lima Atualizada" }),
    });
    expect(updated.status).toBe(200);
    expect((await updated.json()).id).toBe(
      (await registered.json()).user.id,
    );
  });

  it("rejeita /me sem cookie, com Bearer isolado ou com token inválido/expirado", async () => {
    const router = createAuthRouter();
    const expiredToken = await signJwt(
      { id: "user-1", email: "user@exemplo.com", role: 1 },
      env.JWT_SECRET,
      -10,
    );
    const requests: RequestInit[] = [
      {},
      { headers: { Authorization: "Bearer token-valido-aparente" } },
      { headers: { Cookie: "token=invalido" } },
      { headers: { Cookie: `token=${expiredToken}` } },
    ];

    for (const init of requests) {
      const response = await send(router, "/me", init);
      expect(response.status).toBe(401);
    }
  });

  it("logout limpa o cookie mesmo sem sessão válida e respeita HTTPS pela URL", async () => {
    const router = createAuthRouter();
    const response = await send(
      router,
      "/logout",
      { method: "POST", headers: { Cookie: "token=invalido" } },
      "https://localhost/api/v1/auth",
    );

    expect(response.status).toBe(200);
    expectTokenCookie(response.headers.get("Set-Cookie"), 0, true);

    const anonymousResponse = await send(router, "/logout", {
      method: "POST",
    });
    expect(anonymousResponse.status).toBe(200);
    expectTokenCookie(anonymousResponse.headers.get("Set-Cookie"), 0, false);
  });
});
