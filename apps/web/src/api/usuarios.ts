import { api as axios } from "@/plugins/axios";
import type {
  IUser,
  PaginatedUsersResponse,
  UserCreateInput,
  UserFilterParams,
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
};

export default usuariosApi;
