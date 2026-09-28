import { sql } from "@/config/database";
import { ProductDto } from "@/modules/products/products.types";

export interface ProductDbRow {
  id: string;
  category_id: string;
  subtype_id: string | null;
  supplier_id: string | null;
  name: string;
  slug: string;
  collection_line: string | null;
  main_material: string | null;
  reference_price: string | number;
  max_installments: number;
  availability_type: string;
  estimated_days: number;
  height_mm: number | null;
  width_mm: number | null;
  depth_mm: number | null;
  description: string | null;
  specifications: Record<string, unknown> | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class ProductsRepository {
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

    return this.mapRow(rows[0]);
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
}

export const productsRepository = new ProductsRepository();
export default productsRepository;
