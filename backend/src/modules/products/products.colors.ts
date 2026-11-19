import type {
  ColorGroupDefinition,
  ColorGroupSlug,
  FurnitureColorDefinition,
} from "@/modules/products/products.types";

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

/**
 * 11 famílias usadas no filtro do catálogo. Os 5 primeiros grupos refletem
 * os tons mais frequentes em móveis (madeiras, off-white/bege e preto).
 */
export const COLOR_GROUPS: readonly ColorGroupDefinition[] = [
  { slug: "madeira-clara", name: "Madeira Clara", hex: "#C29B6B" },
  { slug: "madeira-escura", name: "Madeira Escura", hex: "#4B3224" },
  { slug: "off-white-bege", name: "Off-White / Bege", hex: "#DDD2BE" },
  { slug: "preto", name: "Preto", hex: "#1E1E1E" },
  { slug: "madeira-media", name: "Madeira Média", hex: "#8E6743" },
  { slug: "branco", name: "Branco", hex: "#FAFAFA" },
  { slug: "cinza", name: "Cinza", hex: "#8E9194" },
  { slug: "verde", name: "Verde", hex: "#4E6044" },
  { slug: "azul", name: "Azul", hex: "#2D5868" },
  {
    slug: "terracota-rose-vinho",
    name: "Terracota / Rosê / Vinho",
    hex: "#B85941",
  },
  { slug: "amarelo-dourado", name: "Amarelo / Dourado", hex: "#C89635" },
];

