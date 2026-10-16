import { sql } from "@/config/database";
import { BadRequestError } from "@/lib/errors";
import { escapeLike, paginate, resolvePagination } from "@/lib/pagination";
import { toUploadUrl } from "@/lib/uploads";
import {
  CreateProductDto,
  PaginatedProductsResult,
  ProductDbRow,
  ProductDetailDto,
  ProductDto,
  ProductImageDbRow,
  ProductImageDto,
  ProductQueryFilters,
  ProductVariationDbRow,
  ProductVariationDto,
  ProductVariationInputDto,
  UpdateProductDto,
} from "@/modules/products/products.types";

export class ProductsRepository {
  async listPaginated(
    filters: ProductQueryFilters = {},
  ): Promise<PaginatedProductsResult> {
    const { page, limit, offset } = resolvePagination(filters);

    if (filters.supplierIds && filters.supplierIds.length === 0) {
      return paginate([], 0, { page, limit });
    }

    const search = filters.search ? escapeLike(filters.search) : null;
    const categoryId = filters.categoryId ?? null;
    const subtypeId = filters.subtypeId ?? null;
    const supplierId = filters.supplierId ?? null;
    const availabilityType = filters.availabilityType ?? null;
    const active = filters.active !== undefined ? filters.active : null;
    const supplierIdsCsv =
      filters.supplierIds && filters.supplierIds.length > 0
        ? filters.supplierIds.join(",")
        : null;

    const [countRows, rows] = await Promise.all([
      sql<{ count: string }[]>`
        SELECT COUNT(*)::text as count
        FROM products p
        WHERE p.deleted_at IS NULL
          AND (${categoryId}::uuid IS NULL OR p.category_id = ${categoryId}::uuid)
          AND (${subtypeId}::uuid IS NULL OR p.subtype_id = ${subtypeId}::uuid)
          AND (${supplierId}::uuid IS NULL OR p.supplier_id = ${supplierId}::uuid)
          AND (${supplierIdsCsv}::text IS NULL OR p.supplier_id = ANY(string_to_array(${supplierIdsCsv}, ',')::uuid[]))
          AND (${availabilityType}::varchar IS NULL OR p.availability_type = ${availabilityType})
          AND (${active}::boolean IS NULL OR p.active = ${active})
          AND (
            ${search}::text IS NULL
            OR p.name ILIKE ('%' || ${search} || '%')
            OR COALESCE(p.description, '') ILIKE ('%' || ${search} || '%')
            OR COALESCE(p.collection_line, '') ILIKE ('%' || ${search} || '%')
          )
      `,
      sql<ProductDbRow[]>`
        SELECT
          p.id, p.category_id, p.subtype_id, p.supplier_id, p.name, p.slug,
          p.collection_line, p.main_material, p.reference_price, p.max_installments,
          p.availability_type, p.estimated_days, p.height_mm, p.width_mm, p.depth_mm,
          p.description, p.specifications, p.active, p.created_at, p.updated_at
        FROM products p
        WHERE p.deleted_at IS NULL
          AND (${categoryId}::uuid IS NULL OR p.category_id = ${categoryId}::uuid)
          AND (${subtypeId}::uuid IS NULL OR p.subtype_id = ${subtypeId}::uuid)
          AND (${supplierId}::uuid IS NULL OR p.supplier_id = ${supplierId}::uuid)
          AND (${supplierIdsCsv}::text IS NULL OR p.supplier_id = ANY(string_to_array(${supplierIdsCsv}, ',')::uuid[]))
          AND (${availabilityType}::varchar IS NULL OR p.availability_type = ${availabilityType})
          AND (${active}::boolean IS NULL OR p.active = ${active})
          AND (
            ${search}::text IS NULL
            OR p.name ILIKE ('%' || ${search} || '%')
            OR COALESCE(p.description, '') ILIKE ('%' || ${search} || '%')
            OR COALESCE(p.collection_line, '') ILIKE ('%' || ${search} || '%')
          )
        ORDER BY p.created_at DESC, p.name ASC
        LIMIT ${limit} OFFSET ${offset}
      `,
    ]);

    const total = parseInt(countRows[0]?.count || "0", 10);
    const data = rows.map((r) => this.mapRow(r));

    return paginate(data, total, { page, limit });
  }

