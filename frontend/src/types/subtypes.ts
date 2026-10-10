import type { Paginated, PaginationParams } from "./pagination";

export interface ISubtype {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubtypeDraftItem {
  id?: string;
  name: string;
  slug: string;
  active: boolean;
}

export interface SubtypeCreateInput {
  categoryId: string;
  name: string;
  slug?: string;
  active?: boolean;
}

export interface SubtypeUpdateInput {
  categoryId?: string;
  name?: string;
  slug?: string;
  active?: boolean;
}

export interface SubtypeFilterParams extends PaginationParams {
  search?: string;
  categoryId?: string;
  active?: boolean;
}

export type PaginatedSubtypesResponse = Paginated<ISubtype>;
