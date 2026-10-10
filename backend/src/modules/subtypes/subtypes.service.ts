import { ConflictError, isUniqueViolation, NotFoundError } from "@/lib/errors";
import { slugify } from "@/lib/slug";
import {
  categoriesRepository,
  CategoriesRepository,
} from "@/modules/categories/categories.repository";
import { subtypesRepository, SubtypesRepository } from "./subtypes.repository";
import {
  CreateSubtypeDto,
  PaginatedSubtypesResult,
  SubtypeDto,
  SubtypeQueryFilters,
  UpdateSubtypeDto,
} from "./subtypes.types";

export class SubtypesService {
  constructor(
    private repo: SubtypesRepository = subtypesRepository,
    private categoriesRepo: CategoriesRepository = categoriesRepository,
  ) {}

  // Registros inativos (ou de categoria inativa) só são visíveis com
  // `includeInactive` (Administrador).
  async listPaginated(
    filters: SubtypeQueryFilters = {},
    includeInactive = false,
  ): Promise<PaginatedSubtypesResult> {
    return await this.repo.listPaginated(
      includeInactive ? filters : { ...filters, active: true },
      !includeInactive,
    );
  }

  async getById(id: string, includeInactive = false): Promise<SubtypeDto> {
    const subtype = await this.repo.findById(id, !includeInactive);
    if (!subtype) {
      throw new NotFoundError("Subtipo não encontrado.");
    }
    return subtype;
  }

  async create(dto: CreateSubtypeDto): Promise<SubtypeDto> {
    const category = await this.categoriesRepo.findCategoryById(dto.categoryId);
    if (!category) {
      throw this.categoryNotFound();
    }

    const slug = dto.slug || slugify(dto.name);
    const slugExists = await this.repo.existsSlugActive(slug);
    if (slugExists) {
      throw this.slugConflict(slug);
    }

    let created: SubtypeDto | null;
    try {
      created = await this.repo.create({
        ...dto,
        slug,
      });
    } catch (error) {
      // Requisição concorrente gravou o mesmo slug após a checagem acima.
      if (isUniqueViolation(error)) {
        throw this.slugConflict(slug);
      }
      throw error;
    }

    // Categoria deletada por requisição concorrente após a checagem acima.
    if (!created) {
      throw this.categoryNotFound();
    }

    return created;
  }

  private categoryNotFound(): NotFoundError {
    return new NotFoundError("Categoria vinculada não encontrada.");
  }

  private slugConflict(slug: string): ConflictError {
    return new ConflictError(
      `Já existe um subtipo ativo com o slug '${slug}'.`,
    );
  }

  async update(id: string, dto: UpdateSubtypeDto): Promise<SubtypeDto> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError("Subtipo não encontrado.");
    }

    if (dto.categoryId) {
      const category = await this.categoriesRepo.findCategoryById(
        dto.categoryId,
      );
      if (!category) {
        throw this.categoryNotFound();
      }
    }

    if (dto.slug) {
      const slugExists = await this.repo.existsSlugActive(dto.slug, id);
      if (slugExists) {
        throw this.slugConflict(dto.slug);
      }
    }

    let updated: SubtypeDto | null;
    try {
      updated = await this.repo.update(id, dto);
    } catch (error) {
      if (dto.slug && isUniqueViolation(error)) {
        throw this.slugConflict(dto.slug);
      }
      throw error;
    }

    // O subtipo ou a nova categoria foi deletado por requisição concorrente.
    if (!updated) {
      throw new NotFoundError(
        "Subtipo ou categoria vinculada não encontrados.",
      );
    }

    return updated;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError("Subtipo não encontrado.");
    }

    await this.repo.softDelete(id);
  }
}

export const subtypesService = new SubtypesService();
export default subtypesService;
