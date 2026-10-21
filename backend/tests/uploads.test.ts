import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { env } from "@/config/env";
import {
  productImagePaths,
  removeUploadFiles,
  resolveUploadPath,
  toUploadAbsolutePath,
  toUploadUrl,
  UPLOADS_PUBLIC_PREFIX,
  variationSamplePath,
  writeUploadFile,
} from "@/lib/uploads";

const PROD_ID = "dddddddd-dddd-4ddd-addd-dddddddddddd";
const IMG_ID = "0f0f0f0f-0f0f-4f0f-8f0f-0f0f0f0f0f0f";
const VAR_ID = "ffffffff-ffff-4fff-afff-ffffffffffff";
const SAMPLE_ID = "12345678-1234-4123-8123-123456789abc";

describe("Caminhos e padrões de nome dos uploads (src/lib/uploads.ts)", () => {
  const originalUploadsDir = env.UPLOADS_DIR;
  let tmpDir: string;

  beforeAll(() => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), "emporio-uploads-"));
    env.UPLOADS_DIR = tmpDir;
  });

  afterAll(() => {
    env.UPLOADS_DIR = originalUploadsDir;
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("monta os caminhos relativos gravados no banco", () => {
    expect(productImagePaths(PROD_ID, IMG_ID)).toEqual({
      thumbnailPath: `products/${PROD_ID}/${IMG_ID}-thumb.webp`,
      fullImagePath: `products/${PROD_ID}/${IMG_ID}-full.webp`,
    });
    expect(variationSamplePath(VAR_ID, SAMPLE_ID)).toBe(
      `variations/${VAR_ID}/${SAMPLE_ID}.webp`,
    );
  });

  it("caminho relativo e URL pública se correspondem", () => {
    const { thumbnailPath } = productImagePaths(PROD_ID, IMG_ID);
    expect(toUploadUrl(thumbnailPath)).toBe(
      `${UPLOADS_PUBLIC_PREFIX}/products/${PROD_ID}/${IMG_ID}-thumb.webp`,
    );
    expect(toUploadAbsolutePath(thumbnailPath)).toBe(
      path.join(tmpDir, thumbnailPath),
    );
  });

  it("resolveUploadPath aceita só o padrão gerado pelo servidor", () => {
    expect(resolveUploadPath("products", PROD_ID, `${IMG_ID}-thumb.webp`)).toBe(
      path.join(tmpDir, "products", PROD_ID, `${IMG_ID}-thumb.webp`),
    );
    expect(resolveUploadPath("products", PROD_ID, `${IMG_ID}-full.webp`)).toBe(
      path.join(tmpDir, "products", PROD_ID, `${IMG_ID}-full.webp`),
    );
    expect(resolveUploadPath("variations", VAR_ID, `${SAMPLE_ID}.webp`)).toBe(
      path.join(tmpDir, "variations", VAR_ID, `${SAMPLE_ID}.webp`),
    );
  });

  it("resolveUploadPath devolve null para escopo desconhecido, dono inválido e nome fora do padrão", () => {
    expect(resolveUploadPath("photos", PROD_ID, `${IMG_ID}-thumb.webp`)).toBeNull();
    expect(resolveUploadPath("", PROD_ID, `${IMG_ID}-thumb.webp`)).toBeNull();
    expect(resolveUploadPath("products", "nao-e-uuid", `${IMG_ID}-thumb.webp`)).toBeNull();
    expect(resolveUploadPath("products", PROD_ID, "foto.webp")).toBeNull();
    expect(resolveUploadPath("products", PROD_ID, `${IMG_ID}.webp`)).toBeNull();
    expect(resolveUploadPath("products", PROD_ID, `${IMG_ID}-thumb.png`)).toBeNull();
    expect(resolveUploadPath("variations", VAR_ID, `${SAMPLE_ID}-thumb.webp`)).toBeNull();
    expect(resolveUploadPath("products", PROD_ID.toUpperCase(), `${IMG_ID}-thumb.webp`)).toBeNull();
  });

  it("resolveUploadPath barra path traversal, inclusive já decodificado pelo roteador", () => {
    expect(resolveUploadPath("products", "..", `${IMG_ID}-thumb.webp`)).toBeNull();
    expect(resolveUploadPath("..", PROD_ID, `${IMG_ID}-thumb.webp`)).toBeNull();
    expect(resolveUploadPath("products", PROD_ID, "..")).toBeNull();
    expect(resolveUploadPath("products", PROD_ID, "../../etc/passwd")).toBeNull();
    // `%2e%2e%2f` chega decodificado como `../` pelo Router.
    expect(resolveUploadPath("products", decodeURIComponent("%2e%2e%2f"), `${IMG_ID}-thumb.webp`)).toBeNull();
    expect(resolveUploadPath("products", PROD_ID, decodeURIComponent(`%2e%2e%2f${IMG_ID}-thumb.webp`))).toBeNull();
    expect(resolveUploadPath("products", PROD_ID, `/etc/${IMG_ID}-thumb.webp`)).toBeNull();
    expect(resolveUploadPath("products", `${PROD_ID}/..`, `${IMG_ID}-thumb.webp`)).toBeNull();
  });

  it("writeUploadFile cria as pastas e removeUploadFiles apaga sem falhar para arquivo ausente", async () => {
    const { thumbnailPath, fullImagePath } = productImagePaths(PROD_ID, IMG_ID);
    const absolute = await writeUploadFile(thumbnailPath, new Uint8Array([1, 2, 3]));

    expect(absolute).toBe(path.join(tmpDir, thumbnailPath));
    expect(existsSync(absolute)).toBeTrue();
    expect(new Uint8Array(await Bun.file(absolute).arrayBuffer())).toEqual(
      new Uint8Array([1, 2, 3]),
    );

    await removeUploadFiles([thumbnailPath, fullImagePath]);
    expect(existsSync(absolute)).toBeFalse();
    expect(existsSync(path.join(tmpDir, fullImagePath))).toBeFalse();
  });
});
