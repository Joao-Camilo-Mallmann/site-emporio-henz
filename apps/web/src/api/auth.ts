import { api as axios } from "@/plugins/axios";
import type {
  LoginCredentials,
  RegisterInput,
  UserProfile,
  AuthResponse,
} from "@/types";
import { mockLogin, mockRegister, mockMe } from "@/utils/mocks/authMock";

// Alternador entre simulação transparente e chamada real ao backend Bun
const USE_MOCK = true;

export default {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (USE_MOCK) {
      return await mockLogin(credentials);
    }
    const response = await axios.post<AuthResponse>(
      "/api/auth/login",
      credentials,
    );
    return response.data;
  },

  async register(data: RegisterInput): Promise<AuthResponse> {
    if (USE_MOCK) {
      return await mockRegister(data);
    }
    const response = await axios.post<AuthResponse>("/api/auth/register", data);
    return response.data;
  },

  async me(token?: string): Promise<UserProfile> {
    if (USE_MOCK) {
      return await mockMe(token || "");
    }
    const response = await axios.get<UserProfile>("/api/auth/me");
    return response.data;
  },
};
