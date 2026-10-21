import { BadRequestError } from "@/lib/errors";

// Limite por imagem (RNF02): 2 MiB exatos.
export const MAX_UPLOAD_FILE_BYTES = 2_097_152;

// Folga para o envelope do multipart (boundaries, cabeçalhos das partes e
// campos de texto como `variationId`). O limite exato vale para `file.size`.
export const MULTIPART_ENVELOPE_ALLOWANCE = 64 * 1024;
export const MAX_UPLOAD_CONTENT_LENGTH =
  MAX_UPLOAD_FILE_BYTES + MULTIPART_ENVELOPE_ALLOWANCE;

export const UPLOAD_FIELD_NAME = "file";

export const SINGLE_FILE_MESSAGE =
  "Cada requisição leva exatamente uma imagem, enviada no campo file.";
export const MISSING_CONTENT_LENGTH_MESSAGE =
  "A requisição de upload precisa informar o cabeçalho Content-Length.";
export const MULTIPART_REQUIRED_MESSAGE =
  "O upload deve ser enviado como multipart/form-data com a imagem no campo file.";
export const MULTIPART_UNREADABLE_MESSAGE =
  "Não foi possível ler o multipart/form-data da requisição.";

export interface SingleFileUpload {
  file: File;
  fields: Record<string, string>;
}

// 2097152 -> "2.097.152"
export function formatBytes(bytes: number): string {
  return String(bytes).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// 2621440 -> "2,50 MB"
export function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2).replace(".", ",")} MB`;
}

export function fileTooLargeMessage(size: number): string {
  return `A imagem tem ${formatMegabytes(size)} (${formatBytes(size)} bytes); o limite é 2 MB (${formatBytes(MAX_UPLOAD_FILE_BYTES)} bytes).`;
}

export function bodyTooLargeMessage(contentLength: number): string {
  return `O corpo da requisição tem ${formatMegabytes(contentLength)} (${formatBytes(contentLength)} bytes); o limite por imagem é 2 MB (${formatBytes(MAX_UPLOAD_FILE_BYTES)} bytes).`;
}

// Lê um multipart/form-data com exatamente um arquivo no campo `file`.
// A ordem importa: `Content-Length` é conferido antes de qualquer leitura do
// corpo, para que um envio grande seja recusado sem ocupar memória.
export async function readSingleFileUpload(
  req: Request,
  fieldNames: readonly string[] = [],
): Promise<SingleFileUpload> {
  const contentLengthHeader = req.headers.get("content-length");
  const contentLength =
    contentLengthHeader === null ? Number.NaN : Number(contentLengthHeader);
  if (!Number.isInteger(contentLength) || contentLength < 0) {
    throw new BadRequestError(MISSING_CONTENT_LENGTH_MESSAGE);
  }
  if (contentLength > MAX_UPLOAD_CONTENT_LENGTH) {
    throw new BadRequestError(bodyTooLargeMessage(contentLength));
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    throw new BadRequestError(MULTIPART_REQUIRED_MESSAGE);
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    throw new BadRequestError(MULTIPART_UNREADABLE_MESSAGE);
  }

  let fileCount = 0;
  let file: File | null = null;
  for (const [name, value] of formData.entries()) {
    // Campos de texto chegam como string; arquivos chegam como File.
    if (typeof value === "string") continue;
    fileCount++;
    if (name === UPLOAD_FIELD_NAME) {
      file = value as unknown as File;
    }
  }
  if (fileCount !== 1 || !file) {
    throw new BadRequestError(SINGLE_FILE_MESSAGE);
  }

  if (file.size > MAX_UPLOAD_FILE_BYTES) {
    throw new BadRequestError(fileTooLargeMessage(file.size));
  }

  const fields: Record<string, string> = {};
  for (const name of fieldNames) {
    const value = formData.get(name);
    if (typeof value === "string" && value.trim() !== "") {
      fields[name] = value.trim();
    }
  }

  return { file, fields };
}
