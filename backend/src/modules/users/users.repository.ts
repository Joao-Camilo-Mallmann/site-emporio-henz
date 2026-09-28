import { sql } from "@/config/database";
import {
  CreateUserDto,
  PaginatedUsersResult,
  UpdateUserDto,
  UserDto,
  UserQueryFilters,
} from "@/modules/users/users.types";

interface UserDbRow {
  id: string;
  email: string;
  role: number;
  city: string | null;
  full_name: string | null;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
}

export class UsersRepository {
  async list(filters: UserQueryFilters): Promise<PaginatedUsersResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    const search = filters.search || null;
    const role = filters.role || null;

    const countRows = await sql<{ count: string }[]>`
      SELECT COUNT(*)::text as count
      FROM users u
      LEFT JOIN clients c ON c.user_id = u.id AND c.deleted_at IS NULL
      WHERE u.deleted_at IS NULL
        AND (${role}::smallint IS NULL OR u.role = ${role})
        AND (${search}::text IS NULL OR (
          c.full_name ILIKE ('%' || ${search} || '%') OR 
          u.email ILIKE ('%' || ${search} || '%')
        ))
    `;

    const total = parseInt(countRows[0]?.count || "0", 10);
    const totalPages = Math.ceil(total / limit) || 1;

    const rows = await sql<UserDbRow[]>`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.city,
        c.full_name,
        c.phone,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN clients c ON c.user_id = u.id AND c.deleted_at IS NULL
      WHERE u.deleted_at IS NULL
        AND (${role}::smallint IS NULL OR u.role = ${role})
        AND (${search}::text IS NULL OR (
          c.full_name ILIKE ('%' || ${search} || '%') OR 
          u.email ILIKE ('%' || ${search} || '%')
        ))
      ORDER BY u.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const data: UserDto[] = rows.map((r) => ({
      id: r.id,
      email: r.email,
      role: r.role,
      fullName: r.full_name || "",
      phone: r.phone,
      city: r.city,
      createdAt: r.created_at?.toISOString(),
      updatedAt: r.updated_at?.toISOString(),
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findById(id: string): Promise<UserDto | null> {
    const rows = await sql<UserDbRow[]>`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.city,
        c.full_name,
        c.phone,
        u.created_at,
        u.updated_at
      FROM users u
      LEFT JOIN clients c ON c.user_id = u.id AND c.deleted_at IS NULL
      WHERE u.id = ${id} AND u.deleted_at IS NULL
      LIMIT 1
    `;

    if (rows.length === 0) {
      return null;
    }

    const r = rows[0];
    return {
      id: r.id,
      email: r.email,
      role: r.role,
      fullName: r.full_name || "",
      phone: r.phone,
      city: r.city,
      createdAt: r.created_at?.toISOString(),
      updatedAt: r.updated_at?.toISOString(),
    };
  }

  async isEmailActive(email: string, excludeUserId?: string): Promise<boolean> {
    const rows = await sql<{ exists: boolean }[]>`
      SELECT EXISTS(
        SELECT 1 FROM users 
        WHERE email = ${email} 
          AND deleted_at IS NULL 
          AND (${excludeUserId ?? null}::uuid IS NULL OR id != ${excludeUserId})
      ) as exists
    `;
    return Boolean(rows[0]?.exists);
  }

  async create(data: CreateUserDto, passwordHash: string): Promise<UserDto> {
    return await sql.begin(async (tx) => {
      const users = await tx<
        {
          id: string;
          email: string;
          role: number;
          city: string | null;
          created_at: Date;
          updated_at: Date;
        }[]
      >`
        INSERT INTO users (email, password_hash, role, city)
        VALUES (${data.email}, ${passwordHash}, ${data.role}, ${data.city ?? null})
        RETURNING id, email, role, city, created_at, updated_at
      `;

      const user = users[0];

      const clients = await tx<{ full_name: string; phone: string | null }[]>`
        INSERT INTO clients (user_id, full_name, phone)
        VALUES (${user.id}, ${data.fullName}, ${data.phone ?? null})
        RETURNING full_name, phone
      `;

      const client = clients[0];

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: client.full_name,
        phone: client.phone,
        city: user.city,
        createdAt: user.created_at.toISOString(),
        updatedAt: user.updated_at.toISOString(),
      };
    });
  }

  async update(
    id: string,
    data: UpdateUserDto,
    passwordHash?: string,
  ): Promise<UserDto | null> {
    return await sql.begin(async (tx) => {
      // 1. Atualiza users se role, city ou passwordHash mudaram
      const users = await tx<
        {
          id: string;
          email: string;
          role: number;
          city: string | null;
          created_at: Date;
          updated_at: Date;
        }[]
      >`
        UPDATE users
        SET 
          role = COALESCE(${data.role ?? null}, role),
          city = CASE WHEN ${data.city !== undefined} THEN ${data.city ?? null} ELSE city END,
          password_hash = COALESCE(${passwordHash ?? null}, password_hash),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING id, email, role, city, created_at, updated_at
      `;

      if (users.length === 0) {
        return null;
      }

      const user = users[0];

      // 2. Atualiza ou insere na tabela clients se fullName ou phone foram passados
      let clientFullName = "";
      let clientPhone: string | null = null;

      const existingClients = await tx<
        { id: string; full_name: string; phone: string | null }[]
      >`
        SELECT id, full_name, phone FROM clients 
        WHERE user_id = ${id} AND deleted_at IS NULL 
        LIMIT 1
      `;

      if (existingClients.length > 0) {
        const updatedClients = await tx<
          { full_name: string; phone: string | null }[]
        >`
          UPDATE clients
          SET 
            full_name = COALESCE(${data.fullName ?? null}, full_name),
            phone = CASE WHEN ${data.phone !== undefined} THEN ${data.phone ?? null} ELSE phone END,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${id} AND deleted_at IS NULL
          RETURNING full_name, phone
        `;
        clientFullName = updatedClients[0].full_name;
        clientPhone = updatedClients[0].phone;
      } else if (data.fullName) {
        const insertedClients = await tx<
          { full_name: string; phone: string | null }[]
        >`
          INSERT INTO clients (user_id, full_name, phone)
          VALUES (${id}, ${data.fullName}, ${data.phone ?? null})
          RETURNING full_name, phone
        `;
        clientFullName = insertedClients[0].full_name;
        clientPhone = insertedClients[0].phone;
      }

      return {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: clientFullName,
        phone: clientPhone,
        city: user.city,
        createdAt: user.created_at.toISOString(),
        updatedAt: user.updated_at.toISOString(),
      };
    });
  }

  async softDelete(id: string): Promise<boolean> {
    return await sql.begin(async (tx) => {
      const result = await tx<{ id: string }[]>`
        UPDATE users
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND deleted_at IS NULL
        RETURNING id
      `;

      if (result.length === 0) {
        return false;
      }

      await tx`
        UPDATE clients
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE user_id = ${id} AND deleted_at IS NULL
      `;

      await tx`
        UPDATE user_suppliers
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE user_id = ${id} AND deleted_at IS NULL
      `;

      return true;
    });
  }
}

export const usersRepository = new UsersRepository();
export default usersRepository;
