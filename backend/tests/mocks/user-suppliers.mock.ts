import {
  UserSuppliersRepository,
} from "@/modules/user-suppliers/user-suppliers.repository";
import { UsersRepository } from "@/modules/users/users.repository";
import { SuppliersRepository } from "@/modules/suppliers/suppliers.repository";
import {
  AssignedSupplierDto,
  PaginatedAssignedSuppliersResult,
  UserSupplierLinkDto,
  UserSupplierQueryFilters,
} from "@/modules/user-suppliers/user-suppliers.types";
import { SupplierDto } from "@/modules/suppliers/suppliers.types";
import { UserDto } from "@/modules/users/users.types";
import { paginate, resolvePagination } from "@/lib/pagination";

export class MockUserSuppliersRepository extends UserSuppliersRepository {
  public links: { id: string; userId: string; supplierId: string; deleted: boolean; createdAt: string }[] = [];

  async listByUserId(
    userId: string,
    filters: UserSupplierQueryFilters = {},
  ): Promise<PaginatedAssignedSuppliersResult> {
    const { page, limit, offset } = resolvePagination(filters);
    const assigned: AssignedSupplierDto[] = [];
    this.links.forEach((link) => {
      if (link.userId === userId && !link.deleted) {
        assigned.push({
          id: link.supplierId,
          name: `Fornecedor ${link.supplierId}`,
          contact: "contato@teste.com",
          active: true,
          linkedAt: link.createdAt,
        });
      }
    });
    return paginate(assigned.slice(offset, offset + limit), assigned.length, {
      page,
      limit,
    });
  }

  async findExistingLink(
    userId: string,
    supplierId: string,
  ): Promise<{ id: string; user_id: string; supplier_id: string; created_at: Date; updated_at: Date; deleted_at: Date | null } | null> {
    const link = this.links.find(
      (l) => l.userId === userId && l.supplierId === supplierId,
    );
    if (!link) {
      return null;
    }
    return {
      id: link.id,
      user_id: link.userId,
      supplier_id: link.supplierId,
      created_at: new Date(link.createdAt),
      updated_at: new Date(),
      deleted_at: link.deleted ? new Date() : null,
    };
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
    this.links.push(link);
    return {
      id: link.id,
      userId: link.userId,
      supplierId: link.supplierId,
      createdAt: link.createdAt,
    };
  }

  async reactivateLink(id: string): Promise<UserSupplierLinkDto> {
    const link = this.links.find((l) => l.id === id);
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
    const link = this.links.find(
      (l) => l.userId === userId && l.supplierId === supplierId && !l.deleted,
    );
    if (!link) {
      return false;
    }
    link.deleted = true;
    return true;
  }
}

export class MockUsersRepoForLinks extends UsersRepository {
  public users: UserDto[] = [];

  async findById(id: string): Promise<UserDto | null> {
    return this.users.find((u) => u.id === id) || null;
  }
}

export class MockSuppliersRepoForLinks extends SuppliersRepository {
  public suppliers: SupplierDto[] = [];

  async findById(id: string): Promise<SupplierDto | null> {
    return this.suppliers.find((s) => s.id === id) || null;
  }
}
