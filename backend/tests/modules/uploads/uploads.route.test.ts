import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { handleRequest } from "@/app";
import { env } from "@/config/env";
import { processImage } from "@/lib/images";
import {
  productImagePaths,
  variationSamplePath,
  writeUploadFile,
} from "@/lib/uploads";
import { UPLOAD_CACHE_CONTROL } from "@/modules/uploads/uploads.controller";
import { fixture } from "../../helpers/fixtures";

const PROD_ID = "dddddddd-dddd-4ddd-addd-dddddddddddd";
const IMG_ID = "0f0f0f0f-0f0f-4f0f-8f0f-0f0f0f0f0f0f";
const VAR_ID = "ffffffff-ffff-4fff-afff-ffffffffffff";
const SAMPLE_ID = "12345678-1234-4123-8123-123456789abc";
const BASE = "http://localhost:3001/api/v1/uploads";

describe("Leitura pública dos arquivos: GET /api/v1/uploads/:scope/:ownerId/:file", () => {
  const originalUploadsDir = env.UPLOADS_DIR;
  let tmpDir: string;
  let thumbBytes: Uint8Array<ArrayBuffer>;

  beforeAll(async () => {
    tmpDir = mkdtempSync(path.join(os.tmpdir(), "emporio-uploads-route-"));
    env.UPLOADS_DIR = tmpDir;

    const jpeg = await fixture("sofa-exif.jpg");
    thumbBytes = new Uint8Array((await processImage(jpeg, "thumb")).bytes);

    const { thumbnailPath, fullImagePath } = productImagePaths(PROD_ID, IMG_ID);
    await writeUploadFile(thumbnailPath, thumbBytes);
    await writeUploadFile(fullImagePath, (await processImage(jpeg, "full")).bytes);
    await writeUploadFile(
      variationSamplePath(VAR_ID, SAMPLE_ID),
      (await processImage(jpeg, "sample")).bytes,
    );
    // Arquivo sensível fora do diretório de uploads, para conferir que nada o alcança.
    await Bun.write(path.join(tmpDir, "..", `emporio-secret-${path.basename(tmpDir)}.txt`), "segredo");
  });

  afterAll(() => {
    env.UPLOADS_DIR = originalUploadsDir;
    rmSync(path.join(tmpDir, "..", `emporio-secret-${path.basename(tmpDir)}.txt`), { force: true });
    rmSync(tmpDir, { recursive: true, force: true });
  });

  async function get(pathname: string): Promise<Response> {
    return await handleRequest(new Request(`${BASE}${pathname}`));
  }

  it("serve a miniatura com 200, image/webp, cache imutável e nosniff, sem exigir sessão", async () => {
    const res = await get(`/products/${PROD_ID}/${IMG_ID}-thumb.webp`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/webp");
    expect(res.headers.get("cache-control")).toBe(UPLOAD_CACHE_CONTROL);
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(thumbBytes);
  });

  it("serve a imagem completa e a amostra da variação", async () => {
    const full = await get(`/products/${PROD_ID}/${IMG_ID}-full.webp`);
    expect(full.status).toBe(200);
    expect(full.headers.get("content-type")).toBe("image/webp");

    const sample = await get(`/variations/${VAR_ID}/${SAMPLE_ID}.webp`);
    expect(sample.status).toBe(200);
    expect(sample.headers.get("cache-control")).toBe(UPLOAD_CACHE_CONTROL);
  });

  it("404 para escopo desconhecido, ownerId inválido e nome fora do padrão", async () => {
    const cases = [
      `/photos/${PROD_ID}/${IMG_ID}-thumb.webp`,
      `/products/nao-uuid/${IMG_ID}-thumb.webp`,
      `/products/${PROD_ID}/foto.webp`,
      `/products/${PROD_ID}/${IMG_ID}.webp`,
      `/products/${PROD_ID}/${IMG_ID}-thumb.png`,
      `/variations/${VAR_ID}/${SAMPLE_ID}-thumb.webp`,
      `/products/${PROD_ID}`,
      `/products/${PROD_ID}/${IMG_ID}-thumb.webp/extra`,
    ];
    for (const pathname of cases) {
      const res = await get(pathname);
      expect(res.status).toBe(404);
      const body = (await res.json()) as { error: string };
      expect(body.error).toBe("Not Found");
    }
  });

  it("404 para tentativas de path traversal com .. e %2e%2e%2f", async () => {
    const secret = `emporio-secret-${path.basename(tmpDir)}.txt`;
    const cases = [
      `/products/../${secret}`,
      `/products/${PROD_ID}/../../${secret}`,
      `/products/%2e%2e%2f${secret}/${IMG_ID}-thumb.webp`,
      `/products/${PROD_ID}/%2e%2e%2f%2e%2e%2f${secret}`,
      `/%2e%2e/${PROD_ID}/${IMG_ID}-thumb.webp`,
      `/products/${PROD_ID}%2f..%2f..%2f${secret}/${IMG_ID}-thumb.webp`,
    ];
    for (const pathname of cases) {
      const res = await get(pathname);
      expect(res.status).toBe(404);
      expect(await res.text()).not.toContain("segredo");
    }
  });

  it("404 para caminho no padrão cujo arquivo não existe", async () => {
    const res = await get(`/products/${PROD_ID}/00000000-0000-4000-8000-000000000000-thumb.webp`);
    expect(res.status).toBe(404);
    const other = await get(`/variations/${SAMPLE_ID}/${VAR_ID}.webp`);
    expect(other.status).toBe(404);
  });

  it("continua servindo o arquivo de uma foto excluída logicamente (não consulta o banco)", async () => {
    // Não há linha no banco para este arquivo; só o volume importa para a leitura.
    const res = await get(`/products/${PROD_ID}/${IMG_ID}-full.webp`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe(UPLOAD_CACHE_CONTROL);
  });
});
