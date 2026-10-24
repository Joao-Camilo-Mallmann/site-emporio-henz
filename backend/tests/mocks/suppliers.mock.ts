import { SuppliersRepository } from "@/modules/suppliers/suppliers.repository";
import {
  CreateSupplierDto,
  PaginatedSuppliersResult,
  SupplierDto,
  SupplierQueryFilters,
  UpdateSupplierDto,
} from "@/modules/suppliers/suppliers.types";
import { paginate, resolvePagination } from "@/lib/pagination";

export class MockSuppliersRepository extends SuppliersRepository {
  public suppliers: (SupplierDto & { deleted: boolean })[] = [];
  public links: { userId: string; supplierId: string; revokedAt?: string }[] =
    [];

  async list(
    filters: SupplierQueryFilters = {},
  ): Promise<PaginatedSuppliersResult> {
    const { page, limit, offset } = resolvePagination(filters);
    const search = filters.search?.toLowerCase();
    const items = this.suppliers
      .filter((s) => !s.deleted)
      .filter(
        (s) =>
          !filters.linkedUserId ||
          this.links.some(
            (l) =>
              l.userId === filters.linkedUserId &&
              l.supplierId === s.id &&
              !l.revokedAt,
          ),
      )
      .filter((s) => filters.active === undefined || s.active === filters.active)
      .filter((s) => !search || s.name.toLowerCase().includes(search))
      .sort((a, b) => a.name.localeCompare(b.name));

    return paginate(items.slice(offset, offset + limit), items.length, {
      page,
      limit,
    });
  }

  async findById(id: string): Promise<SupplierDto | null> {
    const s = this.suppliers.find((s) => s.id === id);
    if (!s || s.deleted) {
      return null;
    }
    return {
      id: s.id,
      name: s.name,
      contact: s.contact,
      active: s.active,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  async create(data: CreateSupplierDto): Promise<SupplierDto> {
    const id = `supp-${Date.now()}-${Math.random()}`;
    const s = {
      id,
      name: data.name,
      contact: data.contact || null,
      active: data.active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
    };
    this.suppliers.push(s);
    return s;
  }

  async update(id: string, data: UpdateSupplierDto): Promise<SupplierDto | null> {
    const s = this.suppliers.find((s) => s.id === id);
    if (!s || s.deleted) {
      return null;
    }
    if (data.name !== undefined) s.name = data.name;
    if (data.contact !== undefined) s.contact = data.contact;
    if (data.active !== undefined) s.active = data.active;
    s.updatedAt = new Date().toISOString();
    return s;
  }

  async softDelete(id: string): Promise<boolean> {
    const s = this.suppliers.find((s) => s.id === id);
    if (!s || s.deleted) {
      return false;
    }
    s.deleted = true;
    return true;
  }
}
