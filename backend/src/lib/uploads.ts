// Prefixo público dos arquivos do diretório de uploads do backend (volume
// Docker `uploads_data` em produção). Fica sob /api/v1 para passar pelos
// mesmos proxies do Vite e do Nginx que já atendem a API.
export const UPLOADS_PUBLIC_PREFIX = "/api/v1/uploads";

// Converte o caminho relativo gravado no banco na URL devolvida pela API.
export function toUploadUrl(relativePath: string): string {
  const segments = relativePath
    .split("/")
    .filter((segment) => segment.length > 0)
    .map(encodeURIComponent);
  return `${UPLOADS_PUBLIC_PREFIX}/${segments.join("/")}`;
}
