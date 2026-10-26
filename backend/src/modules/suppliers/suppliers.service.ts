import { NotFoundError } from "@/lib/errors";
import { AuthenticatedUser } from "@/lib/router";
import { ROLES } from "@/middlewares/role";
import { suppliersRepository, SuppliersRepository } from "@/modules/suppliers/suppliers.repository";
import {
  CreateSupplierDto,
  PaginatedSuppliersResult,
  SupplierDto,
  SupplierQueryFilters,
  UpdateSupplierDto,
} from "@/modules/suppliers/suppliers.types";

export class SuppliersService {
  constructor(private repo: SuppliersRepository = suppliersRepository) {}

  async list(
    filters: SupplierQueryFilters = {},
    actor?: AuthenticatedUser,
  ): Promise<PaginatedSuppliersResult> {
    // Vendedor enxerga só as empresas às quais está vinculado (RF16); sem vínculo = lista vazia.
    if (actor?.role === ROLES.SELLER) {
      return await this.repo.list({ ...filters, linkedUserId: actor.id });
    }
    return await this.repo.list({ ...filters, linkedUserId: undefined });
  }

  async getById(id: string): Promise<SupplierDto> {
    const supplier = await this.repo.findById(id);
    if (!supplier) {
      throw new NotFoundError("Fornecedor não encontrado.");
    }
    return supplier;
  }

  async create(dto: CreateSupplierDto): Promise<SupplierDto> {
    return await this.repo.create(dto);
  }

  async update(id: string, dto: UpdateSupplierDto): Promise<SupplierDto> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError("Fornecedor não encontrado.");
    }

    const updated = await this.repo.update(id, dto);
    if (!updated) {
      throw new NotFoundError("Fornecedor não encontrado.");
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError("Fornecedor não encontrado.");
    }

    await this.repo.softDelete(id);
  }
}

export const suppliersService = new SuppliersService();
export default suppliersService;
