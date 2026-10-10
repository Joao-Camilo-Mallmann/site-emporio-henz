import { Paginated } from "@/lib/pagination";

export interface SubtypeDbRow {
  id: string;
  category_id: string;
  category_name?: string | null;
  name: string;
  slug: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SubtypeDto {
  id: string;
  categoryId: string;
  categoryName?: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubtypeDto {
  categoryId: string;
  name: string;
  slug?: string;
  active?: boolean;
}

export interface UpdateSubtypeDto {
  categoryId?: string;
  name?: string;
  slug?: string;
  active?: boolean;
}

export interface SubtypeQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  active?: boolean;
}

export type PaginatedSubtypesResult = Paginated<SubtypeDto>;
