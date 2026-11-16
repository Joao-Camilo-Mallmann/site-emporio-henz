import { api as axios } from "@/plugins/axios";
import type {
  Supplier,
  PaginatedSuppliersResponse,
  SupplierCreateInput,
  SupplierFilterParams,
  SupplierUpdateInput,
} from "@/types";

export const fornecedoresApi = {
  async listar(
    params?: SupplierFilterParams,
  ): Promise<PaginatedSuppliersResponse> {
    const response = await axios.get<PaginatedSuppliersResponse>("/suppliers", {
      params,
    });
    return response.data;
  },

  async buscarPorId(id: string): Promise<Supplier> {
    const response = await axios.get<Supplier>(`/suppliers/${id}`);
    return response.data;
  },

  async criar(dados: SupplierCreateInput): Promise<Supplier> {
    const response = await axios.post<Supplier>("/suppliers", dados);
    return response.data;
  },

  async atualizar(id: string, dados: SupplierUpdateInput): Promise<Supplier> {
    const response = await axios.put<Supplier>(`/suppliers/${id}`, dados);
    return response.data;
  },

  async deletar(id: string): Promise<{ message: string }> {
    const response = await axios.delete<{ message: string }>(
      `/suppliers/${id}`,
    );
    return response.data;
  },
};

export default fornecedoresApi;
