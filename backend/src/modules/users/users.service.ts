import { ConflictError, NotFoundError } from "@/lib/errors";
import { hashPassword } from "@/lib/password";
import { usersRepository, UsersRepository } from "@/modules/users/users.repository";
import {
  CreateUserDto,
  PaginatedUsersResult,
  UpdateUserDto,
  UserDto,
  UserQueryFilters,
} from "@/modules/users/users.types";

export class UsersService {
  constructor(private repo: UsersRepository = usersRepository) {}

  async list(filters: UserQueryFilters): Promise<PaginatedUsersResult> {
    return await this.repo.list(filters);
  }

  async getById(id: string): Promise<UserDto> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundError("Usuário não encontrado.");
    }
    return user;
  }

  async create(dto: CreateUserDto): Promise<UserDto> {
    const isTaken = await this.repo.isEmailActive(dto.email);
    if (isTaken) {
      throw new ConflictError("Este e-mail já está em uso.");
    }

    const passwordHash = await hashPassword(dto.password);
    return await this.repo.create(dto, passwordHash);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDto> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError("Usuário não encontrado.");
    }

    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await hashPassword(dto.password);
    }

    const updated = await this.repo.update(id, dto, passwordHash);
    if (!updated) {
      throw new NotFoundError("Usuário não encontrado.");
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError("Usuário não encontrado.");
    }

    await this.repo.softDelete(id);
  }
}

export const usersService = new UsersService();
export default usersService;
