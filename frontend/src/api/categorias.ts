import { api as axios } from "@/plugins/axios";
import type {
  CategoryCreateInput,
  CategoryFilterParams,
  CategoryUpdateInput,
  ICategory,
  ISubtype,
  PaginatedCategoriesResponse,
  PaginatedSubtypesResponse,
  SubtypeCreateInput,
  SubtypeFilterParams,
  SubtypeUpdateInput,
} from "@/types";

export const categoriasApi = {
  // Categorias
  async listar(
    params?: CategoryFilterParams,
  ): Promise<PaginatedCategoriesResponse> {
    const response = await axios.get<PaginatedCategoriesResponse>("/categorias", {
      params,
    });
    return response.data;
  },

  async buscarPorId(id: string): Promise<ICategory> {
    const response = await axios.get<ICategory>(`/categorias/${id}`);
    return response.data;
  },

  async criar(dados: CategoryCreateInput): Promise<ICategory> {
    const response = await axios.post<ICategory>("/categorias", dados);
    return response.data;
  },

  async atualizar(id: string, dados: CategoryUpdateInput): Promise<ICategory> {
    const response = await axios.put<ICategory>(`/categorias/${id}`, dados);
    return response.data;
  },

  async deletar(id: string): Promise<{ message: string }> {
    const response = await axios.delete<{ message: string }>(
      `/categorias/${id}`,
    );
    return response.data;
  },

  // Subtipos
  async listarSubtipos(
    params?: SubtypeFilterParams,
  ): Promise<PaginatedSubtypesResponse> {
    const response = await axios.get<PaginatedSubtypesResponse>("/subtipos", {
      params,
    });
    return response.data;
  },

  async buscarSubtipoPorId(id: string): Promise<ISubtype> {
    const response = await axios.get<ISubtype>(`/subtipos/${id}`);
    return response.data;
  },

  async criarSubtipo(dados: SubtypeCreateInput): Promise<ISubtype> {
    const response = await axios.post<ISubtype>("/subtipos", dados);
    return response.data;
  },

  async atualizarSubtipo(
    id: string,
    dados: SubtypeUpdateInput,
  ): Promise<ISubtype> {
    const response = await axios.put<ISubtype>(`/subtipos/${id}`, dados);
    return response.data;
  },

  async deletarSubtipo(id: string): Promise<{ message: string }> {
    const response = await axios.delete<{ message: string }>(`/subtipos/${id}`);
    return response.data;
  },
};

export const subtiposApi = {
  listar: categoriasApi.listarSubtipos,
  buscarPorId: categoriasApi.buscarSubtipoPorId,
  criar: categoriasApi.criarSubtipo,
  atualizar: categoriasApi.atualizarSubtipo,
  deletar: categoriasApi.deletarSubtipo,
};

export default categoriasApi;
