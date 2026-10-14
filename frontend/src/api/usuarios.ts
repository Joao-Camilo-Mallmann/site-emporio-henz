import { api as axios } from "@/plugins/axios";
import type {
  IAssignedSupplier,
  IUser,
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

  async buscarPorId(id: string): Promise<IUser> {
    const response = await axios.get<IUser>(`/users/${id}`);
    return response.data;
  },

  async criar(dados: UserCreateInput): Promise<IUser> {
    const response = await axios.post<IUser>("/users", dados);
    return response.data;
  },

  async atualizar(id: string, dados: UserUpdateInput): Promise<IUser> {
    const response = await axios.put<IUser>(`/users/${id}`, dados);
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

  async listarTodosFornecedores(userId: string): Promise<IAssignedSupplier[]> {
    const items: IAssignedSupplier[] = [];
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
