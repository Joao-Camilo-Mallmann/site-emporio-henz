import type { Paginated, PaginationParams } from "./pagination";
import type { Subtype } from "./subtypes";

export * from "./subtypes";

export interface Category {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  subtypes?: Subtype[];
}

export interface CategoryCreateInput {
  name: string;
  slug?: string;
  active?: boolean;
}

export interface CategoryUpdateInput {
  name?: string;
  slug?: string;
  active?: boolean;
}

export interface CategoryFilterParams extends PaginationParams {
  search?: string;
  active?: boolean;
}

export type PaginatedCategoriesResponse = Paginated<Category>;
