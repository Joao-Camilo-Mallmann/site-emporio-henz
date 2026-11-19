import type {
  ColorGroupOption,
  ColorGroupSlug,
  FurnitureColorOption,
} from "@/types";

/**
 * 11 grupos de cor exibidos no filtro lateral do catálogo.
 * Os 5 primeiros aparecem antes de "Ver mais", espelhando os tons principais de móveis.
 */
export const CORES_GRUPOS: readonly ColorGroupOption[] = [
  { slug: "madeira-clara", name: "Madeira Clara", hex: "#C29B6B" },
  { slug: "madeira-escura", name: "Madeira Escura", hex: "#4B3224" },
  {
    slug: "off-white-bege",
    name: "Off-White / Bege",
    hex: "#DDD2BE",
    light: true,
  },
  { slug: "preto", name: "Preto", hex: "#1E1E1E" },
  { slug: "madeira-media", name: "Madeira Média", hex: "#8E6743" },
  { slug: "branco", name: "Branco", hex: "#FAFAFA", light: true },
  { slug: "cinza", name: "Cinza", hex: "#8E9194" },
  { slug: "verde", name: "Verde", hex: "#4E6044" },
  { slug: "azul", name: "Azul", hex: "#2D5868" },
  {
    slug: "terracota-rose-vinho",
    name: "Terracota / Rosê",
    hex: "#B85941",
  },
  { slug: "amarelo-dourado", name: "Amarelo / Dourado", hex: "#C89635" },
];

/** Quantidade de bolinhas de cor visíveis por padrão no filtro lateral. */
export const CORES_FILTRO_INICIAIS = 5;

/** Paleta de 50 cores populares de móveis usada no cadastro e edição de produtos. */
export const CORES_MOVEIS: readonly FurnitureColorOption[] = [
  // Branco (3)
  {
    slug: "branco-neve",
    name: "Branco Neve",
    hex: "#FFFFFF",
    group: "branco",
    light: true,
  },
  {
    slug: "branco-acetinado",
    name: "Branco Acetinado",
    hex: "#F4F4F0",
    group: "branco",
    light: true,
  },
  {
    slug: "branco-gelo",
    name: "Branco Gelo",
    hex: "#EBEEF0",
    group: "branco",
    light: true,
  },

  // Off-White & Bege (8)
  {
    slug: "off-white",
    name: "Off-White",
    hex: "#F4EFE6",
    group: "off-white-bege",
    light: true,
  },
  {
    slug: "perola",
    name: "Pérola",
    hex: "#EFEAE1",
    group: "off-white-bege",
    light: true,
  },
  {
    slug: "marfim",
    name: "Marfim / Creme",
    hex: "#EADFC8",
    group: "off-white-bege",
    light: true,
  },
  {
    slug: "linho-cru",
    name: "Linho Cru",
    hex: "#DDD2BE",
    group: "off-white-bege",
    light: true,
  },
  {
    slug: "areia",
    name: "Areia",
    hex: "#D4C3A3",
    group: "off-white-bege",
    light: true,
  },
  {
    slug: "bege",
    name: "Bege",
    hex: "#C8B496",
    group: "off-white-bege",
    light: true,
  },
  {
    slug: "fendi",
    name: "Fendi",
    hex: "#B5A897",
    group: "off-white-bege",
  },
  {
    slug: "capuccino",
    name: "Capuccino / Gianduia",
    hex: "#9E8B76",
    group: "off-white-bege",
  },

  // Cinza (6)
  {
    slug: "cinza-claro",
    name: "Cinza Claro",
    hex: "#D0D2D3",
    group: "cinza",
    light: true,
  },
  {
    slug: "prata",
    name: "Prata / Inox",
    hex: "#B2B6BA",
    group: "cinza",
    light: true,
  },
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
    light: true,
  },
  {
    slug: "carvalho-claro",
    name: "Carvalho Claro",
    hex: "#CEAF82",
    group: "madeira-clara",
    light: true,
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
  {
    slug: "verde-menta",
    name: "Verde Menta",
    hex: "#A9C2B3",
    group: "verde",
    light: true,
  },
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
    light: true,
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
    light: true,
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
    light: true,
  },
];

const COR_POR_HEX = new Map<string, FurnitureColorOption>(
  CORES_MOVEIS.map((cor) => [cor.hex.toUpperCase(), cor]),
);

const GRUPO_POR_SLUG = new Map<ColorGroupSlug, ColorGroupOption>(
  CORES_GRUPOS.map((grupo) => [grupo.slug, grupo]),
);

function normalizarBusca(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function isColorGroupSlug(valor: string): valor is ColorGroupSlug {
  return GRUPO_POR_SLUG.has(valor as ColorGroupSlug);
}

/** Extrai apenas slugs válidos de grupos de cor a partir do parâmetro da URL. */
export function lerGruposCorDaQuery(valor: string): ColorGroupSlug[] {
  if (!valor) return [];
  const vistos = new Set<ColorGroupSlug>();
  for (const parte of valor.split(",")) {
    const limpo = parte.trim().toLowerCase();
    if (isColorGroupSlug(limpo)) vistos.add(limpo);
  }
  return Array.from(vistos);
}

export function encontrarCorPorHex(
  hex: string,
): FurnitureColorOption | undefined {
  return COR_POR_HEX.get(hex.trim().toUpperCase());
}

export function encontrarGrupoCor(
  slug: ColorGroupSlug,
): ColorGroupOption | undefined {
  return GRUPO_POR_SLUG.get(slug);
}

/** Rótulo amigável para uma cor salva: nome da paleta ou o próprio HEX se legada. */
export function rotuloCorHex(hex: string): string {
  return encontrarCorPorHex(hex)?.name ?? hex.trim().toUpperCase();
}

/** Filtra a paleta de 50 cores por grupo opcional e termo de busca sem acentos. */
export function filtrarCoresMoveis(
  grupo: ColorGroupSlug | "todas",
  busca: string,
): FurnitureColorOption[] {
  const termo = normalizarBusca(busca);
  return CORES_MOVEIS.filter((cor) => {
    if (grupo !== "todas" && cor.group !== grupo) return false;
    if (!termo) return true;
    const grupoNome = encontrarGrupoCor(cor.group)?.name ?? "";
    return (
      normalizarBusca(cor.name).includes(termo) ||
      normalizarBusca(grupoNome).includes(termo) ||
      cor.hex.toLowerCase().includes(termo)
    );
  });
}
