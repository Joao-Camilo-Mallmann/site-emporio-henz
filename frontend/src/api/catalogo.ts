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
      // Fallback estático mockado para visualização no frontend sem dependência do backend
    }

    return {
      items: MOCK_CATALOG_PRODUCTS,
      meta: {
        currentPage: params?.page || 1,
        totalPages: 1,
        totalItems: MOCK_CATALOG_PRODUCTS.length,
        itemsPerPage: params?.limit || 9,
      },
    };
  },
};

export default catalogoApi;
