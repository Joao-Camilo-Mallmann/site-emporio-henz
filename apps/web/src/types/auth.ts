export type UserRole = 1 | 2 | 3; // 1: Cliente, 2: Vendedor, 3: Administrador

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleName?: "cliente" | "vendedor" | "admin";
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface AuthResponse {
  user: UserProfile;
  token: string;
}
