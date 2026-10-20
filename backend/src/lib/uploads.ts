import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { env } from "@/config/env";

// Prefixo público dos arquivos do diretório de uploads do backend (volume
// Docker `uploads_data` em produção). Fica sob /api/v1 para passar pelo mesmo
// proxy do nginx que já atende a API; o frontend monta o endereço completo com
// a base `VITE_API_URL`, já que o Vite não tem proxy de /api.
export const UPLOADS_PUBLIC_PREFIX = "/api/v1/uploads";

// Pastas de primeiro nível dentro do diretório de uploads.
export const UPLOAD_SCOPES = ["products", "variations"] as const;
export type UploadScope = (typeof UPLOAD_SCOPES)[number];

// Todo nome é gerado pelo servidor, então a rota de leitura só aceita este padrão.
const UUID_PATTERN =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
export const UPLOAD_OWNER_ID_REGEX = new RegExp(`^${UUID_PATTERN}$`);
export const UPLOAD_FILE_REGEX: Record<UploadScope, RegExp> = {
  products: new RegExp(`^${UUID_PATTERN}-(thumb|full)\\.webp$`),
  variations: new RegExp(`^${UUID_PATTERN}\\.webp$`),
};

export interface ProductImagePaths {
  thumbnailPath: string;
  fullImagePath: string;
}

// Converte o caminho relativo gravado no banco na URL devolvida pela API.
export function toUploadUrl(relativePath: string): string {
  const segments = relativePath
    .split("/")
    .filter((segment) => segment.length > 0)
    .map(encodeURIComponent);
  return `${UPLOADS_PUBLIC_PREFIX}/${segments.join("/")}`;
}

export function isUploadScope(value: string): value is UploadScope {
  return (UPLOAD_SCOPES as readonly string[]).includes(value);
}

// `products/<productId>/<imageId>-thumb.webp` e `...-full.webp`; o `imageId`
// também é o `id` da linha em product_images, o que facilita auditar órfãos.
export function productImagePaths(
  productId: string,
  imageId: string,
): ProductImagePaths {
  return {
    thumbnailPath: `products/${productId}/${imageId}-thumb.webp`,
    fullImagePath: `products/${productId}/${imageId}-full.webp`,
  };
}

// `variations/<variationId>/<sampleId>.webp`, com UUID novo a cada envio.
export function variationSamplePath(
  variationId: string,
  sampleId: string,
): string {
  return `variations/${variationId}/${sampleId}.webp`;
}

export function uploadsDir(): string {
  return env.UPLOADS_DIR;
}

export function toUploadAbsolutePath(relativePath: string): string {
  return path.join(uploadsDir(), relativePath);
}

// Resolve os três segmentos da rota pública para o caminho absoluto no volume.
// Devolve `null` para qualquer coisa fora do padrão: como os segmentos casam só
// com hex, `-` e `.webp`, nenhum `..`, `/` decodificado ou caminho absoluto
// chega ao `path.join`.
export function resolveUploadPath(
  scope: string,
  ownerId: string,
  file: string,
): string | null {
  if (!isUploadScope(scope)) return null;
  if (!UPLOAD_OWNER_ID_REGEX.test(ownerId)) return null;
  if (!UPLOAD_FILE_REGEX[scope].test(file)) return null;
  return path.join(uploadsDir(), scope, ownerId, file);
}

// Grava o arquivo criando as pastas intermediárias. Devolve o caminho absoluto.
export async function writeUploadFile(
  relativePath: string,
  bytes: Uint8Array,
): Promise<string> {
  const absolutePath = toUploadAbsolutePath(relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await Bun.write(absolutePath, bytes);
  return absolutePath;
}

// Compensação quando o banco falha depois da gravação: remove os arquivos da
// requisição sem propagar erro (um arquivo já ausente não é problema).
export async function removeUploadFiles(relativePaths: string[]): Promise<void> {
  await Promise.all(
    relativePaths.map((relativePath) =>
      rm(toUploadAbsolutePath(relativePath), { force: true }).catch(
        () => undefined,
      ),
    ),
  );
}
