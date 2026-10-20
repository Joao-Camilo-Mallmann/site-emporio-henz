export const VARIATION_NOT_IN_PRODUCT_MESSAGE =
  "A variação informada não existe, foi removida ou não pertence a este produto.";

// Dados da linha de product_images gravada após o processamento da foto.
// `id` é o mesmo UUID usado no nome dos arquivos em products/<productId>/.
export interface InsertProductImageInput {
  id: string;
  productId: string;
  variationId: string | null;
  thumbnailPath: string;
  fullImagePath: string;
}

// Campos de texto aceitos no multipart de POST /produtos/:id/imagens.
export interface ProductImageUploadFields {
  variationId?: string;
}
