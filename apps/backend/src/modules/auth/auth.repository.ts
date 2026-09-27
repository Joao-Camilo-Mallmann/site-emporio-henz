import { sql } from "@/config/database";
import { AuthUserProfile, UpdateProfileDto } from "@/modules/auth/auth.types";

export interface UserAuthRecord {
  id: string;
  email: string;
  password_hash: string;
  role: number;
  city: string | null;
  full_name: string | null;
  phone: string | null;
  deleted_at: Date | null;
}

export class AuthRepository {
  async findByEmail(email: string): Promise<UserAuthRecord | null> {
    const rows = await sql<UserAuthRecord[]>`
      SELECT 
        u.id,
        u.email,
        u.password_hash,
        u.role,
        u.city,
        u.deleted_at,
        c.full_name,
        c.phone
      FROM users u
      LEFT JOIN clients c ON c.user_id = u.id AND c.deleted_at IS NULL
      WHERE u.email = ${email} AND u.deleted_at IS NULL
      LIMIT 1
    `;

    return rows.length > 0 ? rows[0] : null;
  }

  async findById(id: string): Promise<AuthUserProfile | null> {
    const rows = await sql<
      {
        id: string;
        email: string;
        role: number;
        city: string | null;
        full_name: string | null;
        phone: string | null;
      }[]
    >`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.city,
        c.full_name,
        c.phone
      FROM users u
      LEFT JOIN clients c ON c.user_id = u.id AND c.deleted_at IS NULL
      WHERE u.id = ${id} AND u.deleted_at IS NULL
      LIMIT 1
    `;

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      email: row.email,
      role: row.role,
      fullName: row.full_name || "",
      phone: row.phone,
      city: row.city,
    };
  }

  async isEmailActive(email: string): Promise<boolean> {
    const rows = await sql<{ exists: boolean }[]>`
      SELECT EXISTS(
        SELECT 1 FROM users 
        WHERE email = ${email} AND deleted_at IS NULL
      ) as exists
    `;
    return Boolean(rows[0]?.exists);
  }

  async createCustomer(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
    city?: string;
  }): Promise<AuthUserProfile> {
    return await sql.begin(async (tx) => {
      const users = await tx<
        { id: string; email: string; role: number; city: string | null }[]
      >`
        INSERT INTO users (email, password_hash, role, city)
        VALUES (${data.email}, ${data.passwordHash}, 1, ${data.city ?? null})
        RETURNING id, email, role, city
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
      };
    });
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileDto,
    passwordHash?: string,
  ): Promise<AuthUserProfile | null> {
    return await sql.begin(async (tx) => {
      const users = await tx<
        { id: string; email: string; role: number; city: string | null }[]
      >`
        UPDATE users
        SET 
          city = CASE WHEN ${data.city !== undefined} THEN ${data.city ?? null} ELSE city END,
          password_hash = COALESCE(${passwordHash ?? null}, password_hash),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId} AND deleted_at IS NULL
        RETURNING id, email, role, city
      `;

      if (users.length === 0) {
        return null;
      }

      const user = users[0];

      let clientFullName = data.fullName;
      let clientPhone: string | null = data.phone ?? null;

      const existingClients = await tx<
        { id: string; full_name: string; phone: string | null }[]
      >`
        SELECT id, full_name, phone FROM clients 
        WHERE user_id = ${userId} AND deleted_at IS NULL 
        LIMIT 1
      `;

      if (existingClients.length > 0) {
        const updatedClients = await tx<
          { full_name: string; phone: string | null }[]
        >`
          UPDATE clients
          SET 
            full_name = ${data.fullName},
            phone = CASE WHEN ${data.phone !== undefined} THEN ${data.phone ?? null} ELSE phone END,
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId} AND deleted_at IS NULL
          RETURNING full_name, phone
        `;
        clientFullName = updatedClients[0].full_name;
        clientPhone = updatedClients[0].phone;
      } else {
        const insertedClients = await tx<
          { full_name: string; phone: string | null }[]
        >`
          INSERT INTO clients (user_id, full_name, phone)
          VALUES (${userId}, ${data.fullName}, ${data.phone ?? null})
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
      };
    });
  }
}

export const authRepository = new AuthRepository();
export default authRepository;
