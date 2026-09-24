export interface RegisterDto {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  city?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthUserProfile {
  id: string;
  email: string;
  role: number;
  fullName: string;
  phone: string | null;
  city: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUserProfile;
}
