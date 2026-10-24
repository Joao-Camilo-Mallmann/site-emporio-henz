import { UsersRepository } from "@/modules/users/users.repository";
import {
  CreateUserDto,
  PaginatedUsersResult,
  UpdateUserDto,
  UserDto,
  UserQueryFilters,
} from "@/modules/users/users.types";

export class MockUsersRepository extends UsersRepository {
  public users: (UserDto & { passwordHash: string; deleted: boolean })[] = [];

  async list(filters: UserQueryFilters): Promise<PaginatedUsersResult> {
    let items = this.users.filter((u) => !u.deleted);

    if (filters.role) {
      items = items.filter((u) => u.role === filters.role);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q),
      );
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const data = items.slice((page - 1) * limit, page * limit).map((u) => ({
      id: u.id,
      email: u.email,
      role: u.role,
      fullName: u.fullName,
      phone: u.phone,
      city: u.city,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
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
    const user = this.users.find((u) => u.id === id);
    if (!user || user.deleted) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      city: user.city,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async isEmailActive(email: string, excludeUserId?: string): Promise<boolean> {
    return this.users.some(
      (u) => u.email === email && !u.deleted && u.id !== excludeUserId,
    );
  }

  async create(data: CreateUserDto, passwordHash: string): Promise<UserDto> {
    const id = `user-${Date.now()}-${Math.random()}`;
    const user = {
      id,
      email: data.email,
      passwordHash,
      role: data.role,
      fullName: data.fullName,
      phone: data.phone || null,
      city: data.city || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
    };

    this.users.push(user);

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      city: user.city,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async update(
    id: string,
    data: UpdateUserDto,
    passwordHash?: string,
  ): Promise<UserDto | null> {
    const user = this.users.find((u) => u.id === id);
    if (!user || user.deleted) {
      return null;
    }

    if (data.fullName !== undefined) user.fullName = data.fullName;
    if (data.phone !== undefined) user.phone = data.phone;
    if (data.city !== undefined) user.city = data.city;
    if (data.role !== undefined) user.role = data.role;
    if (passwordHash) user.passwordHash = passwordHash;
    user.updatedAt = new Date().toISOString();

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
      phone: user.phone,
      city: user.city,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async softDelete(id: string): Promise<boolean> {
    const user = this.users.find((u) => u.id === id);
    if (!user || user.deleted) {
      return false;
    }
    user.deleted = true;
    return true;
  }
}
