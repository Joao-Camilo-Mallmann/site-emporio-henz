import { describe, expect, it } from "bun:test";
import { BadRequestError } from "@/lib/errors";
import {
  bodyTooLargeMessage,
  fileTooLargeMessage,
  formatBytes,
  formatMegabytes,
  MAX_UPLOAD_CONTENT_LENGTH,
  MAX_UPLOAD_FILE_BYTES,
  MISSING_CONTENT_LENGTH_MESSAGE,
  MULTIPART_REQUIRED_MESSAGE,
  readSingleFileUpload,
  SINGLE_FILE_MESSAGE,
} from "@/lib/multipart";

interface UploadPart {
  field: string;
  bytes: Uint8Array<ArrayBuffer>;
  name?: string;
  type?: string;
}

interface BuildOptions {
  files?: UploadPart[];
  fields?: Record<string, string>;
  // `null` omite o cabeçalho; número sobrescreve o tamanho real.
  contentLength?: number | null;
}

// Codifica o multipart de verdade e envia como bytes, com Content-Length real
// (como um navegador ou o nginx fazem), a menos que o teste peça outro valor.
export async function buildMultipartRequest(
  url: string,
  options: BuildOptions = {},
  extraHeaders: Record<string, string> = {},
  method = "POST",
): Promise<Request> {
  const formData = new FormData();
  for (const [name, value] of Object.entries(options.fields ?? {})) {
    formData.append(name, value);
  }
  for (const part of options.files ?? []) {
    formData.append(
      part.field,
      new File([part.bytes], part.name ?? "foto.jpg", {
        type: part.type ?? "image/jpeg",
      }),
    );
  }

  const encoded = new Response(formData);
  // O Bun deriva o Content-Type (com o boundary) do FormData só enquanto o corpo
  // não foi consumido, então o cabeçalho é lido antes do arrayBuffer().
  const contentType = encoded.headers.get("content-type")!;
  const body = new Uint8Array(await encoded.arrayBuffer());
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    ...extraHeaders,
  };
  if (options.contentLength !== null) {
    headers["Content-Length"] = String(options.contentLength ?? body.byteLength);
  }

  return new Request(url, { method, headers, body });
}

const URL = "http://localhost:3001/api/v1/produtos/x/imagens";
const SMALL_FILE = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

describe("Leitor de multipart com um arquivo (src/lib/multipart.ts)", () => {
  it("formata tamanhos em MB e bytes para as mensagens", () => {
    expect(formatBytes(2_097_152)).toBe("2.097.152");
    expect(formatBytes(999)).toBe("999");
    expect(formatMegabytes(2_621_440)).toBe("2,50 MB");
    expect(fileTooLargeMessage(2_097_153)).toBe(
      "A imagem tem 2,00 MB (2.097.153 bytes); o limite é 2 MB (2.097.152 bytes).",
    );
    expect(bodyTooLargeMessage(8 * 1024 * 1024)).toContain("8,00 MB");
    expect(MAX_UPLOAD_CONTENT_LENGTH).toBe(2_097_152 + 64 * 1024);
  });

  it("aceita um arquivo em `file` e devolve só os campos de texto pedidos", async () => {
    const req = await buildMultipartRequest(URL, {
      files: [{ field: "file", bytes: SMALL_FILE }],
      fields: { variationId: "  abc  ", other: "ignorado" },
    });

    const result = await readSingleFileUpload(req, ["variationId"]);
    expect(result.file.size).toBe(SMALL_FILE.byteLength);
    expect(result.file.name).toBe("foto.jpg");
    expect(result.fields).toEqual({ variationId: "abc" });
  });

  it("recusa multipart sem arquivo", async () => {
    const req = await buildMultipartRequest(URL, {
      fields: { variationId: "abc" },
    });
    const attempt = readSingleFileUpload(req);
    expect(attempt).rejects.toThrow(BadRequestError);
    expect(attempt).rejects.toThrow(SINGLE_FILE_MESSAGE);
  });

  it("recusa multipart com dois arquivos, mesmo em campos diferentes", async () => {
    const sameField = await buildMultipartRequest(URL, {
      files: [
        { field: "file", bytes: SMALL_FILE },
        { field: "file", bytes: SMALL_FILE, name: "outra.jpg" },
      ],
    });
    expect(readSingleFileUpload(sameField)).rejects.toThrow(SINGLE_FILE_MESSAGE);

    const otherField = await buildMultipartRequest(URL, {
      files: [
        { field: "file", bytes: SMALL_FILE },
        { field: "anexo", bytes: SMALL_FILE, name: "anexo.png", type: "image/png" },
      ],
    });
    expect(readSingleFileUpload(otherField)).rejects.toThrow(SINGLE_FILE_MESSAGE);

    const wrongField = await buildMultipartRequest(URL, {
      files: [{ field: "imagem", bytes: SMALL_FILE }],
    });
    expect(readSingleFileUpload(wrongField)).rejects.toThrow(SINGLE_FILE_MESSAGE);
  });

  it("aceita exatamente 2.097.152 bytes e recusa 2.097.153 com o tamanho e o limite", async () => {
    const exact = await buildMultipartRequest(URL, {
      files: [{ field: "file", bytes: new Uint8Array(MAX_UPLOAD_FILE_BYTES) }],
    });
    const accepted = await readSingleFileUpload(exact);
    expect(accepted.file.size).toBe(MAX_UPLOAD_FILE_BYTES);

    const over = await buildMultipartRequest(URL, {
      files: [{ field: "file", bytes: new Uint8Array(MAX_UPLOAD_FILE_BYTES + 1) }],
    });
    const attempt = readSingleFileUpload(over);
    expect(attempt).rejects.toThrow(BadRequestError);
    expect(attempt).rejects.toThrow("2.097.153 bytes");
    expect(attempt).rejects.toThrow("o limite é 2 MB (2.097.152 bytes)");
  });

  it("recusa Content-Length de 8 MB sem ler o corpo", async () => {
    const req = await buildMultipartRequest(URL, {
      files: [{ field: "file", bytes: SMALL_FILE }],
      contentLength: 8 * 1024 * 1024,
    });

    const attempt = readSingleFileUpload(req);
    expect(attempt).rejects.toThrow(BadRequestError);
    expect(attempt).rejects.toThrow(bodyTooLargeMessage(8 * 1024 * 1024));
    await attempt.catch(() => undefined);
    expect(req.bodyUsed).toBeFalse();
  });

  it("recusa Content-Length ausente ou inválido sem ler o corpo", async () => {
    const missing = await buildMultipartRequest(URL, {
      files: [{ field: "file", bytes: SMALL_FILE }],
      contentLength: null,
    });
    expect(missing.headers.get("content-length")).toBeNull();
    const attempt = readSingleFileUpload(missing);
    expect(attempt).rejects.toThrow(MISSING_CONTENT_LENGTH_MESSAGE);
    await attempt.catch(() => undefined);
    expect(missing.bodyUsed).toBeFalse();

    const invalid = new Request(URL, {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data; boundary=x", "Content-Length": "abc" },
      body: "--x--",
    });
    expect(readSingleFileUpload(invalid)).rejects.toThrow(MISSING_CONTENT_LENGTH_MESSAGE);
  });

  it("recusa corpo que não é multipart/form-data", async () => {
    const json = new Request(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": "2" },
      body: "{}",
    });
    const attempt = readSingleFileUpload(json);
    expect(attempt).rejects.toThrow(BadRequestError);
    expect(attempt).rejects.toThrow(MULTIPART_REQUIRED_MESSAGE);
  });
});
