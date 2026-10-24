import { describe, expect, it } from "bun:test";
import path from "node:path";
import { loadEnv } from "@/config/env";

const JWT_SECRET = "segredo-de-teste-com-pelo-menos-32-caracteres";

describe("loadEnv", () => {
  it("usa os padrões quando nada é informado", () => {
    const env = loadEnv({ JWT_SECRET });

    expect(env.PORT).toBe(3001);
    expect(env.NODE_ENV).toBe("development");
    expect(env.UPLOADS_DIR).toBe(path.join(process.cwd(), "uploads"));
  });

  it("usa os valores informados", () => {
    const env = loadEnv({
      JWT_SECRET,
      PORT: "4000",
      NODE_ENV: "production",
      UPLOADS_DIR: "/srv/uploads",
    });

    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe("production");
    expect(env.UPLOADS_DIR).toBe(path.resolve("/srv/uploads"));
  });

  it("resolve UPLOADS_DIR relativo a partir do cwd", () => {
    const env = loadEnv({ JWT_SECRET, UPLOADS_DIR: "data/fotos" });

    expect(env.UPLOADS_DIR).toBe(path.resolve(process.cwd(), "data/fotos"));
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
