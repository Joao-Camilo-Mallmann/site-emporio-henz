import { Paginated } from "@/lib/pagination";
import { SubtypeDto } from "@/modules/subtypes/subtypes.types";

export interface CategoryDbRow {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  subtypes?: SubtypeDto[];
}

export interface CreateCategoryDto {
  name: string;
  slug?: string;
  active?: boolean;
}

export interface UpdateCategoryDto {
  name?: string;
  slug?: string;
  active?: boolean;
}

export interface CategoryQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

export type PaginatedCategoriesResult = Paginated<CategoryDto>;
