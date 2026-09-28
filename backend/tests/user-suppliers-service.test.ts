import { describe, expect, it } from "bun:test";
import { UserSuppliersService } from "@/modules/user-suppliers/user-suppliers.service";
import { UserSuppliersRepository } from "@/modules/user-suppliers/user-suppliers.repository";
import { UsersRepository } from "@/modules/users/users.repository";
import { SuppliersRepository } from "@/modules/suppliers/suppliers.repository";
import {
  AssignedSupplierDto,
  UserSupplierLinkDto,
} from "@/modules/user-suppliers/user-suppliers.types";
import { SupplierDto } from "@/modules/suppliers/suppliers.types";
import { UserDto } from "@/modules/users/users.types";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { validateAssignSupplier } from "@/modules/user-suppliers/user-suppliers.schema";

class MockUserSuppliersRepository extends UserSuppliersRepository {
  public links: Map<string, { id: string; userId: string; supplierId: string; deleted: boolean; createdAt: string }> =
    new Map();

  async listByUserId(userId: string): Promise<AssignedSupplierDto[]> {
    const assigned: AssignedSupplierDto[] = [];
    for (const link of this.links.values()) {
      if (link.userId === userId && !link.deleted) {
        assigned.push({
          id: link.supplierId,
          name: `Fornecedor ${link.supplierId}`,
          contact: "contato@teste.com",
          active: true,
          linkedAt: link.createdAt,
        });
      }
    }
    return assigned;
  }

  async findExistingLink(
    userId: string,
    supplierId: string,
  ): Promise<{ id: string; user_id: string; supplier_id: string; created_at: Date; updated_at: Date; deleted_at: Date | null } | null> {
    for (const link of this.links.values()) {
      if (link.userId === userId && link.supplierId === supplierId) {
        return {
          id: link.id,
          user_id: link.userId,
          supplier_id: link.supplierId,
          created_at: new Date(link.createdAt),
          updated_at: new Date(),
          deleted_at: link.deleted ? new Date() : null,
        };
      }
    }
    return null;
  }

  async createLink(
    userId: string,
    supplierId: string,
  ): Promise<UserSupplierLinkDto> {
    const id = `link-${Date.now()}-${Math.random()}`;
    const link = {
      id,
      userId,
      supplierId,
      deleted: false,
      createdAt: new Date().toISOString(),
    };
    this.links.set(id, link);
    return {
      id: link.id,
      userId: link.userId,
      supplierId: link.supplierId,
      createdAt: link.createdAt,
    };
  }

  async reactivateLink(id: string): Promise<UserSupplierLinkDto> {
    const link = this.links.get(id);
    if (!link) {
      throw new Error("Link not found");
    }
    link.deleted = false;
    return {
      id: link.id,
      userId: link.userId,
      supplierId: link.supplierId,
      createdAt: link.createdAt,
    };
  }

  async revokeLink(userId: string, supplierId: string): Promise<boolean> {
    for (const link of this.links.values()) {
      if (link.userId === userId && link.supplierId === supplierId && !link.deleted) {
        link.deleted = true;
        return true;
      }
    }
    return false;
  }
}

class MockUsersRepoForLinks extends UsersRepository {
  public users: Map<string, UserDto> = new Map();

  async findById(id: string): Promise<UserDto | null> {
    return this.users.get(id) || null;
  }
}

class MockSuppliersRepoForLinks extends SuppliersRepository {
  public suppliers: Map<string, SupplierDto> = new Map();

  async findById(id: string): Promise<SupplierDto | null> {
    return this.suppliers.get(id) || null;
  }
}

