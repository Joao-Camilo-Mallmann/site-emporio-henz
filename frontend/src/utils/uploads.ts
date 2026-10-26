import { apiBase } from "@/plugins/axios";

/** Limite por imagem aceito pela API: 2 MiB. */
export const MAX_IMAGE_BYTES = 2_097_152;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** Valor para o atributo `accept` dos `<input type="file">`. */
export const ACCEPTED_IMAGE_INPUT = ACCEPTED_IMAGE_TYPES.join(",");

const ACCEPTED_LABEL = "JPEG, PNG ou WebP";

/** Formata bytes em KB ou MB (base 1024), com vírgula decimal. */
export function formatFileSize(bytes: number): string {
  const formatter = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  });
  if (bytes < 1024 * 1024) {
    return `${formatter.format(Math.max(bytes, 0) / 1024)} KB`;
  }
  return `${formatter.format(bytes / (1024 * 1024))} MB`;
}

/**
 * Confere formato e tamanho de uma imagem antes do envio. Devolve a mensagem
 * de erro ou `null` se o arquivo pode ser enviado.
 *
 * O navegador só confere o `type` do arquivo; a API confere pelo conteúdo e
 * pode recusar um arquivo renomeado.
 */
export function validateImageFile(file: File): string | null {
  const type = file.type as (typeof ACCEPTED_IMAGE_TYPES)[number];
  if (!ACCEPTED_IMAGE_TYPES.includes(type)) {
    return `"${file.name}" não é uma imagem aceita. Envie ${ACCEPTED_LABEL}.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `"${file.name}" tem ${formatFileSize(file.size)} e o limite é ${formatFileSize(MAX_IMAGE_BYTES)} por imagem.`;
  }
  return null;
}

/**
 * Monta a URL absoluta de um arquivo servido pela API. As URLs de imagem vêm
 * relativas (`/api/v1/uploads/...`) e o Vite não faz proxy de `/api`, então
 * elas recebem a mesma origem do axios (`VITE_API_URL`).
 */
export function toApiAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(path)) {
    return path;
  }
  return `${apiBase}${path.startsWith("/") ? path : `/${path}`}`;
}
