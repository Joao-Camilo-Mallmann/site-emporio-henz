import { describe, expect, it } from "bun:test";
import path from "node:path";
import { deflateSync } from "node:zlib";
import { BadRequestError } from "@/lib/errors";
import {
  ACCEPTED_FORMATS_MESSAGE,
  IMAGE_PRESETS,
  processImage,
  readImageMetadata,
  THUMBNAIL_MAX_BYTES,
  TOO_MANY_PIXELS_MESSAGE,
} from "@/lib/images";

const FIXTURES_DIR = path.join(import.meta.dir, "fixtures");

async function fixture(name: string): Promise<Uint8Array> {
  return new Uint8Array(
    await Bun.file(path.join(FIXTURES_DIR, name)).arrayBuffer(),
  );
}

// O JPEG de teste leva este texto nos campos Artist e ImageDescription do EXIF.
const EXIF_MARKER = "EMPORIO-EXIF-MARKER";

function latin1(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("latin1");
}

// Um WebP com metadados traria o chunk RIFF "EXIF"; a reconversão não deve emitir nenhum.
function hasExif(bytes: Uint8Array): boolean {
  const text = latin1(bytes);
  return text.includes("EXIF") || text.includes(EXIF_MARKER);
}

function isWebp(bytes: Uint8Array): boolean {
  return latin1(bytes.subarray(0, 12)).startsWith("RIFF") && latin1(bytes.subarray(8, 12)) === "WEBP";
}

// PNG sintético de ruído: textura impossível de comprimir, para forçar a queda
// de qualidade da miniatura sem guardar um fixture pesado no repositório.
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    let c = (crc ^ byte) & 0xff;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function uint32(value: number): Uint8Array {
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, value);
  return out;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type);
  return concat(
    uint32(data.length),
    typeBytes,
    data,
    uint32(crc32(concat(typeBytes, data))),
  );
}

function makeNoisePng(width: number, height: number, seed = 7): Uint8Array {
  const stride = width * 3 + 1;
  const raw = new Uint8Array(stride * height);
  let state = seed >>> 0;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state >>> 24;
  };
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filtro "none"
    for (let i = 1; i < stride; i++) {
      raw[y * stride + i] = next();
    }
  }
  const ihdr = concat(uint32(width), uint32(height), new Uint8Array([8, 2, 0, 0, 0]));
  return concat(
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", new Uint8Array(deflateSync(raw))),
    pngChunk("IEND", new Uint8Array(0)),
  );
}

describe("Processamento de imagens com Bun.Image (RNF02)", () => {
  it("fixtures: o JPEG de teste contém EXIF antes da reconversão", async () => {
    const jpeg = await fixture("sofa-exif.jpg");
    expect(latin1(jpeg)).toContain("Exif");
    expect(latin1(jpeg)).toContain(EXIF_MARKER);
    expect(await readImageMetadata(jpeg)).toEqual({
      width: 2048,
      height: 1536,
      format: "jpeg",
    });
  });

  it("thumb: JPEG 2048×1536 vira WebP 480×360 abaixo de 50 KiB e sem EXIF", async () => {
    const jpeg = await fixture("sofa-exif.jpg");
    const thumb = await processImage(jpeg, "thumb");

    expect(isWebp(thumb.bytes)).toBeTrue();
    expect(thumb.width).toBe(480);
    expect(thumb.height).toBe(360);
    expect(thumb.bytes.byteLength).toBeLessThan(THUMBNAIL_MAX_BYTES);
    expect(thumb.quality).toBe(75);
    expect(hasExif(thumb.bytes)).toBeFalse();
    expect(await readImageMetadata(thumb.bytes)).toEqual({
      width: 480,
      height: 360,
      format: "webp",
    });
  });

  it("full: JPEG 2048×1536 vira WebP 1920×1440 sem EXIF", async () => {
    const jpeg = await fixture("sofa-exif.jpg");
    const full = await processImage(jpeg, "full");

    expect(isWebp(full.bytes)).toBeTrue();
    expect(full.width).toBe(1920);
    expect(full.height).toBe(1440);
    expect(full.quality).toBe(85);
    expect(hasExif(full.bytes)).toBeFalse();
  });

  it("sample: lado maior limitado a 512 px", async () => {
    const jpeg = await fixture("sofa-exif.jpg");
    const sample = await processImage(jpeg, "sample");

    expect(isWebp(sample.bytes)).toBeTrue();
    expect(sample.width).toBe(512);
    expect(sample.height).toBe(384);
    expect(sample.quality).toBe(80);
  });

  it("PNG e WebP são aceitos e imagens menores que o preset não são ampliadas", async () => {
    const png = await fixture("textura.png");
    const full = await processImage(png, "full");
    expect(isWebp(full.bytes)).toBeTrue();
    expect([full.width, full.height]).toEqual([800, 600]);

    const thumb = await processImage(png, "thumb");
    expect([thumb.width, thumb.height]).toEqual([480, 360]);

    const webp = await fixture("amostra.webp");
    const sample = await processImage(webp, "sample");
    expect(isWebp(sample.bytes)).toBeTrue();
    expect([sample.width, sample.height]).toEqual([400, 300]);
  });

  it("thumb: ruído incompressível reduz o lado até caber em 50 KiB em vez de passar do limite", async () => {
    const noise = makeNoisePng(640, 640);
    expect(await readImageMetadata(noise)).toEqual({
      width: 640,
      height: 640,
      format: "png",
    });

    const thumb = await processImage(noise, "thumb");
    expect(IMAGE_PRESETS.thumb.qualities).toEqual([75, 60, 45]);
    expect(thumb.bytes.byteLength).toBeLessThan(THUMBNAIL_MAX_BYTES);
    expect(thumb.width).toBeLessThan(480);
    expect(thumb.width).toBe(thumb.height);
    expect(IMAGE_PRESETS.thumb.fallbackSides).toContain(thumb.width);
  });

  it("GIF é recusado com a lista de formatos aceitos", async () => {
    const gif = await fixture("animacao.gif");
    const attempt = readImageMetadata(gif);
    await expect(attempt).rejects.toThrow(BadRequestError);
    await expect(attempt).rejects.toThrow(ACCEPTED_FORMATS_MESSAGE);
    await expect(processImage(gif, "thumb")).rejects.toThrow(ACCEPTED_FORMATS_MESSAGE);
  });

  it("texto renomeado para .jpg é recusado pelo conteúdo", async () => {
    const text = await fixture("texto.jpg");
    const attempt = readImageMetadata(text);
    await expect(attempt).rejects.toThrow(BadRequestError);
    await expect(attempt).rejects.toThrow(ACCEPTED_FORMATS_MESSAGE);
    await expect(processImage(text, "full")).rejects.toThrow(BadRequestError);
  });

  it("PNG pequeno que declara 8000×6000 (48 MP) é recusado sem decodificar", async () => {
    const huge = await fixture("gigante.png");
    expect(huge.byteLength).toBeLessThan(200);

    const attempt = readImageMetadata(huge);
    await expect(attempt).rejects.toThrow(BadRequestError);
    await expect(attempt).rejects.toThrow(TOO_MANY_PIXELS_MESSAGE);
    await expect(processImage(huge, "thumb")).rejects.toThrow(TOO_MANY_PIXELS_MESSAGE);
  });
});
