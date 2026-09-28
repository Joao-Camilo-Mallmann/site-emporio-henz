import { ConflictError, NotFoundError } from "@/lib/errors";
import { suppliersRepository, SuppliersRepository } from "@/modules/suppliers/suppliers.repository";
import { usersRepository, UsersRepository } from "@/modules/users/users.repository";
import {
  userSuppliersRepository,
  UserSuppliersRepository,
} from "@/modules/user-suppliers/user-suppliers.repository";
import {
  AssignedSupplierDto,
  UserSupplierLinkDto,
} from "@/modules/user-suppliers/user-suppliers.types";

export class UserSuppliersService {
  constructor(
    private repo: UserSuppliersRepository = userSuppliersRepository,
    private usersRepo: UsersRepository = usersRepository,
    private suppliersRepo: SuppliersRepository = suppliersRepository,
  ) {}

  async listUserSuppliers(userId: string): Promise<AssignedSupplierDto[]> {
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw new NotFoundError("Usuário não encontrado.");
    }

    return await this.repo.listByUserId(userId);
  }

  async assignSupplier(
    userId: string,
    supplierId: string,
  ): Promise<UserSupplierLinkDto> {
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw new NotFoundError("Usuário não encontrado.");
    }

    const supplier = await this.suppliersRepo.findById(supplierId);
    if (!supplier) {
      throw new NotFoundError("Fornecedor não encontrado.");
    }

    const existing = await this.repo.findExistingLink(userId, supplierId);
    if (existing) {
      if (existing.deleted_at === null) {
        throw new ConflictError(
          "Este fornecedor já está vinculado a este vendedor.",
        );
      }
      return await this.repo.reactivateLink(existing.id);
    }

    return await this.repo.createLink(userId, supplierId);
  }

  async revokeSupplier(userId: string, supplierId: string): Promise<void> {
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw new NotFoundError("Usuário não encontrado.");
    }

    const supplier = await this.suppliersRepo.findById(supplierId);
    if (!supplier) {
      throw new NotFoundError("Fornecedor não encontrado.");
    }

    const revoked = await this.repo.revokeLink(userId, supplierId);
    if (!revoked) {
      throw new NotFoundError("Vínculo não encontrado ou já revogado.");
    }
  }
}

export const userSuppliersService = new UserSuppliersService();
export default userSuppliersService;
