import { api as axios } from "@/plugins/axios";
import type {
  ISupplier,
  SupplierCreateInput,
  SupplierUpdateInput,
} from "@/types";

export const fornecedoresApi = {
  async listar(): Promise<ISupplier[]> {
    const response = await axios.get<ISupplier[]>("/suppliers");
    return response.data;
  },

  async buscarPorId(id: string): Promise<ISupplier> {
    const response = await axios.get<ISupplier>(`/suppliers/${id}`);
    return response.data;
  },

  async criar(dados: SupplierCreateInput): Promise<ISupplier> {
    const response = await axios.post<ISupplier>("/suppliers", dados);
    return response.data;
  },

  async atualizar(id: string, dados: SupplierUpdateInput): Promise<ISupplier> {
    const response = await axios.put<ISupplier>(`/suppliers/${id}`, dados);
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
