export enum UserRole {
  Cliente = 1,
  Vendedor = 2,
  Administrador = 3,
}

export interface UserProfile {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  role: UserRole;
  roleName?: "cliente" | "vendedor" | "admin";
  phone?: string;
  city?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterInput {
  fullName: string;
  name?: string;
  email: string;
  password: string;
  phone: string;
  city?: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}
