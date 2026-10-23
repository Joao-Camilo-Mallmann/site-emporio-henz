import { AuthRepository, UserAuthRecord } from "@/modules/auth/auth.repository";
import { AuthUserProfile, UpdateProfileDto } from "@/modules/auth/auth.types";

export class MockAuthRepository extends AuthRepository {
  public users: UserAuthRecord[] = [];
  public clients: { userId: string; fullName: string; phone: string | null }[] = [];

  async findByEmail(email: string): Promise<UserAuthRecord | null> {
    const user = this.users.find(
      (u) => u.email === email && u.deleted_at === null,
    );
    if (!user) {
      return null;
    }
    const client = this.clients.find((c) => c.userId === user.id);
    return {
      ...user,
      full_name: client?.fullName || "",
      phone: client?.phone || null,
    };
  }

  async findById(id: string): Promise<AuthUserProfile | null> {
    const user = this.users.find((u) => u.id === id);
    if (!user || user.deleted_at !== null) {
      return null;
    }
    const client = this.clients.find((c) => c.userId === id);
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: client?.fullName || "",
      phone: client?.phone || null,
      city: user.city,
    };
  }

  async isEmailActive(email: string): Promise<boolean> {
    return this.users.some(
      (u) => u.email === email && u.deleted_at === null,
    );
  }

  async createCustomer(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    phone?: string;
    city?: string;
  }): Promise<AuthUserProfile> {
    const id = `user-${Date.now()}`;
    const userRecord: UserAuthRecord = {
      id,
      email: data.email,
      password_hash: data.passwordHash,
      role: 1,
      city: data.city || null,
      full_name: data.fullName,
      phone: data.phone || null,
      deleted_at: null,
    };

    this.users.push(userRecord);
    this.clients.push({ userId: id, fullName: data.fullName, phone: data.phone || null });

    return {
      id,
      email: data.email,
      role: 1,
      fullName: data.fullName,
      phone: data.phone || null,
      city: data.city || null,
    };
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileDto,
    passwordHash?: string,
  ): Promise<AuthUserProfile | null> {
    const user = this.users.find((u) => u.id === userId);
    if (!user || user.deleted_at !== null) {
      return null;
    }

    if (passwordHash) {
      user.password_hash = passwordHash;
    }
    if (data.city !== undefined) {
      user.city = data.city ?? null;
    }

    let client = this.clients.find((c) => c.userId === userId);
    if (client) {
      client.fullName = data.fullName;
      if (data.phone !== undefined) {
        client.phone = data.phone ?? null;
      }
    } else {
      client = {
        userId,
        fullName: data.fullName,
        phone: data.phone ?? null,
      };
      this.clients.push(client);
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: client.fullName,
      phone: client.phone,
      city: user.city,
    };
  }
}