  async findById(id: string): Promise<ProductDto | null> {
    const rows = await sql<ProductDbRow[]>`
      SELECT 
        id, category_id, subtype_id, supplier_id, name, slug,
        collection_line, main_material, reference_price, max_installments,
        availability_type, estimated_days, height_mm, width_mm, depth_mm,
        description, specifications, active, created_at, updated_at
      FROM products
      WHERE id = ${id} AND deleted_at IS NULL
      LIMIT 1
    `;

    if (rows.length === 0) {
      return null;
    }

    return this.mapRow(rows[0]!);
  }

  async findDetailById(id: string): Promise<ProductDetailDto | null> {
    const product = await this.findById(id);
    if (!product) {
      return null;
    }

    const [variationRows, imageRows] = await Promise.all([
      sql<ProductVariationDbRow[]>`
        SELECT
          id, product_id, name, variation_type, colors_hex,
          sample_image_path, finish_details, sort_order, in_stock,
          created_at, updated_at
        FROM product_variations
        WHERE product_id = ${id} AND deleted_at IS NULL
        ORDER BY sort_order ASC, created_at ASC
      `,
      sql<ProductImageDbRow[]>`
        SELECT
          id, product_id, variation_id, thumbnail_path,
          full_image_path, sort_order, created_at
        FROM product_images
        WHERE product_id = ${id} AND deleted_at IS NULL
        ORDER BY sort_order ASC, created_at ASC
      `,
    ]);

    return {
      ...product,
      variations: variationRows.map((v) => this.mapVariationRow(v)),
      images: imageRows.map((img) => this.mapImageRow(img)),
    };
  }

