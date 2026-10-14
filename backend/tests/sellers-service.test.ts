import { describe, expect, it } from "bun:test";
import { UsersService } from "@/modules/users/users.service";
import { UsersRepository } from "@/modules/users/users.repository";
import {
  PaginatedUsersResult,
  UserDto,
  UserQueryFilters,
} from "@/modules/users/users.types";

class MockUsersRepositoryForSellers extends UsersRepository {
  public users: Map<
    string,
    UserDto & { passwordHash?: string; deleted: boolean }
  > = new Map();

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
}

describe("UsersService - listSellers", () => {
  it("deve retornar apenas usuários ativos com role = 2 (Vendedor)", async () => {
    const mockRepo = new MockUsersRepositoryForSellers();
    const service = new UsersService(mockRepo);

    mockRepo.users.set("u1", {
      id: "u1",
      email: "cliente@teste.com",
      role: 1,
      fullName: "Cliente Um",
      phone: null,
      city: "Estrela",
      deleted: false,
    });
    mockRepo.users.set("u2", {
      id: "u2",
      email: "vendedor1@teste.com",
      role: 2,
      fullName: "Vendedor Um",
      phone: "5199999999",
      city: "Lajeado",
      deleted: false,
    });
    mockRepo.users.set("u3", {
      id: "u3",
      email: "admin@teste.com",
      role: 3,
      fullName: "Admin Um",
      phone: null,
      city: "Cruzeiro do Sul",
      deleted: false,
    });

    const result = await service.listSellers();
    expect(result.pagination.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe("u2");
    expect(result.data[0].role).toBe(2);
    expect(result.data[0].fullName).toBe("Vendedor Um");
  });

  it("deve omitir vendedores que possuem soft delete (deleted_at IS NOT NULL)", async () => {
    const mockRepo = new MockUsersRepositoryForSellers();
    const service = new UsersService(mockRepo);

    mockRepo.users.set("u1", {
      id: "u1",
      email: "vendedor_ativo@teste.com",
      role: 2,
      fullName: "Vendedor Ativo",
      phone: null,
      city: "Lajeado",
      deleted: false,
    });
    mockRepo.users.set("u2", {
      id: "u2",
      email: "vendedor_deletado@teste.com",
      role: 2,
      fullName: "Vendedor Deletado",
      phone: null,
      city: "Lajeado",
      deleted: true,
    });

    const result = await service.listSellers();
    expect(result.pagination.total).toBe(1);
    expect(result.data[0].id).toBe("u1");
  });

  it("deve retornar lista vazia e total 0 quando não houver vendedores ativos", async () => {
    const mockRepo = new MockUsersRepositoryForSellers();
    const service = new UsersService(mockRepo);

    mockRepo.users.set("u1", {
      id: "u1",
      email: "cliente@teste.com",
      role: 1,
      fullName: "Cliente",
      phone: null,
      city: null,
      deleted: false,
    });

    const result = await service.listSellers();
    expect(result.data).toEqual([]);
    expect(result.pagination.total).toBe(0);
  });

  it("deve aplicar parâmetros de paginação corretamente", async () => {
    const mockRepo = new MockUsersRepositoryForSellers();
    const service = new UsersService(mockRepo);

    for (let i = 1; i <= 5; i++) {
      mockRepo.users.set(`seller-${i}`, {
        id: `seller-${i}`,
        email: `seller${i}@teste.com`,
        role: 2,
        fullName: `Vendedor ${i}`,
        phone: null,
        city: null,
        deleted: false,
      });
    }

    const page1 = await service.listSellers({ page: 1, limit: 2 });
    expect(page1.pagination.page).toBe(1);
    expect(page1.pagination.limit).toBe(2);
    expect(page1.pagination.total).toBe(5);
    expect(page1.pagination.totalPages).toBe(3);
    expect(page1.data).toHaveLength(2);
    expect(page1.data[0].id).toBe("seller-1");

    const page2 = await service.listSellers({ page: 2, limit: 2 });
    expect(page2.pagination.page).toBe(2);
    expect(page2.data).toHaveLength(2);
    expect(page2.data[0].id).toBe("seller-3");
  });
});
