import { api as axios } from "@/plugins/axios";
import type {
  IProduct,
  ProductFilterParams,
  ProductCreateInput,
  ProductDetail,
} from "@/types";
import { getMockProductDetail } from "@/mocks/catalogo";

export const produtosApi = {
  async listar(params?: ProductFilterParams): Promise<IProduct[]> {
    const response = await axios.get<IProduct[]>("/api/produtos", { params });
    return response.data;
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
