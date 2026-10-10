import type { Paginated, PaginationParams } from "./pagination";

export interface ISupplier {
  id: string;
  name: string;
  contact: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierCreateInput {
  name: string;
  contact?: string;
  active?: boolean;
}

export interface SupplierUpdateInput {
  name?: string;
  contact?: string;
  active?: boolean;
}

export interface SupplierFilterParams extends PaginationParams {
  search?: string;
  active?: boolean;
}

export type PaginatedSuppliersResponse = Paginated<ISupplier>;
