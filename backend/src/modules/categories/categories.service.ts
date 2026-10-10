import { ConflictError, isUniqueViolation, NotFoundError } from "@/lib/errors";
import { slugify } from "@/lib/slug";
import {
  categoriesRepository,
  CategoriesRepository,
} from "./categories.repository";
import {
  CategoryDto,
  CategoryQueryFilters,
  CreateCategoryDto,
  PaginatedCategoriesResult,
  UpdateCategoryDto,
} from "./categories.types";

export class CategoriesService {
  constructor(private repo: CategoriesRepository = categoriesRepository) {}

  async listHierarchy(): Promise<CategoryDto[]> {
    return await this.repo.listHierarchy(true);
  }

  // Registros inativos só são visíveis com `includeInactive` (Administrador).
  async listPaginated(
    filters: CategoryQueryFilters = {},
    includeInactive = false,
  ): Promise<PaginatedCategoriesResult> {
    return await this.repo.listPaginated(
      includeInactive ? filters : { ...filters, active: true },
    );
  }

  async getCategoryById(
    id: string,
    includeInactive = false,
  ): Promise<CategoryDto> {
    const category = await this.repo.findCategoryById(id);
    if (!category || (!includeInactive && !category.active)) {
      throw new NotFoundError("Categoria não encontrada.");
    }
    return category;
  }

  async createCategory(dto: CreateCategoryDto): Promise<CategoryDto> {
    const slug = dto.slug || slugify(dto.name);
    const slugExists = await this.repo.existsCategorySlugActive(slug);
    if (slugExists) {
      throw this.slugConflict(slug);
    }

    try {
      return await this.repo.createCategory({
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
  }

  private slugConflict(slug: string): ConflictError {
    return new ConflictError(
      `Já existe uma categoria ativa com o slug '${slug}'.`,
    );
  }

  async updateCategory(
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryDto> {
    const existing = await this.repo.findCategoryById(id);
    if (!existing) {
      throw new NotFoundError("Categoria não encontrada.");
    }

    if (dto.slug) {
      const slugExists = await this.repo.existsCategorySlugActive(
        dto.slug,
        id,
      );
      if (slugExists) {
        throw this.slugConflict(dto.slug);
      }
    }

    let updated: CategoryDto | null;
    try {
      updated = await this.repo.updateCategory(id, dto);
    } catch (error) {
      if (dto.slug && isUniqueViolation(error)) {
        throw this.slugConflict(dto.slug);
      }
      throw error;
    }

    if (!updated) {
      throw new NotFoundError("Categoria não encontrada.");
    }

    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    const existing = await this.repo.findCategoryById(id);
    if (!existing) {
      throw new NotFoundError("Categoria não encontrada.");
    }

    await this.repo.softDeleteCategoryWithCascade(id);
  }
}

export const categoriesService = new CategoriesService();
export default categoriesService;
