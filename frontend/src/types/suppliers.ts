import type { Paginated, PaginationParams } from "./pagination";

export interface Supplier {
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

export type PaginatedSuppliersResponse = Paginated<Supplier>;

export interface AssignedSupplier {
  id: string;
  name: string;
  contact: string | null;
  active: boolean;
  linkedAt: string;
}

export interface UserSupplierLinkDto {
  id: string;
  userId: string;
  supplierId: string;
  createdAt: string;
  updatedAt?: string;
}

export type PaginatedAssignedSuppliersResponse = Paginated<AssignedSupplier>;
