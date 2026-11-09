import { api as axios } from "@/plugins/axios";
import type {
  AddListItemPayload,
  ApiList,
  ApiListItem,
  ApiSharedList,
} from "@/types";

export const listasApi = {
  // Todas as listas do cliente logado, já com os itens de cada uma
  async listar(): Promise<ApiList[]> {
    const response = await axios.get<ApiList[]>("/listas", {
      params: { itens: "true" },
    });
    return response.data;
  },

  async criar(name: string): Promise<ApiList> {
    const response = await axios.post<ApiList>("/listas", { name });
    return response.data;
  },

  async renomear(id: string, name: string): Promise<ApiList> {
    const response = await axios.patch<ApiList>(`/listas/${id}`, { name });
    return response.data;
  },

  async excluir(id: string): Promise<void> {
    await axios.delete(`/listas/${id}`);
  },

  async adicionarItem(
    listId: string,
    payload: AddListItemPayload,
  ): Promise<ApiListItem> {
    const response = await axios.post<ApiListItem>(
      `/listas/${listId}/itens`,
      payload,
    );
    return response.data;
  },

  async removerItem(listId: string, itemId: string): Promise<void> {
    await axios.delete(`/listas/${listId}/itens/${itemId}`);
  },

  // Link público: não exige login
  async buscarCompartilhada(shareSlug: string): Promise<ApiSharedList> {
    const response = await axios.get<ApiSharedList>(
      `/listas/compartilhadas/${shareSlug}`,
    );
    return response.data;
  },
};

export default listasApi;
