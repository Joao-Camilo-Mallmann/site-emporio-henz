import { describe, expect, it } from "bun:test";
import path from "node:path";
import { env, loadEnv } from "@/config/env";

const JWT_SECRET = "segredo-de-teste-com-pelo-menos-32-caracteres";

describe("Configuração de ambiente (env.ts)", () => {
  it("UPLOADS_DIR usa <cwd>/uploads por padrão", () => {
    const loaded = loadEnv({ JWT_SECRET });
    expect(loaded.UPLOADS_DIR).toBe(path.join(process.cwd(), "uploads"));
    expect(env.UPLOADS_DIR).toBeString();
  });

  it("a variável de ambiente UPLOADS_DIR sobrescreve o padrão", () => {
    expect(
      loadEnv({ JWT_SECRET, UPLOADS_DIR: "/srv/emporio/uploads" }).UPLOADS_DIR,
    ).toBe("/srv/emporio/uploads");
    // Caminho relativo é resolvido a partir do cwd, para o path.join nunca
    // depender do diretório atual depois do boot.
    expect(loadEnv({ JWT_SECRET, UPLOADS_DIR: "data/fotos" }).UPLOADS_DIR).toBe(
      path.resolve(process.cwd(), "data/fotos"),
    );
  });

  it("mantém os padrões das demais variáveis", () => {
    const loaded = loadEnv({ JWT_SECRET });
    expect(loaded.PORT).toBe(3001);
    expect(loaded.NODE_ENV).toBe("development");
    expect(
      loadEnv({ JWT_SECRET, PORT: "4000", NODE_ENV: "production" }).PORT,
    ).toBe(4000);
  });

  it("JWT_SECRET vem somente da variável de ambiente", () => {
    expect(loadEnv({ JWT_SECRET }).JWT_SECRET).toBe(JWT_SECRET);
  });

  it("falha quando JWT_SECRET não está definido", () => {
    expect(() => loadEnv({})).toThrow(/JWT_SECRET/);
    expect(() => loadEnv({ JWT_SECRET: "" })).toThrow(/JWT_SECRET/);
    expect(() => loadEnv({ NODE_ENV: "production" })).toThrow(/JWT_SECRET/);
  });
});
