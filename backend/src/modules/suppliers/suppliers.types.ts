import { Paginated } from "@/lib/pagination";

export interface SupplierDbRow {
  id: string;
  name: string;
  contact: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

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
  /** Definido só pelo service (nunca pela query): restringe aos fornecedores vinculados ativamente a este usuário. */
  linkedUserId?: string;
  /** Definido só pelo service: quando false, omite contact da resposta e da busca textual. */
  includeContact?: boolean;
}

export type PaginatedSuppliersResult = Paginated<SupplierDto>;
