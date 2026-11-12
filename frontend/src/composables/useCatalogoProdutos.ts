import { catalogoApi } from "@/api";
import { encontrarCategoria, useCategoriasStore } from "@/stores/categorias";
import type {
  CatalogApiParams,
  CatalogAvailability,
  CatalogFilterParams,
  CatalogProductItem,
  ICategory,
  PaginationMeta,
  ProductListItemDto,
} from "@/types";
import { slugify } from "@/utils/slug";
import { toApiAssetUrl } from "@/utils/uploads";
import { ref } from "vue";
import type { LocationQuery, LocationQueryRaw } from "vue-router";

export const CATALOGO_POR_PAGINA = 9;

/** Chaves da URL que pertencem aos filtros; qualquer outra (ex.: `?lista=`) é preservada. */
const CHAVES_FILTRO = [
  "name",
  "q",
  "categoria",
  "subcategoria",
  "disponibilidade",
  "minPreco",
  "maxPreco",
  "page",
  // Filtros e ordenação removidos: links antigos são ignorados e limpos na próxima atualização
  "materiais",
  "cores",
  "marcas",
  "ordem",
];

const PAGINACAO_VAZIA: PaginationMeta = {
  page: 1,
  limit: CATALOGO_POR_PAGINA,
  total: 0,
  totalPages: 1,
};

function textoDaQuery(valor: LocationQuery[string]): string {
  return typeof valor === "string" ? valor : "";
}

function numeroDaQuery(valor: LocationQuery[string]): number | undefined {
  if (typeof valor !== "string" || valor.trim() === "") return undefined;
  const numero = Number(valor);
  return Number.isFinite(numero) && numero >= 0 ? numero : undefined;
}

/** Lê os filtros da URL. `?name=` (navbar) tem prioridade sobre o legado `?q=`. */
export function lerFiltrosDaRota(query: LocationQuery): CatalogFilterParams {
  const disponibilidade = textoDaQuery(query.disponibilidade)
    .split(",")
    .filter(
      (valor): valor is CatalogAvailability =>
        valor === "IN_STOCK" || valor === "ON_DEMAND",
    );
  const pagina = parseInt(textoDaQuery(query.page), 10);

  return {
    name: textoDaQuery(query.name) || textoDaQuery(query.q) || undefined,
    categoria: textoDaQuery(query.categoria) || undefined,
    subcategoria: textoDaQuery(query.subcategoria) || undefined,
    disponibilidade,
    minPreco: numeroDaQuery(query.minPreco),
    maxPreco: numeroDaQuery(query.maxPreco),
    page: pagina > 0 ? pagina : 1,
    limit: CATALOGO_POR_PAGINA,
  };
}

/** Monta a query nova: parte da atual e troca só as chaves de filtro. */
export function montarQueryDaRota(
  filtros: CatalogFilterParams,
  queryAtual: LocationQuery,
): LocationQueryRaw {
  const query: LocationQueryRaw = { ...queryAtual };
  CHAVES_FILTRO.forEach((chave) => delete query[chave]);

  if (filtros.name) query.name = filtros.name;
  if (filtros.categoria) query.categoria = filtros.categoria;
  if (filtros.subcategoria) query.subcategoria = filtros.subcategoria;
  if (filtros.disponibilidade?.length) {
    query.disponibilidade = filtros.disponibilidade.join(",");
  }
  if (filtros.minPreco !== undefined) query.minPreco = String(filtros.minPreco);
  if (filtros.maxPreco !== undefined) query.maxPreco = String(filtros.maxPreco);
  if (filtros.page && filtros.page > 1) query.page = String(filtros.page);
  return query;
}

/**
 * Converte `ProductListItemDto` no item do card. Os nomes de categoria e
 * subtipo vêm da lista de categorias, porque a listagem só traz os ids.
 */
