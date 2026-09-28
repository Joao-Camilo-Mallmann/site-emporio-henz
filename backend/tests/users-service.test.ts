import { describe, expect, it } from "bun:test";
import { UsersService } from "@/modules/users/users.service";
import { UsersRepository } from "@/modules/users/users.repository";
import {
  CreateUserDto,
  PaginatedUsersResult,
  UpdateUserDto,
  UserDto,
  UserQueryFilters,
} from "@/modules/users/users.types";
import { ConflictError, NotFoundError } from "@/lib/errors";
import {
  validateCreateUser,
  validateUpdateUser,
  validateUserQuery,
} from "@/modules/users/users.schema";

class MockUsersRepository extends UsersRepository {
  public users: Map<string, UserDto & { passwordHash: string; deleted: boolean }> =
    new Map();

  async list(filters: UserQueryFilters): Promise<PaginatedUsersResult> {
    let items = Array.from(this.users.values()).filter((u) => !u.deleted);

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
    const user = this.users.get(id);
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
    for (const u of this.users.values()) {
      if (u.email === email && !u.deleted && u.id !== excludeUserId) {
        return true;
      }
    }
    return false;
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

    this.users.set(id, user);

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
    const user = this.users.get(id);
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
    const user = this.users.get(id);
    if (!user || user.deleted) {
      return false;
    }
    user.deleted = true;
    return true;
  }
}

describe("Módulo de Usuários (UsersService)", () => {
  it("deve criar um novo usuário com papel designado (ADMIN, SELLER, CUSTOMER)", async () => {
    const mockRepo = new MockUsersRepository();
    const service = new UsersService(mockRepo);

    const user = await service.create({
      fullName: "Vendedor Teste",
      email: "vendedor@emporio.com.br",
      password: "senhaSegura123",
      role: 2, // SELLER
      city: "Estrela",
    });

    expect(user.id).toBeDefined();
    expect(user.role).toBe(2);
    expect(user.fullName).toBe("Vendedor Teste");
  });

  it("deve rejeitar criação com e-mail duplicado", async () => {
    const mockRepo = new MockUsersRepository();
    const service = new UsersService(mockRepo);

    await service.create({
      fullName: "Primeiro",
      email: "repetido@teste.com",
      password: "senhaSegura123",
      role: 1,
    });

    await expect(
      service.create({
        fullName: "Segundo",
        email: "repetido@teste.com",
        password: "senhaSegura123",
        role: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("deve listar usuários com paginação e busca por termo", async () => {
    const mockRepo = new MockUsersRepository();
    const service = new UsersService(mockRepo);

    await service.create({
      fullName: "Alberto Roberto",
      email: "alberto@teste.com",
      password: "senhaSegura123",
      role: 2,
    });

    await service.create({
      fullName: "Bruna Biancardi",
      email: "bruna@teste.com",
      password: "senhaSegura123",
      role: 1,
    });

    const listAll = await service.list({});
    expect(listAll.pagination.total).toBe(2);

    const searchAlberto = await service.list({ search: "alberto" });
    expect(searchAlberto.pagination.total).toBe(1);
    expect(searchAlberto.data[0].fullName).toBe("Alberto Roberto");

    const filterRole2 = await service.list({ role: 2 });
    expect(filterRole2.pagination.total).toBe(1);
    expect(filterRole2.data[0].role).toBe(2);
  });

  it("deve atualizar os dados de um usuário existente", async () => {
    const mockRepo = new MockUsersRepository();
    const service = new UsersService(mockRepo);

    const created = await service.create({
      fullName: "Nome Antigo",
      email: "antigo@teste.com",
      password: "senhaAntiga123",
      role: 1,
    });

    const updated = await service.update(created.id, {
      fullName: "Nome Novo",
      role: 2,
    });

    expect(updated.fullName).toBe("Nome Novo");
    expect(updated.role).toBe(2);
  });

  it("deve realizar soft delete do usuário e impedir retorno na busca posterior", async () => {
    const mockRepo = new MockUsersRepository();
    const service = new UsersService(mockRepo);

    const user = await service.create({
      fullName: "Para Deletar",
      email: "deletar@teste.com",
      password: "senhaSegura123",
      role: 1,
    });

    await service.delete(user.id);

    await expect(service.getById(user.id)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("Validação de Schemas do Módulo de Usuários", () => {
  it("deve validar payload de criação de usuário", () => {
    const valid = validateCreateUser({
      fullName: "Admin Chefe",
      email: "chefe@admin.com",
      password: "senhaForte123",
      role: 3,
    });

    expect(valid.error).toBeUndefined();
    expect(valid.value?.role).toBe(3);
  });

  it("deve validar payload de atualização de usuário", () => {
    const valid = validateUpdateUser({
      fullName: "Nome Alterado",
      city: "Lajeado",
    });
    expect(valid.error).toBeUndefined();
    expect(valid.value?.fullName).toBe("Nome Alterado");

    const empty = validateUpdateUser({});
    expect(empty.error).toBeDefined();
  });

  it("deve rejeitar role inválido (ex: role 4)", () => {
    const invalid = validateCreateUser({
      fullName: "Admin Chefe",
      email: "chefe@admin.com",
      password: "senhaForte123",
      role: 4,
    });

    expect(invalid.error).toBeDefined();
  });

  it("deve validar parâmetros de paginação e filtros", () => {
    const url = new URL("http://localhost/api/v1/users?page=2&limit=10&search=maria&role=1");
    const filters = validateUserQuery(url);

    expect(filters.page).toBe(2);
    expect(filters.limit).toBe(10);
    expect(filters.search).toBe("maria");
    expect(filters.role).toBe(1);
  });
});