describe("Módulo de Vínculos Vendedor ↔ Fornecedor (UserSuppliersService)", () => {
  it("deve vincular um vendedor a um fornecedor e listá-lo", async () => {
    const mockLinks = new MockUserSuppliersRepository();
    const mockUsers = new MockUsersRepoForLinks();
    const mockSuppliers = new MockSuppliersRepoForLinks();

    const userId = "b46a7ce0-1234-4567-8901-abcdef123456";
    const supplierId = "c57b8df1-2345-6789-0123-bcdefa234567";

    mockUsers.users.set(userId, {
      id: userId,
      email: "vendedor@teste.com",
      role: 2,
      fullName: "Vendedor Um",
      phone: null,
      city: null,
    });

    mockSuppliers.suppliers.set(supplierId, {
      id: supplierId,
      name: "Fornecedor Alfa",
      contact: null,
      active: true,
    });

    const service = new UserSuppliersService(mockLinks, mockUsers, mockSuppliers);

    const link = await service.assignSupplier(userId, supplierId);
    expect(link.id).toBeDefined();
    expect(link.userId).toBe(userId);
    expect(link.supplierId).toBe(supplierId);

    const list = await service.listUserSuppliers(userId);
    expect(list.length).toBe(1);
    expect(list[0].id).toBe(supplierId);
  });

  it("deve impedir criação de vínculo duplicado ativo com ConflictError", async () => {
    const mockLinks = new MockUserSuppliersRepository();
    const mockUsers = new MockUsersRepoForLinks();
    const mockSuppliers = new MockSuppliersRepoForLinks();

    const userId = "b46a7ce0-1234-4567-8901-abcdef123456";
    const supplierId = "c57b8df1-2345-6789-0123-bcdefa234567";

    mockUsers.users.set(userId, {
      id: userId,
      email: "vendedor@teste.com",
      role: 2,
      fullName: "Vendedor Um",
      phone: null,
      city: null,
    });
    mockSuppliers.suppliers.set(supplierId, {
      id: supplierId,
      name: "Fornecedor Alfa",
      contact: null,
      active: true,
    });

    const service = new UserSuppliersService(mockLinks, mockUsers, mockSuppliers);

    await service.assignSupplier(userId, supplierId);

    await expect(
      service.assignSupplier(userId, supplierId),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("deve reativar um vínculo previamente revogado", async () => {
    const mockLinks = new MockUserSuppliersRepository();
    const mockUsers = new MockUsersRepoForLinks();
    const mockSuppliers = new MockSuppliersRepoForLinks();

    const userId = "b46a7ce0-1234-4567-8901-abcdef123456";
    const supplierId = "c57b8df1-2345-6789-0123-bcdefa234567";

    mockUsers.users.set(userId, {
      id: userId,
      email: "vendedor@teste.com",
      role: 2,
      fullName: "Vendedor",
      phone: null,
      city: null,
    });
    mockSuppliers.suppliers.set(supplierId, {
      id: supplierId,
      name: "Fornecedor",
      contact: null,
      active: true,
    });

    const service = new UserSuppliersService(mockLinks, mockUsers, mockSuppliers);

    await service.assignSupplier(userId, supplierId);
    await service.revokeSupplier(userId, supplierId);

    const emptyList = await service.listUserSuppliers(userId);
    expect(emptyList.length).toBe(0);

    // Reativação
    const reactivated = await service.assignSupplier(userId, supplierId);
    expect(reactivated).toBeDefined();

    const restoredList = await service.listUserSuppliers(userId);
    expect(restoredList.length).toBe(1);
  });

  it("deve falhar ao revogar vínculo inexistente com NotFoundError", async () => {
    const mockLinks = new MockUserSuppliersRepository();
    const mockUsers = new MockUsersRepoForLinks();
    const mockSuppliers = new MockSuppliersRepoForLinks();

    const userId = "b46a7ce0-1234-4567-8901-abcdef123456";
    const supplierId = "c57b8df1-2345-6789-0123-bcdefa234567";

    mockUsers.users.set(userId, {
      id: userId,
      email: "vendedor@teste.com",
      role: 2,
      fullName: "Vendedor",
      phone: null,
      city: null,
    });
    mockSuppliers.suppliers.set(supplierId, {
      id: supplierId,
      name: "Fornecedor",
      contact: null,
      active: true,
    });

    const service = new UserSuppliersService(mockLinks, mockUsers, mockSuppliers);

    await expect(
      service.revokeSupplier(userId, supplierId),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe("Validação de Schemas de Vínculos", () => {
  it("deve aceitar supplierId com UUID válido", () => {
    const valid = validateAssignSupplier({
      supplierId: "123e4567-e89b-12d3-a456-426614174000",
    });
    expect(valid.error).toBeUndefined();
    expect(valid.value?.supplierId).toBe("123e4567-e89b-12d3-a456-426614174000");
  });

  it("deve rejeitar supplierId que não seja UUID", () => {
    const invalid = validateAssignSupplier({
      supplierId: "id-invalido-123",
    });
    expect(invalid.error).toBeDefined();
  });
});
