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

  // Registros inativos só são visíveis com `includeInactive` (Administrador).
  async listPaginated(
    filters: CategoryQueryFilters = {},
    includeInactive = false, // Se true, retorna registros inativos também (Administrador).
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

  // As regras (slug livre, categoria existente, produtos vinculados) são
  // validadas antes, em `categories.schema.ts`. Aqui só sobram as travas do
  // banco para escritas concorrentes que passaram pela validação.
  async createCategory(dto: CreateCategoryDto): Promise<CategoryDto> {
    const slug = dto.slug || slugify(dto.name);

    try {
      return await this.repo.createCategory({
        ...dto,
        slug,
      });
    } catch (error) {
      // Requisição concorrente gravou o mesmo slug após a validação.
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
    let updated: CategoryDto | null;
    try {
      updated = await this.repo.updateCategory(id, dto);
    } catch (error) {
      if (dto.slug && isUniqueViolation(error)) {
        throw this.slugConflict(dto.slug);
      }
      throw error;
    }

    // Excluída por outra requisição depois da validação.
    if (!updated) {
      throw new NotFoundError("Categoria não encontrada.");
    }

    return updated;
  }

  async deleteCategory(id: string): Promise<void> {
    const deleted = await this.repo.softDeleteCategoryWithCascade(id);

    // O SQL repete a checagem com a categoria bloqueada: chega aqui se outra
    // requisição a excluiu ou vinculou um produto depois da validação.
    if (!deleted) {
      throw new ConflictError(
        "A categoria foi alterada durante a exclusão. Atualize a página e tente novamente.",
      );
    }
  }
}

export const categoriesService = new CategoriesService();
export default categoriesService;
