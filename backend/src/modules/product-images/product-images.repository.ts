import { sql } from "@/config/database";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import {
  InsertProductImageInput,
  VARIATION_NOT_IN_PRODUCT_MESSAGE,
} from "@/modules/product-images/product-images.types";
import {
  mapProductImageRow,
  mapProductVariationRow,
} from "@/modules/products/products.repository";
import {
  ProductImageDbRow,
  ProductImageDto,
  ProductVariationDbRow,
  ProductVariationDto,
} from "@/modules/products/products.types";

export class ProductImagesRepository {
  // Variação ativa que pertence ao produto; `null` se inexistente, removida ou de outro produto.
  async findActiveVariation(
    productId: string,
    variationId: string,
  ): Promise<ProductVariationDto | null> {
    const rows = await sql<ProductVariationDbRow[]>`
      SELECT
        id, product_id, name, variation_type, colors_hex,
        sample_image_path, finish_details, sort_order, in_stock,
        created_at, updated_at
      FROM product_variations
      WHERE id = ${variationId}::uuid
        AND product_id = ${productId}::uuid
        AND deleted_at IS NULL
      LIMIT 1
    `;
    return rows.length > 0 ? mapProductVariationRow(rows[0]!) : null;
  }

  // Insere a foto no fim do carrossel. O `FOR UPDATE` no produto serializa
  // uploads simultâneos do mesmo produto (dois envios não recebem o mesmo
  // `sort_order`) e fecha a corrida em que o produto é desativado durante o upload.
  async insertImage(input: InsertProductImageInput): Promise<ProductImageDto> {
    return await sql.begin(async (tx) => {
      const lockedRows = await tx<{ id: string }[]>`
        SELECT id FROM products
        WHERE id = ${input.productId}::uuid AND deleted_at IS NULL
        FOR UPDATE
      `;
      if (lockedRows.length === 0) {
        throw new NotFoundError("Produto não encontrado.");
      }

      // Com o produto travado, um PUT concorrente já terminou: revalida a variação.
      if (input.variationId !== null) {
        const variationRows = await tx<{ id: string }[]>`
          SELECT id FROM product_variations
          WHERE id = ${input.variationId}::uuid
            AND product_id = ${input.productId}::uuid
            AND deleted_at IS NULL
        `;
        if (variationRows.length === 0) {
          throw new BadRequestError(VARIATION_NOT_IN_PRODUCT_MESSAGE);
        }
      }

      const rows = await tx<ProductImageDbRow[]>`
        INSERT INTO product_images (
          id, product_id, variation_id, thumbnail_path, full_image_path, sort_order
        )
        VALUES (
          ${input.id}::uuid,
          ${input.productId}::uuid,
          ${input.variationId}::uuid,
          ${input.thumbnailPath},
          ${input.fullImagePath},
          (
            SELECT COALESCE(MAX(sort_order), -1) + 1
            FROM product_images
            WHERE product_id = ${input.productId}::uuid AND deleted_at IS NULL
          )
        )
        RETURNING
          id, product_id, variation_id, thumbnail_path,
          full_image_path, sort_order, created_at
      `;

      return mapProductImageRow(rows[0]!);
    });
  }

  // Soft delete restrito ao produto informado; `false` se a foto não é dele ou já foi excluída.
  async softDeleteImage(productId: string, imageId: string): Promise<boolean> {
    const rows = await sql<{ id: string }[]>`
      UPDATE product_images
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ${imageId}::uuid
        AND product_id = ${productId}::uuid
        AND deleted_at IS NULL
      RETURNING id
    `;
    return rows.length > 0;
  }

  // Grava (caminho novo) ou limpa (`null`) a amostra da variação ativa do produto.
  async updateVariationSample(
    productId: string,
    variationId: string,
    samplePath: string | null,
  ): Promise<ProductVariationDto | null> {
    const rows = await sql<ProductVariationDbRow[]>`
      UPDATE product_variations
      SET sample_image_path = ${samplePath}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${variationId}::uuid
        AND product_id = ${productId}::uuid
        AND deleted_at IS NULL
      RETURNING
        id, product_id, name, variation_type, colors_hex,
        sample_image_path, finish_details, sort_order, in_stock,
        created_at, updated_at
    `;
    return rows.length > 0 ? mapProductVariationRow(rows[0]!) : null;
  }
}

export const productImagesRepository = new ProductImagesRepository();
export default productImagesRepository;
