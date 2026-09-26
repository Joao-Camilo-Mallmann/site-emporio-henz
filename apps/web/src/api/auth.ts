import { api as axios } from "@/plugins/axios";
import type {
  AuthResponse,
  LoginCredentials,
  RegisterInput,
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
};

export default authApi;
