import { api as axios } from "@/plugins/axios";
import type {
  CatalogFilterParams,
  CatalogResponse,
} from "@/types";
import { MOCK_CATALOG_PRODUCTS } from "@/mocks/catalogo";

export const catalogoApi = {
  /**
   * Envia os parâmetros de filtro para o endpoint REST via GET.
   * Toda a lógica de filtragem reside no servidor REST.
   * Mantém fallback mockado estático para navegação e testes de interface.
   */
  async buscarProdutos(
    params?: CatalogFilterParams,
  ): Promise<CatalogResponse> {
    try {
      const response = await axios.get<CatalogResponse>("/produtos", {
        params,
      });
      if (response.data && Array.isArray(response.data.items)) {
        return response.data;
      }
    } catch {
      // Fallback estático mockado para navegação e testes no frontend sem dependência do backend
    }

    let items = [...MOCK_CATALOG_PRODUCTS];

    if (params?.categoria) {
      const cat = params.categoria.toLowerCase().trim();
      items = items.filter((p) => p.category.toLowerCase().trim() === cat);
    }

    if (params?.subcategoria) {
      const sub = params.subcategoria.toLowerCase().trim();
      items = items.filter(
        (p) => p.subcategory && p.subcategory.toLowerCase().trim() === sub,
      );
    }

    if (params?.name) {
      const q = params.name.toLowerCase().trim();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q)),
      );
    }

    if (params?.materiais && params.materiais.length > 0) {
      items = items.filter(
        (p) => p.material && params.materiais!.includes(p.material),
      );
    }

    if (params?.marcas && params.marcas.length > 0) {
      items = items.filter(
        (p) => p.brand && params.marcas!.includes(p.brand),
      );
    }

    if (params?.minPreco !== undefined && !isNaN(params.minPreco)) {
      items = items.filter((p) => p.price >= params.minPreco!);
    }

    if (params?.maxPreco !== undefined && !isNaN(params.maxPreco)) {
      items = items.filter((p) => p.price <= params.maxPreco!);
    }

    if (params?.ordem === "menor-preco") {
      items.sort((a, b) => a.price - b.price);
    } else if (params?.ordem === "maior-preco") {
      items.sort((a, b) => b.price - a.price);
    }

    const page = params?.page || 1;
    const limit = params?.limit || 9;
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    const paginatedItems = items.slice((page - 1) * limit, page * limit);

    return {
      items: paginatedItems,
      meta: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    };
  },
};

export default catalogoApi;
