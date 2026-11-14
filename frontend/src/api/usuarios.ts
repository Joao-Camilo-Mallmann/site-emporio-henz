import { api as axios } from "@/plugins/axios";
import type {
  AssignedSupplier,
  User,
  PaginatedAssignedSuppliersResponse,
  PaginatedUsersResponse,
  PaginationParams,
  UserCreateInput,
  UserFilterParams,
  UserSupplierLinkDto,
  UserUpdateInput,
} from "@/types";

export const usuariosApi = {
  async listar(params?: UserFilterParams): Promise<PaginatedUsersResponse> {
    const response = await axios.get<PaginatedUsersResponse>("/users", {
      params,
    });
    return response.data;
  },

  async buscarPorId(id: string): Promise<User> {
    const response = await axios.get<User>(`/users/${id}`);
    return response.data;
  },

  async criar(dados: UserCreateInput): Promise<User> {
    const response = await axios.post<User>("/users", dados);
    return response.data;
  },

  async atualizar(id: string, dados: UserUpdateInput): Promise<User> {
    const response = await axios.put<User>(`/users/${id}`, dados);
    return response.data;
  },

  async deletar(id: string): Promise<{ message: string }> {
    const response = await axios.delete<{ message: string }>(`/users/${id}`);
    return response.data;
  },

  async listarFornecedores(
    userId: string,
    params?: PaginationParams,
  ): Promise<PaginatedAssignedSuppliersResponse> {
    const response = await axios.get<PaginatedAssignedSuppliersResponse>(
      `/users/${userId}/suppliers`,
      { params },
    );
    return response.data;
  },

  async listarTodosFornecedores(userId: string): Promise<AssignedSupplier[]> {
    const items: AssignedSupplier[] = [];
    let page = 1;
    let totalPages: number;
    do {
      const res = await usuariosApi.listarFornecedores(userId, {
        page,
        limit: 100,
      });
      items.push(...res.data);
      totalPages = res.pagination.totalPages || 1;
      page += 1;
    } while (page <= totalPages);
    return items;
  },

  async vincularFornecedor(
    userId: string,
    supplierId: string,
  ): Promise<UserSupplierLinkDto> {
    const response = await axios.post<UserSupplierLinkDto>(
      `/users/${userId}/suppliers`,
      { supplierId },
    );
    return response.data;
  },

  async desvincularFornecedor(
    userId: string,
    supplierId: string,
  ): Promise<{ message: string }> {
    const response = await axios.delete<{ message: string }>(
      `/users/${userId}/suppliers/${supplierId}`,
    );
    return response.data;
  },
};

export default usuariosApi;
