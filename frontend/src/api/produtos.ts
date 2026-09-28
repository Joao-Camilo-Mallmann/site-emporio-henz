import { api as axios } from "@/plugins/axios";
import type {
  IProduct,
  ProductFilterParams,
  ProductCreateInput,
} from "@/types";

export default {
  async listar(params?: ProductFilterParams): Promise<IProduct[]> {
    const response = await axios.get<IProduct[]>("/api/produtos", { params });
    return response.data;
  },

  async buscarPorId(id: string): Promise<IProduct> {
    const response = await axios.get<IProduct>(`/api/produtos/${id}`);
    return response.data;
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
