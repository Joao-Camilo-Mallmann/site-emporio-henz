import { api as axios } from "@/plugins/axios";
import { categoriasApi } from "@/api/categorias";
import type {
  CatalogFilterParams,
  CatalogProductItem,
  CatalogResponse,
  ICategory,
  ISubtype,
  PaginatedProductsResponse,
  ProductAdminFilterParams,
  ProductListItemDto,
} from "@/types";
import { filtrarCatalogoMock } from "@/mocks/catalogo";
import { slugify } from "@/utils/slug";
import { toApiAssetUrl } from "@/utils/uploads";
import { isAxiosError } from "axios";

/** Produtos por página no catálogo público (grade de 3 colunas). */
export const CATALOGO_LIMITE_PADRAO = 9;

/** Limite da página única de categorias usada para traduzir slugs em ids. */
const CATEGORIAS_LIMITE = 100;

let categoriasPromise: Promise<ICategory[]> | null = null;

/**
 * Lista pública de categorias ativas com seus subtipos, carregada uma vez e
 * compartilhada entre a tradução dos filtros, a barra lateral e o resumo da
 * tela. Em caso de falha a promessa é descartada, para a próxima chamada
 * tentar de novo.
 */
export function carregarCategorias(): Promise<ICategory[]> {
  if (!categoriasPromise) {
    categoriasPromise = categoriasApi
      .listar({ limit: CATEGORIAS_LIMITE })
      .then((response) => response.data)
      .catch((error: unknown) => {
        categoriasPromise = null;
        throw error;
      });
  }
  return categoriasPromise;
}

/** Acha a categoria cujo slug corresponde ao valor da URL (slug ou nome). */
export function encontrarCategoria(
  categorias: ICategory[],
  valor?: string,
): ICategory | undefined {
  const alvo = valor ? slugify(valor) : "";
  if (!alvo) return undefined;
  return categorias.find((categoria) => categoria.slug === alvo);
}

/**
 * Acha o subtipo cujo slug corresponde ao valor da URL. Com categoria
 * informada procura só nela; sem categoria, em todos os subtipos ativos.
 */
export function encontrarSubtipo(
  categorias: ICategory[],
  valor?: string,
  categoria?: ICategory,
): ISubtype | undefined {
  const alvo = valor ? slugify(valor) : "";
  if (!alvo) return undefined;
  const fonte = categoria ? [categoria] : categorias;
  for (const item of fonte) {
    const subtipo = item.subtypes?.find((sub) => sub.slug === alvo);
    if (subtipo) return subtipo;
  }
  return undefined;
}

/**
 * Traduz os filtros da URL para o contrato de `GET /produtos` (collection
 * Bruno). Devolve `null` quando categoria ou subcategoria não existem: nesse
 * caso nenhum produto atende ao filtro e a consulta nem é feita.
 */
async function montarParametrosApi(
  params: CatalogFilterParams,
): Promise<ProductAdminFilterParams | null> {
  const query: ProductAdminFilterParams = {
    page: params.page ?? 1,
    limit: params.limit ?? CATALOGO_LIMITE_PADRAO,
  };

  const search = params.name ? slugify(params.name) : "";
  if (search) query.search = search;

  if (params.categoria || params.subcategoria) {
    const categorias = await carregarCategorias();
    const categoria = encontrarCategoria(categorias, params.categoria);
    if (params.categoria && !categoria) return null;
    if (categoria) query.categoryId = categoria.id;

    const subtipo = encontrarSubtipo(categorias, params.subcategoria, categoria);
    if (params.subcategoria && !subtipo) return null;
    if (subtipo) query.subtypeId = subtipo.id;
  }

  const disponibilidade = params.disponibilidade ?? [];
  if (disponibilidade.length === 1) {
    query.availabilityType = disponibilidade[0];
  }

  if (typeof params.minPreco === "number" && !isNaN(params.minPreco)) {
    query.minPrice = params.minPreco;
  }
  if (typeof params.maxPreco === "number" && !isNaN(params.maxPreco)) {
    query.maxPrice = params.maxPreco;
  }

  return query;
}

function paginaVazia(params: CatalogFilterParams): CatalogResponse {
  return {
    data: [],
    pagination: {
      page: params.page ?? 1,
      limit: params.limit ?? CATALOGO_LIMITE_PADRAO,
      total: 0,
      totalPages: 0,
    },
  };
}

function descreverParcelas(maxInstallments: number): string {
  return maxInstallments > 1 ? `Até ${maxInstallments}x no cartão` : "À vista";
}

/**
 * Converte o item da listagem da API no item do card do catálogo. A listagem
 * não traz variações, então `finishes` fica vazio.
 */
export function toCatalogProductItem(
  produto: ProductListItemDto,
  categorias: ICategory[],
): CatalogProductItem {
  const categoria = categorias.find((c) => c.id === produto.categoryId);
  const subtipo = categoria?.subtypes?.find((s) => s.id === produto.subtypeId);
  const sobEncomenda = produto.availabilityType === "ON_DEMAND";

  return {
    id: produto.id,
    name: produto.name,
    slug: produto.slug,
    price: produto.referencePrice,
    installments: descreverParcelas(produto.maxInstallments),
    image: toApiAssetUrl(produto.thumbnailUrl),
    category: categoria?.slug ?? produto.categoryId,
    subcategory: subtipo?.name,
    material: produto.mainMaterial ?? undefined,
    finishes: [],
    availability: produto.availabilityType,
    estimatedDays: sobEncomenda ? produto.estimatedDays : undefined,
  };
}

/** Verdadeiro quando a requisição não recebeu resposta HTTP (rede, timeout, API parada). */
function apiForaDoAr(error: unknown): boolean {
  return isAxiosError(error) && !error.response;
}

export const catalogoApi = {
  carregarCategorias,

  /**
   * Lista paginada do catálogo público (`GET /produtos`). Traduz os filtros da
   * URL para o contrato da API, converte o envelope `{ data, pagination }` e
   * cada item para `CatalogProductItem`. O catálogo mockado só entra quando a
   * API não responde; um erro respondido pela API é propagado para a tela.
   */
  async buscarProdutos(
    params: CatalogFilterParams = {},
  ): Promise<CatalogResponse> {
    try {
      const query = await montarParametrosApi(params);
      if (!query) return paginaVazia(params);

      const response = await axios.get<PaginatedProductsResponse>(
        "/produtos",
        { params: query },
      );
      const categorias = await carregarCategorias().catch(
        (): ICategory[] => [],
      );

      return {
        data: response.data.data.map((produto) =>
          toCatalogProductItem(produto, categorias),
        ),
        pagination: response.data.pagination,
      };
    } catch (error) {
      if (apiForaDoAr(error)) {
        return filtrarCatalogoMock(params);
      }
      throw error;
    }
  },
};

export default catalogoApi;