/** Paleta de 50 cores populares de móveis associadas aos grupos de filtro. */
export const FURNITURE_COLORS: readonly FurnitureColorDefinition[] = [
  // Branco (3)
  { slug: "branco-neve", name: "Branco Neve", hex: "#FFFFFF", group: "branco" },
  {
    slug: "branco-acetinado",
    name: "Branco Acetinado",
    hex: "#F4F4F0",
    group: "branco",
  },
  { slug: "branco-gelo", name: "Branco Gelo", hex: "#EBEEF0", group: "branco" },

  // Off-White & Bege (8)
  {
    slug: "off-white",
    name: "Off-White",
    hex: "#F4EFE6",
    group: "off-white-bege",
  },
  { slug: "perola", name: "Pérola", hex: "#EFEAE1", group: "off-white-bege" },
  {
    slug: "marfim",
    name: "Marfim / Creme",
    hex: "#EADFC8",
    group: "off-white-bege",
  },
  {
    slug: "linho-cru",
    name: "Linho Cru",
    hex: "#DDD2BE",
    group: "off-white-bege",
  },
  { slug: "areia", name: "Areia", hex: "#D4C3A3", group: "off-white-bege" },
  { slug: "bege", name: "Bege", hex: "#C8B496", group: "off-white-bege" },
  { slug: "fendi", name: "Fendi", hex: "#B5A897", group: "off-white-bege" },
  {
    slug: "capuccino",
    name: "Capuccino / Gianduia",
    hex: "#9E8B76",
    group: "off-white-bege",
  },

  // Cinza (6)
  { slug: "cinza-claro", name: "Cinza Claro", hex: "#D0D2D3", group: "cinza" },
  { slug: "prata", name: "Prata / Inox", hex: "#B2B6BA", group: "cinza" },
  { slug: "cinza-medio", name: "Cinza Médio", hex: "#8E9194", group: "cinza" },
  {
    slug: "cimento",
    name: "Cimento / Concreto",
    hex: "#7D7F7D",
    group: "cinza",
  },
  { slug: "chumbo", name: "Chumbo", hex: "#55585B", group: "cinza" },
  { slug: "grafite", name: "Grafite", hex: "#3B3D40", group: "cinza" },

  // Preto (2)
  { slug: "preto-fosco", name: "Preto Fosco", hex: "#242424", group: "preto" },
  { slug: "preto", name: "Preto", hex: "#121212", group: "preto" },

  // Madeira Clara (7)
  {
    slug: "natural",
    name: "Pinus / Natural",
    hex: "#DEC39B",
    group: "madeira-clara",
  },
  {
    slug: "carvalho-claro",
    name: "Carvalho Claro",
    hex: "#CEAF82",
    group: "madeira-clara",
  },
  { slug: "nature", name: "Nature", hex: "#C29B6B", group: "madeira-clara" },
  { slug: "tauari", name: "Tauari", hex: "#C49E6E", group: "madeira-clara" },
  {
    slug: "jequitiba",
    name: "Jequitibá",
    hex: "#B98D5B",
    group: "madeira-clara",
  },
  {
    slug: "carvalho-mel",
    name: "Carvalho Mel",
    hex: "#B88642",
    group: "madeira-clara",
  },
  { slug: "amendoa", name: "Amêndoa", hex: "#B08456", group: "madeira-clara" },

  // Madeira Média (7)
  { slug: "freijo", name: "Freijó", hex: "#8E6743", group: "madeira-media" },
  {
    slug: "cinamomo",
    name: "Cinamomo",
    hex: "#A16440",
    group: "madeira-media",
  },
  {
    slug: "castanho",
    name: "Castanho",
    hex: "#7F5539",
    group: "madeira-media",
  },
  {
    slug: "carvalho-malva",
    name: "Carvalho Malva",
    hex: "#9E7656",
    group: "madeira-media",
  },
  {
    slug: "caramelo",
    name: "Caramelo / Cognac",
    hex: "#A96234",
    group: "madeira-media",
  },
  { slug: "cedro", name: "Cedro", hex: "#945435", group: "madeira-media" },
  {
    slug: "demolicao",
    name: "Demolição / Rústico",
    hex: "#7A5C44",
    group: "madeira-media",
  },

  // Madeira Escura (5)
  {
    slug: "nogueira",
    name: "Nogueira",
    hex: "#5E402D",
    group: "madeira-escura",
  },
  { slug: "imbuia", name: "Imbuia", hex: "#4B3224", group: "madeira-escura" },
  { slug: "cacau", name: "Cacau", hex: "#543B2E", group: "madeira-escura" },
  { slug: "tabaco", name: "Tabaco", hex: "#3D281E", group: "madeira-escura" },
  {
    slug: "cafe",
    name: "Café / Ébano",
    hex: "#2B1D16",
    group: "madeira-escura",
  },

  // Verde (4)
  { slug: "verde-menta", name: "Verde Menta", hex: "#A9C2B3", group: "verde" },
  {
    slug: "verde-salvia",
    name: "Verde Sálvia",
    hex: "#879B82",
    group: "verde",
  },
  {
    slug: "verde-musgo",
    name: "Verde Musgo / Oliva",
    hex: "#4E6044",
    group: "verde",
  },
  {
    slug: "verde-esmeralda",
    name: "Verde Esmeralda",
    hex: "#235A4A",
    group: "verde",
  },

  // Azul (3)
  {
    slug: "azul-claro",
    name: "Azul Claro / Serenity",
    hex: "#9BB2C4",
    group: "azul",
  },
  {
    slug: "azul-petroleo",
    name: "Azul Petróleo",
    hex: "#2D5868",
    group: "azul",
  },
  {
    slug: "azul-marinho",
    name: "Azul Marinho",
    hex: "#223654",
    group: "azul",
  },

  // Terracota, Rosê & Vinho (3)
  {
    slug: "rose",
    name: "Rosê / Nude",
    hex: "#D4A79E",
    group: "terracota-rose-vinho",
  },
  {
    slug: "terracota",
    name: "Terracota / Telha",
    hex: "#B85941",
    group: "terracota-rose-vinho",
  },
  {
    slug: "marsala",
    name: "Marsala / Vinho",
    hex: "#6E2A33",
    group: "terracota-rose-vinho",
  },

  // Amarelo & Dourado (2)
  {
    slug: "mostarda",
    name: "Mostarda / Ocre",
    hex: "#C89635",
    group: "amarelo-dourado",
  },
  {
    slug: "dourado",
    name: "Dourado / Champagne",
    hex: "#C7B07B",
    group: "amarelo-dourado",
  },
];

const GROUP_HEX_MAP = new Map<ColorGroupSlug, string[]>();
for (const group of COLOR_GROUPS) {
  GROUP_HEX_MAP.set(group.slug, []);
}
for (const color of FURNITURE_COLORS) {
  GROUP_HEX_MAP.get(color.group)?.push(color.hex.toUpperCase());
}

const COLOR_SLUG_HEX_MAP = new Map<string, string>(
  FURNITURE_COLORS.map((color) => [color.slug, color.hex.toUpperCase()]),
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
    const groupHexes = GROUP_HEX_MAP.get(slug as ColorGroupSlug);
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
