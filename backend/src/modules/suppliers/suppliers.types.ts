import { Paginated } from "@/lib/pagination";

export interface SupplierDto {
  id: string;
  name: string;
  contact: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSupplierDto {
  name: string;
  contact?: string;
  active?: boolean;
}

export interface UpdateSupplierDto {
  name?: string;
  contact?: string;
  active?: boolean;
}

export interface SupplierQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  active?: boolean;
}

export type PaginatedSuppliersResult = Paginated<SupplierDto>;
