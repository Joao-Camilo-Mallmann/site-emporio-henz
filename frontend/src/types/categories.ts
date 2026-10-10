import type { Paginated, PaginationParams } from "./pagination";
import type { ISubtype } from "./subtypes";

export * from "./subtypes";

export interface ICategory {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  subtypes?: ISubtype[];
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

export type PaginatedCategoriesResponse = Paginated<ICategory>;
