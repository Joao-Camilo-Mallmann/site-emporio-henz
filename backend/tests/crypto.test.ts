import { describe, expect, it } from "bun:test";
import { hashPassword, verifyPassword } from "@/lib/password";
import { signJwt, verifyJwt } from "@/lib/jwt";

describe("Criptografia e Senhas (Argon2id)", () => {
  it("deve gerar um hash Argon2id válido para uma senha", async () => {
    const password = "senhaUltraSegura123!";
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash.startsWith("$argon2id$")).toBe(true);
  });

  it("deve validar com sucesso a senha correta contra o hash", async () => {
    const password = "senhaUltraSegura123!";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("deve rejeitar uma senha incorreta contra o hash", async () => {
    const password = "senhaUltraSegura123!";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword("senhaErrada", hash);
    expect(isValid).toBe(false);
  });
});

describe("Emissão e Validação de Tokens JWT (Web Crypto HMAC-SHA256)", () => {
  const secret = "segredo-de-teste-com-mais-de-32-caracteres-super-seguro";

  it("deve emitir e decodificar um token JWT válido com claims id, email e role", async () => {
    const payload = {
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      email: "cliente@emporio.com.br",
      role: 1,
    };

    const token = await signJwt(payload, secret, 3600);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const verified = await verifyJwt(token, secret);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(payload.id);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.role).toBe(payload.role);
    expect(verified?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("deve rejeitar tokens expirados", async () => {
    const payload = {
      id: "user-exp",
      email: "exp@teste.com",
      role: 1,
    };

    // Token que expirou há 10 segundos
    const token = await signJwt(payload, secret, -10);
    const verified = await verifyJwt(token, secret);

    expect(verified).toBeNull();
  });

  it("deve rejeitar tokens com assinatura adulterada", async () => {
    const payload = {
      id: "user-tamper",
      email: "tamper@teste.com",
      role: 1,
    };

    const token = await signJwt(payload, secret, 3600);
    const parts = token.split(".");
    // Adultera os dados do payload
    const tamperedPayload = btoa(JSON.stringify({ ...payload, role: 3 }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const verified = await verifyJwt(tamperedToken, secret);
    expect(verified).toBeNull();
  });

  it("deve rejeitar tokens assinados com outro segredo", async () => {
    const payload = {
      id: "user-secret",
      email: "secret@teste.com",
      role: 2,
    };

    const token = await signJwt(payload, "chave-secreta-um-com-ao-menos-32-chars");
    const verified = await verifyJwt(token, "chave-secreta-dois-totalmente-diferente");

    expect(verified).toBeNull();
  });
});
