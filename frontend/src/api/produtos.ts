import { api as axios } from "@/plugins/axios";
import type {
  IProduct,
  PaginatedProductsResponse,
  ProductAdminFilterParams,
  ProductCreatePayload,
  ProductDetail,
  ProductDto,
  ProductFilterParams,
  ProductImageDto,
  ProductUpdatePayload,
  ProductVariationDto,
} from "@/types";
import { getMockProductDetail, MOCK_CATALOG_PRODUCTS } from "@/mocks/catalogo";

export const produtosApi = {
  async listar(params?: ProductFilterParams): Promise<IProduct[]> {
    try {
      const response = await axios.get<IProduct[]>("/api/produtos", { params });
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      }
    } catch {
      // Fallback resiliente no catálogo mockado caso backend não esteja disponível
    }

    let items: IProduct[] = MOCK_CATALOG_PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      description: `${p.name} - Móvel de alto padrão da Empório Henz`,
      category: p.category,
      material: p.material || "MDF",
      price: p.price,
      isAvailable: p.availability === "IN_STOCK",
      images: [p.image],
    }));

    if (params?.category) {
      const cat = params.category.toLowerCase().trim();
      items = items.filter((p) => p.category.toLowerCase().trim() === cat);
    }

    if (params?.search) {
      const s = params.search.toLowerCase().trim();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.category.toLowerCase().includes(s) ||
          p.material.toLowerCase().includes(s),
      );
    }

    if (params?.availableOnly) {
      items = items.filter((p) => p.isAvailable);
    }

    return items;
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

  /**
   * Listagem paginada do painel (`GET /produtos`). Sem fallback no catálogo
   * mockado: o painel precisa distinguir lista vazia de falha da API.
   * Para o Vendedor a API já devolve só produtos dos fornecedores vinculados.
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
    const response = await axios.delete<{ message: string }>(
      `/produtos/${id}`,
    );
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