  async findRecommendations(
    productId: string,
    categoryId: string,
    limit = 4,
  ): Promise<ProductDto[]> {
    const rows = await sql<ProductDbRow[]>`
      SELECT 
        id, category_id, subtype_id, supplier_id, name, slug,
        collection_line, main_material, reference_price, max_installments,
        availability_type, estimated_days, height_mm, width_mm, depth_mm,
        description, specifications, active, created_at, updated_at
      FROM products
      WHERE category_id = ${categoryId}
        AND id != ${productId}
        AND active = TRUE
        AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return rows.map((r) => this.mapRow(r));
  }

  async existsProductSlugActive(
    slug: string,
    excludeId?: string,
  ): Promise<boolean> {
    const exclude = excludeId ?? null;
    const rows = await sql<{ id: string }[]>`
      SELECT id FROM products
      WHERE slug = ${slug}
        AND deleted_at IS NULL
        AND (${exclude}::uuid IS NULL OR id != ${exclude}::uuid)
      LIMIT 1
    `;
    return rows.length > 0;
  }

  async findActiveSupplierIdsByUserId(userId: string): Promise<string[]> {
    const rows = await sql<{ supplier_id: string }[]>`
      SELECT us.supplier_id
      FROM user_suppliers us
      INNER JOIN suppliers s ON s.id = us.supplier_id AND s.deleted_at IS NULL
      WHERE us.user_id = ${userId} AND us.deleted_at IS NULL
    `;
    return rows.map((r) => r.supplier_id);
  }

  async existsActiveCategory(categoryId: string): Promise<boolean> {
    const rows = await sql<{ id: string }[]>`
      SELECT id FROM categories
      WHERE id = ${categoryId} AND deleted_at IS NULL
      LIMIT 1
    `;
    return rows.length > 0;
  }

  async findActiveSubtypeCategoryId(subtypeId: string): Promise<string | null> {
    const rows = await sql<{ category_id: string }[]>`
      SELECT category_id FROM product_subtypes
      WHERE id = ${subtypeId} AND deleted_at IS NULL
      LIMIT 1
    `;
    return rows.length > 0 ? rows[0]!.category_id : null;
  }

  async existsActiveSupplier(supplierId: string): Promise<boolean> {
    const rows = await sql<{ id: string }[]>`
      SELECT id FROM suppliers
      WHERE id = ${supplierId} AND deleted_at IS NULL
      LIMIT 1
    `;
    return rows.length > 0;
  }

  async createProduct(
    data: CreateProductDto & { slug: string },
  ): Promise<ProductDetailDto> {
    return await sql.begin(async (tx) => {
      const specificationsJson = JSON.stringify(data.specifications ?? {});
      const subtypeId = data.subtypeId ?? null;

      const productRows = await tx<ProductDbRow[]>`
        INSERT INTO products (
          category_id, subtype_id, supplier_id, name, slug,
          collection_line, main_material, reference_price, max_installments,
          availability_type, estimated_days, height_mm, width_mm, depth_mm,
          description, specifications, active
        )
        VALUES (
          ${data.categoryId}::uuid,
          ${subtypeId}::uuid,
          ${data.supplierId}::uuid,
          ${data.name},
          ${data.slug},
          ${data.collectionLine ?? null},
          ${data.mainMaterial ?? null},
          ${data.referencePrice},
          ${data.maxInstallments ?? 1},
          ${data.availabilityType},
          ${data.estimatedDays ?? 0},
          ${data.heightMm},
          ${data.widthMm},
          ${data.depthMm},
          ${data.description ?? null},
          ${specificationsJson}::jsonb,
          ${data.active ?? true}
        )
        RETURNING
          id, category_id, subtype_id, supplier_id, name, slug,
          collection_line, main_material, reference_price, max_installments,
          availability_type, estimated_days, height_mm, width_mm, depth_mm,
          description, specifications, active, created_at, updated_at
      `;

      const product = this.mapRow(productRows[0]!);
      const variations: ProductVariationDto[] = [];

      if (data.variations && data.variations.length > 0) {
        for (let i = 0; i < data.variations.length; i++) {
          const v = data.variations[i]!;
          const inserted = await this.insertVariation(tx, product.id, v, i);
          variations.push(inserted);
        }
      }

      variations.sort((a, b) => a.sortOrder - b.sortOrder);

      return {
        ...product,
        variations,
        images: [],
      };
    });
  }

  async updateProduct(
    id: string,
    data: UpdateProductDto,
  ): Promise<ProductDetailDto | null> {
    return await sql.begin(async (tx) => {
      const hasSubtypeId = data.subtypeId !== undefined;
      const hasCollectionLine = data.collectionLine !== undefined;
      const hasMainMaterial = data.mainMaterial !== undefined;
      const hasDescription = data.description !== undefined;
      const hasSpecifications = data.specifications !== undefined;
      const specificationsJson = hasSpecifications
        ? JSON.stringify(data.specifications ?? {})
        : null;

      const productRows = await tx<ProductDbRow[]>`
        UPDATE products
        SET
          category_id = COALESCE(${data.categoryId ?? null}::uuid, category_id),
          subtype_id = CASE WHEN ${hasSubtypeId}::boolean THEN ${data.subtypeId ?? null}::uuid ELSE subtype_id END,
          supplier_id = COALESCE(${data.supplierId ?? null}::uuid, supplier_id),
          name = COALESCE(${data.name ?? null}, name),
          slug = COALESCE(${data.slug ?? null}, slug),
          collection_line = CASE WHEN ${hasCollectionLine}::boolean THEN ${data.collectionLine ?? null} ELSE collection_line END,
          main_material = CASE WHEN ${hasMainMaterial}::boolean THEN ${data.mainMaterial ?? null} ELSE main_material END,
          reference_price = COALESCE(${data.referencePrice ?? null}, reference_price),
          max_installments = COALESCE(${data.maxInstallments ?? null}, max_installments),
          availability_type = COALESCE(${data.availabilityType ?? null}, availability_type),
          estimated_days = COALESCE(${data.estimatedDays ?? null}, estimated_days),
          height_mm = COALESCE(${data.heightMm ?? null}, height_mm),
          width_mm = COALESCE(${data.widthMm ?? null}, width_mm),
          depth_mm = COALESCE(${data.depthMm ?? null}, depth_mm),
          description = CASE WHEN ${hasDescription}::boolean THEN ${data.description ?? null} ELSE description END,
          specifications = CASE WHEN ${hasSpecifications}::boolean THEN ${specificationsJson}::jsonb ELSE specifications END,
          active = COALESCE(${data.active ?? null}, active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING
          id, category_id, subtype_id, supplier_id, name, slug,
          collection_line, main_material, reference_price, max_installments,
          availability_type, estimated_days, height_mm, width_mm, depth_mm,
          description, specifications, active, created_at, updated_at
      `;

      if (productRows.length === 0) {
        return null;
      }

      const product = this.mapRow(productRows[0]!);

      if (data.variations !== undefined) {
        await this.syncVariations(tx, id, data.variations);
      }

      const [variationRows, imageRows] = await Promise.all([
        tx<ProductVariationDbRow[]>`
          SELECT
            id, product_id, name, variation_type, colors_hex,
            sample_image_path, finish_details, sort_order, in_stock,
            created_at, updated_at
          FROM product_variations
          WHERE product_id = ${id} AND deleted_at IS NULL
          ORDER BY sort_order ASC, created_at ASC
        `,
        tx<ProductImageDbRow[]>`
          SELECT
            id, product_id, variation_id, thumbnail_path,
            full_image_path, sort_order, created_at
          FROM product_images
          WHERE product_id = ${id} AND deleted_at IS NULL
          ORDER BY sort_order ASC, created_at ASC
        `,
      ]);

      return {
        ...product,
        variations: variationRows.map((v) => this.mapVariationRow(v)),
        images: imageRows.map((img) => this.mapImageRow(img)),
      };
    });
  }

  async softDeleteProductWithCascade(id: string): Promise<boolean> {
    return await sql.begin(async (tx) => {
      const prodRows = await tx<{ id: string }[]>`
        UPDATE products
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING id
      `;

      if (prodRows.length === 0) {
        return false;
      }

      await tx`
        UPDATE product_variations
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ${id} AND deleted_at IS NULL
      `;

      await tx`
        UPDATE product_images
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE product_id = ${id} AND deleted_at IS NULL
      `;

      return true;
    });
  }

  private async insertVariation(
    tx: typeof sql,
    productId: string,
    v: ProductVariationInputDto,
    defaultSortOrder: number,
  ): Promise<ProductVariationDto> {
    const colorsCsv =
      v.colorsHex && v.colorsHex.length > 0 ? v.colorsHex.join(",") : null;
    const finishDetailsJson = JSON.stringify(v.finishDetails ?? {});
    const rows = await tx<ProductVariationDbRow[]>`
      INSERT INTO product_variations (
        product_id, name, variation_type, colors_hex,
        finish_details, sort_order, in_stock
      )
      VALUES (
        ${productId}::uuid,
        ${v.name},
        ${v.variationType ?? "FINISH"},
        CASE
          WHEN ${colorsCsv}::text IS NULL THEN '{}'::varchar(7)[]
          ELSE string_to_array(${colorsCsv}, ',')::varchar(7)[]
        END,
        ${finishDetailsJson}::jsonb,
        ${v.sortOrder ?? defaultSortOrder},
        ${v.inStock ?? true}
      )
      RETURNING
        id, product_id, name, variation_type, colors_hex,
        sample_image_path, finish_details, sort_order, in_stock,
        created_at, updated_at
    `;
    return this.mapVariationRow(rows[0]!);
  }

  private async syncVariations(
    tx: typeof sql,
    productId: string,
    incoming: ProductVariationInputDto[],
  ): Promise<void> {
    const existingRows = await tx<{ id: string }[]>`
      SELECT id FROM product_variations
      WHERE product_id = ${productId} AND deleted_at IS NULL
    `;
    const existingIds = new Set(existingRows.map((r) => r.id));

    const keptIds = new Set<string>();
    for (const item of incoming) {
      if (item.id) {
        if (!existingIds.has(item.id)) {
          throw new BadRequestError(
            `A variação '${item.id}' não pertence a este produto ou foi removida.`,
          );
        }
        keptIds.add(item.id);
      }
    }

    for (const existingId of existingIds) {
      if (!keptIds.has(existingId)) {
        await tx`
          UPDATE product_variations
          SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
          WHERE id = ${existingId} AND product_id = ${productId} AND deleted_at IS NULL
        `;
      }
    }

    for (let i = 0; i < incoming.length; i++) {
      const v = incoming[i]!;
      if (v.id) {
        const colorsCsv =
          v.colorsHex && v.colorsHex.length > 0 ? v.colorsHex.join(",") : null;
        const finishDetailsJson = JSON.stringify(v.finishDetails ?? {});
        // A amostra (sample_image_path) só muda pelo upload do arquivo.
        await tx`
          UPDATE product_variations
          SET
            name = ${v.name},
            variation_type = ${v.variationType ?? "FINISH"},
            colors_hex = CASE
              WHEN ${colorsCsv}::text IS NULL THEN '{}'::varchar(7)[]
              ELSE string_to_array(${colorsCsv}, ',')::varchar(7)[]
            END,
            finish_details = ${finishDetailsJson}::jsonb,
            sort_order = ${v.sortOrder ?? i},
            in_stock = ${v.inStock ?? true},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${v.id} AND product_id = ${productId} AND deleted_at IS NULL
        `;
      } else {
        await this.insertVariation(tx, productId, v, i);
      }
    }
  }

  protected mapRow(r: ProductDbRow): ProductDto {
    return {
      id: r.id,
      categoryId: r.category_id,
      subtypeId: r.subtype_id,
      supplierId: r.supplier_id,
      name: r.name,
      slug: r.slug,
      collectionLine: r.collection_line,
      mainMaterial: r.main_material,
      referencePrice: Number(r.reference_price),
      maxInstallments: r.max_installments,
      availabilityType: r.availability_type,
      estimatedDays: r.estimated_days,
      heightMm: r.height_mm,
      widthMm: r.width_mm,
      depthMm: r.depth_mm,
      description: r.description,
      specifications: r.specifications ?? {},
      active: r.active,
      createdAt:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : String(r.created_at),
      updatedAt:
        r.updated_at instanceof Date
          ? r.updated_at.toISOString()
          : String(r.updated_at),
    };
  }

  protected mapVariationRow(r: ProductVariationDbRow): ProductVariationDto {
    return {
      id: r.id,
      productId: r.product_id,
      name: r.name,
      variationType: r.variation_type,
      colorsHex: Array.isArray(r.colors_hex) ? r.colors_hex : [],
      sampleImageUrl: r.sample_image_path
        ? toUploadUrl(r.sample_image_path)
        : null,
      finishDetails: r.finish_details ?? {},
      sortOrder: r.sort_order,
      inStock: r.in_stock,
      createdAt:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : String(r.created_at),
      updatedAt:
        r.updated_at instanceof Date
          ? r.updated_at.toISOString()
          : String(r.updated_at),
    };
  }

  protected mapImageRow(r: ProductImageDbRow): ProductImageDto {
    return {
      id: r.id,
      productId: r.product_id,
      variationId: r.variation_id,
      thumbnailUrl: toUploadUrl(r.thumbnail_path),
      fullImageUrl: toUploadUrl(r.full_image_path),
      sortOrder: r.sort_order,
      createdAt:
        r.created_at instanceof Date
          ? r.created_at.toISOString()
          : String(r.created_at),
    };
  }
}

export const productsRepository = new ProductsRepository();
export default productsRepository;
