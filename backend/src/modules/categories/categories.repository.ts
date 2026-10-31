import { sql } from "@/config/database";
import { escapeLike, paginate, resolvePagination } from "@/lib/pagination";
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
   * Lista paginada de categorias, cada uma com seus subtipos montados em memória.
   * Com `active = true` (visão pública) só entram subtipos ativos.
   */
  async listPaginated(
    filters: CategoryQueryFilters = {},
  ): Promise<PaginatedCategoriesResult> {
    const { page, limit, offset } = resolvePagination(filters);
    const search = filters.search ? escapeLike(filters.search) : null;
    const active = filters.active !== undefined ? filters.active : null;
    const activeSubtypesOnly = filters.active === true;

    const [countRows, rows, subtypeRows] = await Promise.all([
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
      sql<SubtypeDbRow[]>`
        SELECT id, category_id, name, slug, active, created_at, updated_at
        FROM product_subtypes
        WHERE deleted_at IS NULL
          AND (NOT ${activeSubtypesOnly}::boolean OR active = TRUE)
        ORDER BY name ASC
      `,
    ]);

    const subtypesByCategoryId = new Map<string, SubtypeDto[]>();
    for (const sub of subtypeRows) {
      const list = subtypesByCategoryId.get(sub.category_id) ?? [];
      list.push(mapSubtype(sub));
      subtypesByCategoryId.set(sub.category_id, list);
    }

    const total = parseInt(countRows[0]?.count || "0", 10);
    const data = rows.map((cat: CategoryDbRow) => ({
      ...mapCategory(cat),
      subtypes: subtypesByCategoryId.get(cat.id) ?? [],
    }));

    return paginate(data, total, { page, limit });
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

  /**
   * Produtos excluídos logicamente não prendem a categoria.
   */
  async countLinkedProducts(categoryId: string): Promise<number> {
    const rows = await sql<{ count: number }[]>`
      SELECT COUNT(*)::int AS count
      FROM products
      WHERE category_id = ${categoryId} AND deleted_at IS NULL
    `;
    return rows[0]?.count ?? 0;
  }

  /**
   * Chamado depois que o service validou que não há produtos vinculados.
   * Retorna `false` se a categoria sumiu ou se um produto foi vinculado
   * entre a validação e esta transação; nesse caso nada é alterado.
   */
  async softDeleteCategoryWithCascade(id: string): Promise<boolean> {
    return await sql.begin(async (tx) => {
      // 1. `FOR UPDATE` conflita com o `FOR KEY SHARE` da chave estrangeira
      // de um INSERT de produto em andamento (um UPDATE comum não conflita)
      // e com o `FOR SHARE` da criação de subtipos: ambos esperam aqui.
      const catRows = await tx<{ id: string }[]>`
        SELECT id FROM categories
        WHERE id = ${id} AND deleted_at IS NULL
        FOR UPDATE
      `;

      if (catRows.length === 0) return false;

      // 2. Marca a categoria, repetindo a checagem de produtos já com a linha
      // bloqueada, e depois os subtipos vinculados.
      const deletedRows = await tx<{ id: string }[]>`
        UPDATE categories
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
          AND NOT EXISTS (
            SELECT 1 FROM products
            WHERE category_id = ${id} AND deleted_at IS NULL
          )
        RETURNING id
      `;

      if (deletedRows.length === 0) return false;

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
