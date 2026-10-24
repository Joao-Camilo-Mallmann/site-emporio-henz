import { describe, expect, it } from "bun:test";
import { UserSuppliersService } from "@/modules/user-suppliers/user-suppliers.service";
import { ConflictError, NotFoundError } from "@/lib/errors";
import {
  MockUserSuppliersRepository,
  MockUsersRepoForLinks,
  MockSuppliersRepoForLinks,
} from "../../mocks/user-suppliers.mock";

describe("Módulo de Vínculos Vendedor ↔ Fornecedor (UserSuppliersService)", () => {
  it("deve vincular um vendedor a um fornecedor e listá-lo", async () => {
    const mockLinks = new MockUserSuppliersRepository();
    const mockUsers = new MockUsersRepoForLinks();
    const mockSuppliers = new MockSuppliersRepoForLinks();

    const userId = "b46a7ce0-1234-4567-8901-abcdef123456";
    const supplierId = "c57b8df1-2345-6789-0123-bcdefa234567";

    mockUsers.users.push({
      id: userId,
      email: "vendedor@teste.com",
      role: 2,
      fullName: "Vendedor Um",
      phone: null,
      city: null,
    });

    mockSuppliers.suppliers.push({
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
    expect(list.pagination.total).toBe(1);
    expect(list.data[0].id).toBe(supplierId);
  });

  it("deve impedir criação de vínculo duplicado ativo com ConflictError", async () => {
    const mockLinks = new MockUserSuppliersRepository();
    const mockUsers = new MockUsersRepoForLinks();
    const mockSuppliers = new MockSuppliersRepoForLinks();

    const userId = "b46a7ce0-1234-4567-8901-abcdef123456";
    const supplierId = "c57b8df1-2345-6789-0123-bcdefa234567";

    mockUsers.users.push({
      id: userId,
      email: "vendedor@teste.com",
      role: 2,
      fullName: "Vendedor Um",
      phone: null,
      city: null,
    });
    mockSuppliers.suppliers.push({
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

    mockUsers.users.push({
      id: userId,
      email: "vendedor@teste.com",
      role: 2,
      fullName: "Vendedor",
      phone: null,
      city: null,
    });
    mockSuppliers.suppliers.push({
      id: supplierId,
      name: "Fornecedor",
      contact: null,
      active: true,
    });

    const service = new UserSuppliersService(mockLinks, mockUsers, mockSuppliers);

    await service.assignSupplier(userId, supplierId);
    await service.revokeSupplier(userId, supplierId);

    const emptyList = await service.listUserSuppliers(userId);
    expect(emptyList.pagination.total).toBe(0);

    // Reativação
    const reactivated = await service.assignSupplier(userId, supplierId);
    expect(reactivated).toBeDefined();

    const restoredList = await service.listUserSuppliers(userId);
    expect(restoredList.pagination.total).toBe(1);
  });

  it("deve falhar ao revogar vínculo inexistente com NotFoundError", async () => {
    const mockLinks = new MockUserSuppliersRepository();
    const mockUsers = new MockUsersRepoForLinks();
    const mockSuppliers = new MockSuppliersRepoForLinks();

    const userId = "b46a7ce0-1234-4567-8901-abcdef123456";
    const supplierId = "c57b8df1-2345-6789-0123-bcdefa234567";

    mockUsers.users.push({
      id: userId,
      email: "vendedor@teste.com",
      role: 2,
      fullName: "Vendedor",
      phone: null,
      city: null,
    });
    mockSuppliers.suppliers.push({
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
