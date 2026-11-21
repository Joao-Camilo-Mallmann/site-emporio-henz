import type {
  ColorGroupOption,
  ColorGroupSlug,
  FurnitureColorOption,
} from "@/types";
import palette from "../../../shared/cores-moveis.json";

/**
 * Paleta única de cores de móveis, compartilhada com o backend
 * (shared/cores-moveis.json). Grupos em ordem visual: os 5 primeiros aparecem
 * antes de "Ver mais" no filtro; cada grupo de cores vai do claro ao escuro.
 */
export const CORES_GRUPOS = palette.groups as readonly ColorGroupOption[];
export const CORES_MOVEIS = palette.colors as readonly FurnitureColorOption[];

/** Quantidade de bolinhas de cor visíveis por padrão no filtro lateral. */
export const CORES_FILTRO_INICIAIS = 5;

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

/** Filtra a paleta de cores por grupo opcional e termo de busca sem acentos. */
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
