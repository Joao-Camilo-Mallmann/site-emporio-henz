import { sql } from "@/config/database";
import {
  AddListItemDto,
  ListDto,
  ListItemDto,
  ListType,
  SharedListRef,
  SYSTEM_LISTS,
} from "@/modules/lists/lists.types";

interface ListDbRow {
  id: string;
  name: string;
  list_type: ListType;
  is_system: boolean;
  share_slug: string;
  is_public: boolean;
  items_count: string;
  created_at: Date;
  updated_at: Date;
}

interface ListItemDbRow {
  id: string;
  product_id: string;
  product_slug: string | null;
  variation_id: string | null;
  product_name: string;
  product_price: string;
  product_image: string;
  finish_label: string | null;
  finish_color: string | null;
  added_at: Date;
}

function mapList(r: ListDbRow): ListDto {
  return {
    id: r.id,
    name: r.name,
    listType: r.list_type,
    isSystem: r.is_system,
    shareSlug: r.share_slug,
    isPublic: r.is_public,
    itemsCount: parseInt(r.items_count, 10),
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}

function mapItem(r: ListItemDbRow): ListItemDto {
  return {
    id: r.id,
    productId: r.product_id,
    productSlug: r.product_slug,
    variationId: r.variation_id,
    name: r.product_name,
    price: Number(r.product_price),
    image: r.product_image,
    finishLabel: r.finish_label,
    finishColor: r.finish_color,
    addedAt: r.added_at.toISOString(),
  };
}

export class ListsRepository {
  async findClientIdByUserId(userId: string): Promise<string | null> {
    const rows = await sql<{ id: string }[]>`
      SELECT id
      FROM clients
      WHERE user_id = ${userId} AND deleted_at IS NULL
      LIMIT 1
    `;

    return rows.length > 0 ? rows[0].id : null;
  }

  // Garante as 3 listas padrão do cliente. Pode ser chamado quantas vezes quiser.
  async ensureSystemLists(clientId: string): Promise<void> {
    const countRows = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text AS count
      FROM lists
      WHERE client_id = ${clientId} AND is_system AND deleted_at IS NULL
    `;

    if (parseInt(countRows[0]?.count || "0", 10) >= SYSTEM_LISTS.length) {
      return;
    }

    await sql.begin(async (tx) => {
      for (const def of SYSTEM_LISTS) {
        await tx`
          INSERT INTO lists (client_id, name, list_type, is_system)
          VALUES (${clientId}, ${def.name}, ${def.listType}, TRUE)
          ON CONFLICT (client_id, list_type) WHERE is_system AND deleted_at IS NULL
          DO NOTHING
        `;
      }
    });
  }

  async listByClient(clientId: string): Promise<ListDto[]> {
    const rows = await sql<ListDbRow[]>`
      SELECT
        l.id, l.name, l.list_type, l.is_system, l.share_slug, l.is_public,
        l.created_at, l.updated_at,
        (
          SELECT COUNT(*)
          FROM list_items li
          WHERE li.list_id = l.id AND li.deleted_at IS NULL
        )::text AS items_count
      FROM lists l
      WHERE l.client_id = ${clientId} AND l.deleted_at IS NULL
      ORDER BY
        l.is_system DESC,
        CASE l.list_type
          WHEN 'FAVORITES' THEN 1
          WHEN 'WISHLIST' THEN 2
          WHEN 'GIFT_LIST' THEN 3
          ELSE 4
        END,
        l.created_at ASC
    `;

    return rows.map(mapList);
  }

  async findOwnedById(clientId: string, listId: string): Promise<ListDto | null> {
    const rows = await sql<ListDbRow[]>`
      SELECT
        l.id, l.name, l.list_type, l.is_system, l.share_slug, l.is_public,
        l.created_at, l.updated_at,
        (
          SELECT COUNT(*)
          FROM list_items li
          WHERE li.list_id = l.id AND li.deleted_at IS NULL
        )::text AS items_count
      FROM lists l
      WHERE l.id = ${listId}
        AND l.client_id = ${clientId}
        AND l.deleted_at IS NULL
      LIMIT 1
    `;

    return rows.length > 0 ? mapList(rows[0]) : null;
  }

  async createCustom(clientId: string, name: string): Promise<ListDto> {
    const rows = await sql<Omit<ListDbRow, "items_count">[]>`
      INSERT INTO lists (client_id, name, list_type, is_system)
      VALUES (${clientId}, ${name}, 'CUSTOM', FALSE)
      RETURNING id, name, list_type, is_system, share_slug, is_public,
                created_at, updated_at
    `;

    return mapList({ ...rows[0], items_count: "0" });
  }

  async rename(listId: string, name: string): Promise<boolean> {
    const rows = await sql<{ id: string }[]>`
      UPDATE lists
      SET name = ${name}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${listId} AND deleted_at IS NULL
      RETURNING id
    `;

    return rows.length > 0;
  }

  // Soft delete da lista e de todos os itens dela, na mesma transação
  async softDelete(listId: string): Promise<void> {
    await sql.begin(async (tx) => {
      await tx`
        UPDATE list_items
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE list_id = ${listId} AND deleted_at IS NULL
      `;
      await tx`
        UPDATE lists
        SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${listId} AND deleted_at IS NULL
      `;
    });
  }

  async listItems(listId: string): Promise<ListItemDto[]> {
    const rows = await sql<ListItemDbRow[]>`
      SELECT
        id, product_id, product_slug, variation_id, product_name,
        product_price, product_image, finish_label, finish_color, added_at
      FROM list_items
      WHERE list_id = ${listId} AND deleted_at IS NULL
      ORDER BY added_at DESC, id ASC
    `;

    return rows.map(mapItem);
  }

  // Itens de todas as listas ativas do cliente, em uma única consulta
  async listItemsByClient(
    clientId: string,
  ): Promise<{ listId: string; item: ListItemDto }[]> {
    const rows = await sql<(ListItemDbRow & { list_id: string })[]>`
      SELECT
        li.list_id, li.id, li.product_id, li.product_slug, li.variation_id,
        li.product_name, li.product_price, li.product_image, li.finish_label,
        li.finish_color, li.added_at
      FROM list_items li
      JOIN lists l ON l.id = li.list_id
      WHERE l.client_id = ${clientId}
        AND l.deleted_at IS NULL
        AND li.deleted_at IS NULL
      ORDER BY li.added_at DESC, li.id ASC
    `;

    return rows.map((r) => ({ listId: r.list_id, item: mapItem(r) }));
  }

  async findExistingItem(
    listId: string,
    dto: AddListItemDto,
  ): Promise<ListItemDto | null> {
    const rows = await sql<ListItemDbRow[]>`
      SELECT
        id, product_id, product_slug, variation_id, product_name,
        product_price, product_image, finish_label, finish_color, added_at
      FROM list_items
      WHERE list_id = ${listId}
        AND product_id = ${dto.productId}
        AND COALESCE(finish_label, '') = ${dto.finishLabel ?? ""}
        AND COALESCE(finish_color, '') = ${dto.finishColor ?? ""}
        AND deleted_at IS NULL
      LIMIT 1
    `;

    return rows.length > 0 ? mapItem(rows[0]) : null;
  }

  async addItem(listId: string, dto: AddListItemDto): Promise<ListItemDto> {
    const rows = await sql<ListItemDbRow[]>`
      INSERT INTO list_items (
        list_id, product_id, variation_id, product_slug, product_name,
        product_price, product_image, finish_label, finish_color
      )
      VALUES (
        ${listId}, ${dto.productId}, ${dto.variationId ?? null},
        ${dto.productSlug ?? null}, ${dto.name}, ${dto.price}, ${dto.image},
        ${dto.finishLabel ?? null}, ${dto.finishColor ?? null}
      )
      RETURNING
        id, product_id, product_slug, variation_id, product_name,
        product_price, product_image, finish_label, finish_color, added_at
    `;

    return mapItem(rows[0]);
  }

  async softDeleteItem(listId: string, itemId: string): Promise<boolean> {
    const rows = await sql<{ id: string }[]>`
      UPDATE list_items
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ${itemId} AND list_id = ${listId} AND deleted_at IS NULL
      RETURNING id
    `;

    return rows.length > 0;
  }

  // Só devolve listas públicas e não deletadas; nunca expõe o dono
  async findSharedBySlug(shareSlug: string): Promise<SharedListRef | null> {
    const rows = await sql<{ id: string; name: string; list_type: ListType }[]>`
      SELECT id, name, list_type
      FROM lists
      WHERE share_slug = ${shareSlug}
        AND is_public = TRUE
        AND deleted_at IS NULL
      LIMIT 1
    `;

    if (rows.length === 0) return null;
    return { id: rows[0].id, name: rows[0].name, listType: rows[0].list_type };
  }
}

export const listsRepository = new ListsRepository();
export default listsRepository;
