import { describe, expect, it } from "bun:test";
import path from "node:path";
import { loadEnv } from "@/config/env";

describe("loadEnv", () => {
  it("usa os padrões quando nada é informado", () => {
    const env = loadEnv({});

    expect(env.PORT).toBe(3001);
    expect(env.NODE_ENV).toBe("development");
    expect(env.UPLOADS_DIR).toBe(path.join(process.cwd(), "uploads"));
  });

  it("usa os valores informados", () => {
    const env = loadEnv({
      PORT: "4000",
      NODE_ENV: "production",
      UPLOADS_DIR: "/srv/uploads",
    });

    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe("production");
    expect(env.UPLOADS_DIR).toBe("/srv/uploads");
  });

  it("resolve UPLOADS_DIR relativo a partir do cwd", () => {
    const env = loadEnv({ UPLOADS_DIR: "data/fotos" });

    expect(env.UPLOADS_DIR).toBe(path.resolve(process.cwd(), "data/fotos"));
  });
});
