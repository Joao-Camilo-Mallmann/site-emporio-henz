import { api as axios } from "@/plugins/axios";
import type {
  PaginatedProductsResponse,
  ProductAdminFilterParams,
  ProductCreatePayload,
  ProductDto,
  ProductImageDto,
  ProductListItemDto,
  ProductUpdatePayload,
  ProductVariationDto,
} from "@/types";

export const produtosApi = {
  async buscarPorId(idOuSlug: string): Promise<ProductDto> {
    const response = await axios.get<ProductDto>(`/produtos/${idOuSlug}`);
    return response.data;
  },

  async buscarRecomendados(slugOuId: string): Promise<ProductListItemDto[]> {
    const response = await axios.get<ProductListItemDto[]>(
      `/produtos/${slugOuId}/recomendados`,
    );
    return response.data;
  },

  /**
   * Listagem paginada do painel (`GET /produtos`). Para o Vendedor a API já
   * devolve só produtos dos fornecedores vinculados.
   */
  async listarAdmin(
    params?: ProductAdminFilterParams,
  ): Promise<PaginatedProductsResponse> {
    const response = await axios.get<PaginatedProductsResponse>("/produtos", {
      params,
    });
    return response.data;
  },

  /** Produto completo com `variations` e `images`, para a tela de edição. */
  async buscarDetalhe(id: string): Promise<ProductDto> {
    const response = await axios.get<ProductDto>(`/produtos/${id}`);
    return response.data;
  },

  async criar(dados: ProductCreatePayload): Promise<ProductDto> {
    const response = await axios.post<ProductDto>("/produtos", dados);
    return response.data;
  },

  async atualizar(
    id: string,
    dados: ProductUpdatePayload,
  ): Promise<ProductDto> {
    const response = await axios.put<ProductDto>(`/produtos/${id}`, dados);
    return response.data;
  },

  async deletar(id: string): Promise<{ message: string }> {
    const response = await axios.delete<{ message: string }>(`/produtos/${id}`);
    return response.data;
  },

  /**
   * Envia uma foto do produto em `multipart/form-data`. O header explícito é
   * obrigatório: a instância do axios fixa `application/json`, e com ele o
   * axios 1.x serializaria o `FormData` como JSON. O navegador completa o
   * `boundary`.
   */
  async enviarFoto(
    id: string,
    file: File,
    variationId?: string | null,
  ): Promise<ProductImageDto> {
    const form = new FormData();
    form.append("file", file);
    if (variationId) {
      form.append("variationId", variationId);
    }
    const response = await axios.post<ProductImageDto>(
      `/produtos/${id}/imagens`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  /** Envia a amostra de textura de uma variação (mesmo cuidado de `enviarFoto`). */
  async enviarAmostra(
    id: string,
    variationId: string,
    file: File,
  ): Promise<ProductVariationDto> {
    const form = new FormData();
    form.append("file", file);
    const response = await axios.put<ProductVariationDto>(
      `/produtos/${id}/variacoes/${variationId}/amostra`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },

  /** Exclusão lógica de uma foto do produto. */
  async removerFoto(id: string, imageId: string): Promise<{ message: string }> {
    const response = await axios.delete<{ message: string }>(
      `/produtos/${id}/imagens/${imageId}`,
    );
    return response.data;
  },

  /** Limpa a amostra da variação; o arquivo antigo continua no volume. */
  async removerAmostra(
    id: string,
    variationId: string,
  ): Promise<ProductVariationDto> {
    const response = await axios.delete<ProductVariationDto>(
      `/produtos/${id}/variacoes/${variationId}/amostra`,
    );
    return response.data;
  },
};

export default produtosApi;
