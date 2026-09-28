import type { UserRole } from "./auth";

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

export interface UserFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole | number;
}

export interface PaginatedUsersResponse {
  data: IUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
