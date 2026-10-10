import type { UserRole } from "./auth";
import type { Paginated, PaginationParams } from "./pagination";

export interface IUser {
  id: string;
  email: string;
  role: UserRole | number;
  fullName: string;
  phone: string | null;
  city: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserCreateInput {
  email: string;
  password: string;
  role: UserRole | number;
  fullName: string;
  phone?: string;
  city?: string;
}

export interface UserUpdateInput {
  fullName?: string;
  phone?: string;
  city?: string;
  role?: UserRole | number;
  password?: string;
}

export interface UserFilterParams extends PaginationParams {
  search?: string;
  role?: UserRole | number;
}

export type PaginatedUsersResponse = Paginated<IUser>;
