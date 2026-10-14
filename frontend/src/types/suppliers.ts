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

export interface IAssignedSupplier {
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

export type PaginatedAssignedSuppliersResponse = Paginated<IAssignedSupplier>;
