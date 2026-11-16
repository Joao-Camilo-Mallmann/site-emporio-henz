import { CategoriesRepository } from "@/modules/categories/categories.repository";
import {
  CategoryDto,
  CategoryQueryFilters,
  CreateCategoryDto,
  PaginatedCategoriesResult,
  UpdateCategoryDto,
} from "@/modules/categories/categories.types";
import { SubtypeDto } from "@/modules/subtypes/subtypes.types";
import { RequestContext } from "@/lib/router";

export const ACTIVE_ID = "11111111-1111-4111-a111-111111111111";

export const INACTIVE_ID = "22222222-2222-4222-a222-222222222222";

export function uniqueViolation(): Error {
  return Object.assign(
    new Error(
      'duplicate key value violates unique constraint "idx_categories_slug_active"',
    ),
    { code: "ERR_POSTGRES_SERVER_ERROR", errno: "23505" },
  );
}

export function buildCtx(id: string, role?: number): RequestContext {
  return {
    params: { id },
    url: new URL(`http://localhost/api/v1/categorias/${id}`),
    user: role ? { id: "user-1", email: "user@emporio.com.br", role } : undefined,
  };
}

export class MockCategoriesRepository extends CategoriesRepository {
  public categories: (CategoryDto & { deleted: boolean })[] = [];
  public subtypes: (SubtypeDto & { deleted: boolean })[] = [];
  public products: {
    id: string;
    categoryId: string;
    active: boolean;
    deleted: boolean;
  }[] = [];

  async listPaginated(
    filters: CategoryQueryFilters = {},
  ): Promise<PaginatedCategoriesResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const search = filters.search?.toLowerCase() || null;

    let items = this.categories.filter(
      (c) =>
        !c.deleted &&
        (filters.active === undefined || c.active === filters.active) &&
        (!search || c.name.toLowerCase().includes(search)),
    );

    const total = items.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    items = items.slice(offset, offset + limit);

    return {
      data: items.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        active: c.active,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        subtypes: this.subtypes
          .filter(
            (s) =>
              s.categoryId === c.id &&
              !s.deleted &&
              (filters.active !== true || s.active),
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

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

  async existsCategorySlugActive(
    slug: string,
    excludeId?: string,
  ): Promise<boolean> {
    return this.categories.some(
      (c) => !c.deleted && c.slug === slug && c.id !== excludeId,
    );
  }

  async createCategory(
    data: CreateCategoryDto & { slug: string },
  ): Promise<CategoryDto> {
    const id = `cat-${Date.now()}-${Math.random()}`;
    const c = {
      id,
      name: data.name,
      slug: data.slug,
      active: data.active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deleted: false,
      subtypes: [],
    };
    this.categories.push(c);
    return c;
  }

  async updateCategory(
    id: string,
    data: UpdateCategoryDto,
  ): Promise<CategoryDto | null> {
    const c = this.categories.find((c) => c.id === id);
    if (!c || c.deleted) return null;
    if (data.name !== undefined) c.name = data.name;
    if (data.slug !== undefined) c.slug = data.slug;
    if (data.active !== undefined) c.active = data.active;
    c.updatedAt = new Date().toISOString();
    return c;
  }

  async countLinkedProducts(categoryId: string): Promise<number> {
    return this.products.filter(
      (p) => p.categoryId === categoryId && !p.deleted,
    ).length;
  }

  async softDeleteCategoryWithCascade(id: string): Promise<boolean> {
    const c = this.categories.find((c) => c.id === id);
    if (!c || c.deleted) return false;
    if ((await this.countLinkedProducts(id)) > 0) return false;

    c.deleted = true;

    this.subtypes.forEach((s) => {
      if (s.categoryId === id && !s.deleted) {
        s.deleted = true;
      }
    });
    return true;
  }
}
