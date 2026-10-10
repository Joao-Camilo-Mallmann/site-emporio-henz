// Limite das colunas VARCHAR(255) de `name` e `slug` em categories e product_subtypes.
export const NAME_MAX_LENGTH = 255;
export const SLUG_MAX_LENGTH = 255;

export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // substitui caracteres especiais e espaços por hífen
    .replace(/^-+|-+$/g, ""); // remove hífens das pontas
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}
