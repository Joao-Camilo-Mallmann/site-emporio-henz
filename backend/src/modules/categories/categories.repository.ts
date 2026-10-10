import { sql } from "@/config/database";
import { escapeLike } from "@/lib/pagination";
import { SubtypeDbRow, SubtypeDto } from "@/modules/subtypes/subtypes.types";
import {
  CategoryDbRow,
  CategoryDto,
  CategoryQueryFilters,
  CreateCategoryDto,
  PaginatedCategoriesResult,
  UpdateCategoryDto,
} from "./categories.types";

function mapCategory(row: CategoryDbRow): CategoryDto {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    active: row.active,
    createdAt: row.created_at?.toISOString(),
    updatedAt: row.updated_at?.toISOString(),
  };
}

function mapSubtype(row: SubtypeDbRow): SubtypeDto {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    slug: row.slug,
    active: row.active,
    createdAt: row.created_at?.toISOString(),
    updatedAt: row.updated_at?.toISOString(),
  };
}

export class CategoriesRepository {
  /**
   * Busca todas as categorias ativas juntamente com seus subtipos ativos montados em memória.
   * Utilizado para a navegação pública rápida por ambientes no catálogo e header.
   */
  async listHierarchy(activeOnly = true): Promise<CategoryDto[]> {
    const [categoryRows, subtypeRows] = await Promise.all([
      sql<CategoryDbRow[]>`
        SELECT id, name, slug, active, created_at, updated_at
        FROM categories
        WHERE deleted_at IS NULL AND (NOT ${activeOnly}::boolean OR active = TRUE)
        ORDER BY name ASC
      `,
      sql<SubtypeDbRow[]>`
        SELECT id, category_id, name, slug, active, created_at, updated_at
        FROM product_subtypes
        WHERE deleted_at IS NULL AND (NOT ${activeOnly}::boolean OR active = TRUE)
        ORDER BY name ASC
      `,
    ]);

    const subtypesByCategoryId = new Map<string, SubtypeDto[]>();
    for (const sub of subtypeRows) {
      const list = subtypesByCategoryId.get(sub.category_id) ?? [];
      list.push(mapSubtype(sub));
      subtypesByCategoryId.set(sub.category_id, list);
    }

    return categoryRows.map((cat: CategoryDbRow) => ({
      ...mapCategory(cat),
      subtypes: subtypesByCategoryId.get(cat.id) ?? [],
    }));
  }

  async listPaginated(
    filters: CategoryQueryFilters = {},
  ): Promise<PaginatedCategoriesResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    const search = filters.search ? escapeLike(filters.search) : null;
    const active = filters.active !== undefined ? filters.active : null;

    const [countRows, rows] = await Promise.all([
      sql<{ count: string }[]>`
        SELECT COUNT(*)::text as count
        FROM categories c
        WHERE c.deleted_at IS NULL
          AND (${active}::boolean IS NULL OR c.active = ${active})
          AND (${search}::text IS NULL OR c.name ILIKE ('%' || ${search} || '%'))
      `,
      sql<CategoryDbRow[]>`
        SELECT id, name, slug, active, created_at, updated_at
        FROM categories c
        WHERE c.deleted_at IS NULL
          AND (${active}::boolean IS NULL OR c.active = ${active})
          AND (${search}::text IS NULL OR c.name ILIKE ('%' || ${search} || '%'))
        ORDER BY c.name ASC
        LIMIT ${limit} OFFSET ${offset}
      `,
    ]);

    const total = parseInt(countRows[0]?.count || "0", 10);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: rows.map(mapCategory),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findCategoryById(id: string): Promise<CategoryDto | null> {
    const rows = await sql<CategoryDbRow[]>`
      SELECT id, name, slug, active, created_at, updated_at
      FROM categories
      WHERE id = ${id} AND deleted_at IS NULL
      LIMIT 1
    `;

    return rows.length > 0 ? mapCategory(rows[0]!) : null;
  }

  async findCategoryBySlug(slug: string): Promise<CategoryDto | null> {
    const rows = await sql<CategoryDbRow[]>`
      SELECT id, name, slug, active, created_at, updated_at
      FROM categories
      WHERE slug = ${slug} AND deleted_at IS NULL
      LIMIT 1
    `;

    return rows.length > 0 ? mapCategory(rows[0]!) : null;
  }

  async existsCategorySlugActive(
    slug: string,
    excludeId?: string,
  ): Promise<boolean> {
    const exclude = excludeId ?? null;
    const rows = await sql<{ id: string }[]>`
      SELECT id FROM categories
      WHERE slug = ${slug}
        AND deleted_at IS NULL
        AND (${exclude}::uuid IS NULL OR id != ${exclude}::uuid)
      LIMIT 1
    `;
    return rows.length > 0;
  }

  async createCategory(
    data: CreateCategoryDto & { slug: string },
  ): Promise<CategoryDto> {
    const rows = await sql<CategoryDbRow[]>`
      INSERT INTO categories (name, slug, active)
      VALUES (${data.name}, ${data.slug}, ${data.active ?? true})
      RETURNING id, name, slug, active, created_at, updated_at
    `;

    return { ...mapCategory(rows[0]!), subtypes: [] };
  }

  async updateCategory(
    id: string,
    data: UpdateCategoryDto,
  ): Promise<CategoryDto | null> {
    const rows = await sql<CategoryDbRow[]>`
      UPDATE categories
      SET
        name = COALESCE(${data.name ?? null}, name),
        slug = COALESCE(${data.slug ?? null}, slug),
        active = COALESCE(${data.active ?? null}, active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id, name, slug, active, created_at, updated_at
    `;

    return rows.length > 0 ? mapCategory(rows[0]!) : null;
  }

  async softDeleteCategoryWithCascade(id: string): Promise<boolean> {
    return await sql.begin(async (tx) => {
      // 1. Marca a categoria primeiro: o bloqueio da linha faz a criação ou
      // movimentação concorrente de subtipos esperar e enxergar a exclusão.
      const catRows = await tx<{ id: string }[]>`
        UPDATE categories
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING id
      `;

      if (catRows.length === 0) return false;

      // 2. Marca subtipos vinculados como deletados logicamente
      await tx`
        UPDATE product_subtypes
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE category_id = ${id} AND deleted_at IS NULL
      `;

      return true;
    });
  }
}

export const categoriesRepository = new CategoriesRepository();
export default categoriesRepository;
