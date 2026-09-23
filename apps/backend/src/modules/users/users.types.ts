export interface UserDto {
  id: string;
  email: string;
  role: number;
  fullName: string;
  phone: string | null;
  city: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  role: number;
  fullName: string;
  phone?: string;
  city?: string;
}

export interface UpdateUserDto {
  fullName?: string;
  phone?: string;
  city?: string;
  role?: number;
  password?: string;
}

export interface UserQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: number;
}

export interface PaginatedUsersResult {
  data: UserDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
