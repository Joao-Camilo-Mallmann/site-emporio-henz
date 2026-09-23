import { sql } from "@/config/database";
import {
  AssignedSupplierDto,
  UserSupplierLinkDto,
} from "@/modules/user-suppliers/user-suppliers.types";

interface LinkDbRow {
  id: string;
  user_id: string;
  supplier_id: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export class UserSuppliersRepository {
  async listByUserId(userId: string): Promise<AssignedSupplierDto[]> {
    const rows = await sql<
      {
        id: string;
        name: string;
        contact: string | null;
        active: boolean;
        linked_at: Date;
      }[]
    >`
      SELECT 
        s.id,
        s.name,
        s.contact,
        s.active,
        us.created_at as linked_at
      FROM user_suppliers us
      INNER JOIN suppliers s ON s.id = us.supplier_id AND s.deleted_at IS NULL
      WHERE us.user_id = ${userId} AND us.deleted_at IS NULL
      ORDER BY s.name ASC
    `;

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      contact: r.contact,
      active: r.active,
      linkedAt: r.linked_at.toISOString(),
    }));
  }

  async findExistingLink(
    userId: string,
    supplierId: string,
  ): Promise<LinkDbRow | null> {
    const rows = await sql<LinkDbRow[]>`
      SELECT id, user_id, supplier_id, created_at, updated_at, deleted_at
      FROM user_suppliers
      WHERE user_id = ${userId} AND supplier_id = ${supplierId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return rows.length > 0 ? rows[0] : null;
  }

  async createLink(
    userId: string,
    supplierId: string,
  ): Promise<UserSupplierLinkDto> {
    const rows = await sql<LinkDbRow[]>`
      INSERT INTO user_suppliers (user_id, supplier_id)
      VALUES (${userId}, ${supplierId})
      RETURNING id, user_id, supplier_id, created_at, updated_at, deleted_at
    `;

    const r = rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      supplierId: r.supplier_id,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at?.toISOString(),
    };
  }

  async reactivateLink(id: string): Promise<UserSupplierLinkDto> {
    const rows = await sql<LinkDbRow[]>`
      UPDATE user_suppliers
      SET deleted_at = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, user_id, supplier_id, created_at, updated_at, deleted_at
    `;

    const r = rows[0];
    return {
      id: r.id,
      userId: r.user_id,
      supplierId: r.supplier_id,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at?.toISOString(),
    };
  }

  async revokeLink(userId: string, supplierId: string): Promise<boolean> {
    const rows = await sql<{ id: string }[]>`
      UPDATE user_suppliers
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId} AND supplier_id = ${supplierId} AND deleted_at IS NULL
      RETURNING id
    `;

    return rows.length > 0;
  }
}

export const userSuppliersRepository = new UserSuppliersRepository();
export default userSuppliersRepository;
