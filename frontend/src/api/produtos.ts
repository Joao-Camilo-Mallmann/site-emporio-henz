import { api as axios } from "@/plugins/axios";
import type {
  IProduct,
  ProductFilterParams,
  ProductCreateInput,
  ProductDetail,
} from "@/types";
import { getMockProductDetail, MOCK_CATALOG_PRODUCTS } from "@/mocks/catalogo";

export const produtosApi = {
  async listar(params?: ProductFilterParams): Promise<IProduct[]> {
    try {
      const response = await axios.get<IProduct[]>("/api/produtos", { params });
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // Fallback resiliente no catálogo mockado caso backend não esteja disponível
    }

    let items: IProduct[] = MOCK_CATALOG_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      description: `${p.name} - Móvel de alto padrão da Empório Henz`,
      category: p.category,
      material: p.material || "MDF",
      price: p.price,
      isAvailable: p.availability === "IN_STOCK",
      images: [p.image],
    }));

    if (params?.category) {
      const cat = params.category.toLowerCase().trim();
      items = items.filter((p) => p.category.toLowerCase().trim() === cat);
    }

    if (params?.search) {
      const s = params.search.toLowerCase().trim();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.category.toLowerCase().includes(s) ||
          p.material.toLowerCase().includes(s),
      );
    }

    if (params?.availableOnly) {
      items = items.filter((p) => p.isAvailable);
    }

    return items;
  },

  async buscarPorId(id: string): Promise<ProductDetail> {
    try {
      const response = await axios.get<ProductDetail>(`/produtos/${id}`);
      if (response.data && response.data.id) {
        return response.data;
      }
    } catch {
      // Fallback resiliente no catálogo mockado caso backend não esteja disponível
    }

    const mockDetail = getMockProductDetail(id);
    if (mockDetail) {
      return mockDetail;
    }

    throw new Error(`Produto "${id}" não encontrado.`);
  },

  async insert(dados: ProductCreateInput): Promise<IProduct> {
    const response = await axios.post<IProduct>("/api/produtos", dados);
    return response.data;
  },

  async atualizar(
    id: string,
    dados: Partial<ProductCreateInput>,
  ): Promise<IProduct> {
    const response = await axios.put<IProduct>(`/api/produtos/${id}`, dados);
    return response.data;
  },

  async deletar(id: string): Promise<{ success: boolean; message: string }> {
    const response = await axios.delete<{ success: boolean; message: string }>(
      `/api/produtos/${id}`,
    );
    return response.data;
  },
};

export default produtosApi;
