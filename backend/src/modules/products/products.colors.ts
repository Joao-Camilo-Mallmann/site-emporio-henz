import palette from "../../../../shared/cores-moveis.json";

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

/** HEX das cores de cada grupo da paleta compartilhada com o frontend (shared/cores-moveis.json). */
const GROUP_HEX_MAP = new Map(
  palette.groups.map((group) => [
    group.slug,
    palette.colors
      .filter((color) => color.group === group.slug)
      .map((color) => color.hex.toUpperCase()),
  ]),
);

const COLOR_SLUG_HEX_MAP = new Map(
  palette.colors.map((color) => [color.slug, color.hex.toUpperCase()]),
);

/**
 * Converte o parâmetro de query `colors` (CSV de grupos, slugs de cor ou hex)
 * na lista deduplicada de códigos HEX (#RRGGBB em maiúsculas) para filtrar
 * `product_variations.colors_hex`. Entradas inválidas são ignoradas.
 */
export function resolveColorFilterHexes(
  raw: string | null,
): string[] | undefined {
  if (!raw || raw.trim() === "") return undefined;

  const resolved = new Set<string>();
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (HEX_COLOR_REGEX.test(trimmed)) {
      resolved.add(trimmed.toUpperCase());
      continue;
    }

    const slug = trimmed.toLowerCase();
    const groupHexes = GROUP_HEX_MAP.get(slug);
    if (groupHexes) {
      for (const hex of groupHexes) resolved.add(hex);
      continue;
    }

    const colorHex = COLOR_SLUG_HEX_MAP.get(slug);
    if (colorHex) {
      resolved.add(colorHex);
    }
  }

  return resolved.size > 0 ? Array.from(resolved) : undefined;
}
