import { sql } from "@/config/database";
import {
  CreateSupplierDto,
  SupplierDto,
  UpdateSupplierDto,
} from "@/modules/suppliers/suppliers.types";

interface SupplierDbRow {
  id: string;
  name: string;
  contact: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export class SuppliersRepository {
  async list(): Promise<SupplierDto[]> {
    const rows = await sql<SupplierDbRow[]>`
      SELECT id, name, contact, active, created_at, updated_at
      FROM suppliers
      WHERE deleted_at IS NULL
      ORDER BY name ASC
    `;

    return rows.map((r: SupplierDbRow) => ({
      id: r.id,
      name: r.name,
      contact: r.contact,
      active: r.active,
      createdAt: r.created_at?.toISOString(),
      updatedAt: r.updated_at?.toISOString(),
    }));
  }

  async findById(id: string): Promise<SupplierDto | null> {
    const rows = await sql<SupplierDbRow[]>`
      SELECT id, name, contact, active, created_at, updated_at
      FROM suppliers
      WHERE id = ${id} AND deleted_at IS NULL
      LIMIT 1
    `;

    if (rows.length === 0) {
      return null;
    }

    const r: SupplierDbRow = rows[0];
    return {
      id: r.id,
      name: r.name,
      contact: r.contact,
      active: r.active,
      createdAt: r.created_at?.toISOString(),
      updatedAt: r.updated_at?.toISOString(),
    };
  }

  async create(data: CreateSupplierDto): Promise<SupplierDto> {
    const rows = await sql<SupplierDbRow[]>`
      INSERT INTO suppliers (name, contact, active)
      VALUES (${data.name}, ${data.contact ?? null}, ${data.active ?? true})
      RETURNING id, name, contact, active, created_at, updated_at
    `;

    const r: SupplierDbRow = rows[0];
    return {
      id: r.id,
      name: r.name,
      contact: r.contact,
      active: r.active,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    };
  }

  async update(
    id: string,
    data: UpdateSupplierDto,
  ): Promise<SupplierDto | null> {
    const rows = await sql<SupplierDbRow[]>`
      UPDATE suppliers
      SET
        name = COALESCE(${data.name ?? null}, name),
        contact = CASE WHEN ${data.contact !== undefined} THEN ${data.contact ?? null} ELSE contact END,
        active = COALESCE(${data.active ?? null}, active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id, name, contact, active, created_at, updated_at
    `;

    if (rows.length === 0) {
      return null;
    }

    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      contact: r.contact,
      active: r.active,
      createdAt: r.created_at.toISOString(),
      updatedAt: r.updated_at.toISOString(),
    };
  }

  async softDelete(id: string): Promise<boolean> {
    const rows = await sql<{ id: string }[]>`
      UPDATE suppliers
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING id
    `;

    return rows.length > 0;
  }
}

export const suppliersRepository = new SuppliersRepository();
export default suppliersRepository;