export function mapearProdutoCatalogo(
  dto: ProductListItemDto,
  categorias: readonly ICategory[] = [],
): CatalogProductItem {
  const categoria = categorias.find((item) => item.id === dto.categoryId);
  const subtipo = categoria?.subtypes?.find((item) => item.id === dto.subtypeId);

  return {
    id: dto.id,
    name: dto.name,
    slug: dto.slug,
    price: Number(dto.referencePrice),
    installments: `Até ${dto.maxInstallments}x no cartão`,
    image: toApiAssetUrl(dto.thumbnailUrl),
    category: categoria?.name ?? "",
    subcategory: subtipo?.name,
    material: dto.mainMaterial ?? undefined,
    finishes: [],
    availability: dto.availabilityType,
    estimatedDays: dto.estimatedDays,
  };
}

/** `undefined` quando a categoria ou o subtipo da URL não existem entre os ativos. */
function resolverIds(
  filtros: CatalogFilterParams,
  categorias: readonly ICategory[],
): Pick<CatalogApiParams, "categoryId" | "subtypeId"> | undefined {
  if (!filtros.categoria && !filtros.subcategoria) return {};

  let candidatas = categorias;
  let categoryId: string | undefined;
  if (filtros.categoria) {
    const categoria = encontrarCategoria(categorias, slugify(filtros.categoria));
    if (!categoria) return undefined;
    categoryId = categoria.id;
    candidatas = [categoria];
  }
  if (!filtros.subcategoria) return { categoryId };

  const alvo = slugify(filtros.subcategoria);
  const subtipo = candidatas
    .flatMap((categoria) => categoria.subtypes ?? [])
    .find((item) => item.slug === alvo || slugify(item.name) === alvo);
  if (!subtipo) return undefined;
  return { categoryId, subtypeId: subtipo.id };
}

/** Com um único checkbox marcado filtra; com nenhum ou os dois, não envia filtro. */
function traduzirDisponibilidade(
  disponibilidade: CatalogAvailability[] | undefined,
): CatalogAvailability | undefined {
  return disponibilidade?.length === 1 ? disponibilidade[0] : undefined;
}

export function useCatalogoProdutos() {
  const categoriasStore = useCategoriasStore();
  const products = ref<CatalogProductItem[]>([]);
  const pagination = ref<PaginationMeta>({ ...PAGINACAO_VAZIA });
  const loading = ref(false);
  const error = ref<string | null>(null);
  let ultimaRequisicao = 0;

  function limpar(pagina: number) {
    products.value = [];
    pagination.value = { ...PAGINACAO_VAZIA, page: pagina };
  }

  async function carregar(filtros: CatalogFilterParams) {
    const requisicao = ++ultimaRequisicao;
    loading.value = true;
    error.value = null;
    const pagina = filtros.page ?? 1;

    try {
      await categoriasStore.carregar();
      if (requisicao !== ultimaRequisicao) return;

      const precisaDeCategorias = !!(filtros.categoria || filtros.subcategoria);
      if (precisaDeCategorias && !categoriasStore.carregadas) {
        throw new Error(
          categoriasStore.error ?? "Não foi possível carregar as categorias.",
        );
      }

      const ids = resolverIds(filtros, categoriasStore.lista);
      if (!ids) {
        limpar(pagina);
        return;
      }

      const resposta = await catalogoApi.buscarProdutos({
        page: pagina,
        limit: filtros.limit ?? CATALOGO_POR_PAGINA,
        search: filtros.name?.trim() || undefined,
        ...ids,
        availabilityType: traduzirDisponibilidade(filtros.disponibilidade),
        minPrice: filtros.minPreco,
        maxPrice: filtros.maxPreco,
      });
      if (requisicao !== ultimaRequisicao) return;

      products.value = resposta.data.map((produto) =>
        mapearProdutoCatalogo(produto, categoriasStore.lista),
      );
      pagination.value = {
        ...resposta.pagination,
        totalPages: resposta.pagination.totalPages || 1,
      };
    } catch {
      if (requisicao !== ultimaRequisicao) return;
      limpar(pagina);
      // Erro do axios traz mensagem técnica ("Network Error"); a tela mostra um texto próprio
      error.value = "Verifique sua conexão e tente de novo em instantes.";
    } finally {
      if (requisicao === ultimaRequisicao) loading.value = false;
    }
  }

  return { products, pagination, loading, error, carregar };
}
