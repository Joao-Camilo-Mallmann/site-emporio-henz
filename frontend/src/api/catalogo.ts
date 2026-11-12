import type { CatalogFilterParams, CatalogResponse } from "@/types";
import { getMockProductDetail, MOCK_CATALOG_PRODUCTS } from "@/mocks/catalogo";
import { matchesCatalogSearch } from "@/utils/catalog-search";

export const catalogoApi = {
  async buscarProdutos(
    params?: CatalogFilterParams,
  ): Promise<CatalogResponse> {
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

    if (params?.name?.trim()) {
      const query = params.name.trim();
      items = items.filter((product) => {
        const description = getMockProductDetail(product.id)?.description;
        const searchableText = [
          product.name,
          description,
          product.category,
          product.subcategory,
          product.material,
          product.brand,
        ]
          .filter(Boolean)
          .join(" ");

        return matchesCatalogSearch(searchableText, query);
      });
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

    if (params?.disponibilidade && params.disponibilidade.length > 0) {
      items = items.filter(
        (p) =>
          p.availability && params.disponibilidade!.includes(p.availability),
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
