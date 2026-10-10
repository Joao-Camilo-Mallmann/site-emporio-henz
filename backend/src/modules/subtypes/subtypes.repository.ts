import { sql } from "@/config/database";
import { escapeLike } from "@/lib/pagination";
import {
  CreateSubtypeDto,
  PaginatedSubtypesResult,
  SubtypeDbRow,
  SubtypeDto,
  SubtypeQueryFilters,
  UpdateSubtypeDto,
} from "./subtypes.types";

function mapSubtype(row: SubtypeDbRow): SubtypeDto {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name ?? undefined,
    name: row.name,
    slug: row.slug,
    active: row.active,
    createdAt: row.created_at?.toISOString(),
    updatedAt: row.updated_at?.toISOString(),
  };
}

export class SubtypesRepository {
  /**
   * `visibleOnly` restringe à visão pública: subtipo ativo cuja categoria também
   * está ativa e não deletada.
   */
  async listPaginated(
    filters: SubtypeQueryFilters = {},
    visibleOnly = false,
  ): Promise<PaginatedSubtypesResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    const search = filters.search ? escapeLike(filters.search) : null;
    const categoryId = filters.categoryId || null;
    const active = filters.active !== undefined ? filters.active : null;

    const [countRows, rows] = await Promise.all([
      sql<{ count: string }[]>`
        SELECT COUNT(*)::text as count
        FROM product_subtypes s
        LEFT JOIN categories c ON c.id = s.category_id AND c.deleted_at IS NULL
        WHERE s.deleted_at IS NULL
          AND (${categoryId}::uuid IS NULL OR s.category_id = ${categoryId}::uuid)
          AND (${active}::boolean IS NULL OR s.active = ${active})
          AND (${search}::text IS NULL OR s.name ILIKE ('%' || ${search} || '%'))
          AND (NOT ${visibleOnly}::boolean OR (s.active = TRUE AND c.active = TRUE))
      `,
      sql<SubtypeDbRow[]>`
        SELECT
          s.id,
          s.category_id,
          c.name as category_name,
          s.name,
          s.slug,
          s.active,
          s.created_at,
          s.updated_at
        FROM product_subtypes s
        LEFT JOIN categories c ON c.id = s.category_id AND c.deleted_at IS NULL
        WHERE s.deleted_at IS NULL
          AND (${categoryId}::uuid IS NULL OR s.category_id = ${categoryId}::uuid)
          AND (${active}::boolean IS NULL OR s.active = ${active})
          AND (${search}::text IS NULL OR s.name ILIKE ('%' || ${search} || '%'))
          AND (NOT ${visibleOnly}::boolean OR (s.active = TRUE AND c.active = TRUE))
        ORDER BY s.name ASC
        LIMIT ${limit} OFFSET ${offset}
      `,
    ]);

    const total = parseInt(countRows[0]?.count || "0", 10);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data: rows.map(mapSubtype),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findById(id: string, visibleOnly = false): Promise<SubtypeDto | null> {
    const rows = await sql<SubtypeDbRow[]>`
      SELECT
        s.id,
        s.category_id,
        c.name as category_name,
        s.name,
        s.slug,
        s.active,
        s.created_at,
        s.updated_at
      FROM product_subtypes s
      LEFT JOIN categories c ON c.id = s.category_id AND c.deleted_at IS NULL
      WHERE s.id = ${id} AND s.deleted_at IS NULL
        AND (NOT ${visibleOnly}::boolean OR (s.active = TRUE AND c.active = TRUE))
      LIMIT 1
    `;

    return rows.length > 0 ? mapSubtype(rows[0]!) : null;
  }

  async existsSlugActive(slug: string, excludeId?: string): Promise<boolean> {
    const exclude = excludeId ?? null;
    const rows = await sql<{ id: string }[]>`
      SELECT id FROM product_subtypes
      WHERE slug = ${slug}
        AND deleted_at IS NULL
        AND (${exclude}::uuid IS NULL OR id != ${exclude}::uuid)
      LIMIT 1
    `;
    return rows.length > 0;
  }

  /**
   * Insere somente se a categoria ainda existir (não deletada). O `FOR SHARE`
   * faz a escrita esperar um soft delete concorrente da categoria; retorna
   * `null` quando ela não está mais disponível.
   */
  async create(
    data: CreateSubtypeDto & { slug: string },
  ): Promise<SubtypeDto | null> {
    const rows = await sql<SubtypeDbRow[]>`
      INSERT INTO product_subtypes (category_id, name, slug, active)
      SELECT c.id, ${data.name}::varchar, ${data.slug}::varchar, ${data.active ?? true}::boolean
      FROM categories c
      WHERE c.id = ${data.categoryId}::uuid AND c.deleted_at IS NULL
      FOR SHARE
      RETURNING id, category_id, name, slug, active, created_at, updated_at
    `;

    return rows.length > 0 ? mapSubtype(rows[0]!) : null;
  }

  /**
   * Retorna `null` se o subtipo não existir ou se a nova categoria informada
   * tiver sido deletada.
   */
  async update(
    id: string,
    data: UpdateSubtypeDto,
  ): Promise<SubtypeDto | null> {
    const categoryId = data.categoryId ?? null;
    const rows = await sql<SubtypeDbRow[]>`
      UPDATE product_subtypes
      SET
        category_id = COALESCE(${categoryId}::uuid, category_id),
        name = COALESCE(${data.name ?? null}, name),
        slug = COALESCE(${data.slug ?? null}, slug),
        active = COALESCE(${data.active ?? null}, active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND deleted_at IS NULL
        AND (
          ${categoryId}::uuid IS NULL
          OR EXISTS (
            SELECT 1 FROM categories c
            WHERE c.id = ${categoryId}::uuid AND c.deleted_at IS NULL
            FOR SHARE
          )
        )
      RETURNING id, category_id, name, slug, active, created_at, updated_at
    `;

    return rows.length > 0 ? mapSubtype(rows[0]!) : null;
  }

  async softDelete(id: string): Promise<boolean> {
    const rows = await sql<{ id: string }[]>`
      UPDATE product_subtypes
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id
    `;

    return rows.length > 0;
  }
}

export const subtypesRepository = new SubtypesRepository();
export default subtypesRepository;
