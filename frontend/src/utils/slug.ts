/**
 * Converte uma string arbitrária em um slug padronizado (kebab-case).
 * Remove acentos, caracteres especiais e hífens repetidos.
 */
export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // substitui caracteres especiais e espaços por hífen
    .replace(/^-+|-+$/g, ""); // remove hífens das pontas
}
