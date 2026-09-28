import { api as axios } from "@/plugins/axios";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterInput,
  UpdateProfileInput,
  UserProfile,
} from "@/types";

export const authApi = {
  async login(body: LoginCredentials): Promise<AuthResponse> {
    const response = await axios.post<{ token: string; user: UserProfile }>(
      "/auth/login",
      body,
    );
    return response.data;
  },

  async register(body: RegisterInput): Promise<AuthResponse> {
    const response = await axios.post<{ token: string; user: UserProfile }>(
      "/auth/register",
      body,
    );
    return response.data;
  },

  async me(): Promise<UserProfile> {
    const response = await axios.get<UserProfile>("/auth/me");
    return response.data;
  },

  async atualizarPerfil(body: UpdateProfileInput): Promise<UserProfile> {
    const response = await axios.put<UserProfile>("/auth/me", body);
    return response.data;
  },
};

export default authApi;
