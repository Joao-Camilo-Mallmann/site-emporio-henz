import { describe, expect, it } from "bun:test";
import path from "node:path";
import { env, loadEnv } from "@/config/env";

describe("Configuração de ambiente (env.ts)", () => {
  it("UPLOADS_DIR usa <cwd>/uploads por padrão", () => {
    const loaded = loadEnv({});
    expect(loaded.UPLOADS_DIR).toBe(path.join(process.cwd(), "uploads"));
    expect(env.UPLOADS_DIR).toBeString();
  });

  it("a variável de ambiente UPLOADS_DIR sobrescreve o padrão", () => {
    expect(loadEnv({ UPLOADS_DIR: "/srv/emporio/uploads" }).UPLOADS_DIR).toBe(
      "/srv/emporio/uploads",
    );
    // Caminho relativo é resolvido a partir do cwd, para o path.join nunca
    // depender do diretório atual depois do boot.
    expect(loadEnv({ UPLOADS_DIR: "data/fotos" }).UPLOADS_DIR).toBe(
      path.resolve(process.cwd(), "data/fotos"),
    );
  });

  it("mantém os padrões das demais variáveis", () => {
    const loaded = loadEnv({});
    expect(loaded.PORT).toBe(3001);
    expect(loaded.NODE_ENV).toBe("development");
    expect(loadEnv({ PORT: "4000", NODE_ENV: "production" }).PORT).toBe(4000);
  });
});
