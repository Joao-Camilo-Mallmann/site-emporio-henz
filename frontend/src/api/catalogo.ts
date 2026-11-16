import { api as axios } from "@/plugins/axios";
import type { CatalogApiParams, Paginated, ProductListItemDto } from "@/types";

export const catalogoApi = {
  /**
   * Listagem pública paginada (`GET /produtos`). Filtros e paginação ficam no
   * servidor; o envelope `{ data, pagination }` volta sem transformação.
   */
  async buscarProdutos(
    params?: CatalogApiParams,
  ): Promise<Paginated<ProductListItemDto>> {
    const response = await axios.get<Paginated<ProductListItemDto>>(
      "/produtos",
      { params },
    );
    return response.data;
  },
};

export default catalogoApi;
