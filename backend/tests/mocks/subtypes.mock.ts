import { SubtypesRepository } from "@/modules/subtypes/subtypes.repository";
import { CategoriesRepository } from "@/modules/categories/categories.repository";
import {
  CreateSubtypeDto,
  PaginatedSubtypesResult,
  SubtypeDto,
  SubtypeQueryFilters,
  UpdateSubtypeDto,
} from "@/modules/subtypes/subtypes.types";
import { CategoryDto } from "@/modules/categories/categories.types";
import { RequestContext } from "@/lib/router";

export function buildCtx(id: string, role?: number): RequestContext {
  return {
    params: { id },
    url: new URL(`http://localhost/api/v1/subtipos/${id}`),
    user: role ? { id: "user-1", email: "user@emporio.com.br", role } : undefined,
  };
}

export class MockCategoriesRepoForSubtypes extends CategoriesRepository {
  public categories: (CategoryDto & { deleted: boolean })[] = [];

  async findCategoryById(id: string): Promise<CategoryDto | null> {
    const c = this.categories.find((c) => c.id === id);
    if (!c || c.deleted) return null;
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      active: c.active,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}

export class MockSubtypesRepository extends SubtypesRepository {
  public subtypes: (SubtypeDto & { deleted: boolean })[] = [];

  // Categorias inativas, para simular o JOIN de visibilidade pública do repositório.
  public inactiveCategoryIds: string[] = [];

  private isVisible(s: SubtypeDto): boolean {
    return s.active && !this.inactiveCategoryIds.includes(s.categoryId);
  }

  async listPaginated(
    filters: SubtypeQueryFilters = {},
    visibleOnly = false,
  ): Promise<PaginatedSubtypesResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const search = filters.search?.toLowerCase() || null;
    const categoryId = filters.categoryId || null;

    let items = this.subtypes.filter(
      (s) =>
        !s.deleted &&
        (!visibleOnly || this.isVisible(s)) &&
        (filters.active === undefined || s.active === filters.active) &&
        (!categoryId || s.categoryId === categoryId) &&
        (!search || s.name.toLowerCase().includes(search)),
    );

    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    items = items.slice(offset, offset + limit);

    return {
      data: items.map((s) => ({
        id: s.id,
        categoryId: s.categoryId,
        name: s.name,
        slug: s.slug,
        active: s.active,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async findById(id: string, visibleOnly = false): Promise<SubtypeDto | null> {
    const s = this.subtypes.find((s) => s.id === id);
    if (!s || s.deleted) return null;
    if (visibleOnly && !this.isVisible(s)) return null;
    return {
      id: s.id,
      categoryId: s.categoryId,
      name: s.name,
      slug: s.slug,
      active: s.active,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    };
  }

  async existsSlugActive(slug: string, excludeId?: string): Promise<boolean> {
    return this.subtypes.some(
      (s) => !s.deleted && s.slug === slug && s.id !== excludeId,
    );
  }

  async create(
    data: CreateSubtypeDto & { slug: string },
  ): Promise<SubtypeDto | null> {
    const id = `sub-${Date.now()}-${Math.random()}`;
    const s = {
      id,
      categoryId: data.categoryId,
      name: data.name,
      slug: data.slug,
      active: data.active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
    };
    this.subtypes.push(s);
    return s;
  }

  async update(
    id: string,
    data: UpdateSubtypeDto,
  ): Promise<SubtypeDto | null> {
    const s = this.subtypes.find((s) => s.id === id);
    if (!s || s.deleted) return null;
    if (data.categoryId !== undefined) s.categoryId = data.categoryId;
    if (data.name !== undefined) s.name = data.name;
    if (data.slug !== undefined) s.slug = data.slug;
    if (data.active !== undefined) s.active = data.active;
    s.updatedAt = new Date().toISOString();
    return s;
  }

  async softDelete(id: string): Promise<boolean> {
    const s = this.subtypes.find((s) => s.id === id);
    if (!s || s.deleted) return false;
    s.deleted = true;
    return true;
  }
}
