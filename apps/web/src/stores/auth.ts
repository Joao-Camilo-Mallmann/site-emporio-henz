import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authApi } from "@/api";
import type { UserProfile, LoginCredentials, RegisterInput } from "@/types";

export const TOKEN_STORAGE_KEY = "token";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY));
  const user = ref<UserProfile | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 3);
  const isVendedor = computed(() => user.value?.role === 2);
  const isCliente = computed(() => user.value?.role === 1);
  const isEquipe = computed(() => isAdmin.value || isVendedor.value);

  async function login(credentials: LoginCredentials): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const response = await authApi.login(credentials);
      token.value = response.token;
      user.value = response.user;
      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        errorObj.response?.data?.message ||
        errorObj.message ||
        "Falha ao realizar login.";
      error.value = message;
      throw new Error(message);
    } finally {
      loading.value = false;
    }
  }

  async function register(input: RegisterInput): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const response = await authApi.register(input);
      token.value = response.token;
      user.value = response.user;
      localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      const message =
        errorObj.response?.data?.message ||
        errorObj.message ||
        "Falha ao realizar cadastro.";
      error.value = message;
      throw new Error(message);
    } finally {
      loading.value = false;
    }
  }

  async function fetchCurrentUser(): Promise<void> {
    if (!token.value) {
      user.value = null;
      return;
    }

    loading.value = true;
    try {
      const profile = await authApi.me(token.value);
      user.value = profile;
    } catch {
      console.warn("Sessão expirada ou inválida, efetuando logout...");
      logout();
    } finally {
      loading.value = false;
    }
  }

  function logout(): void {
    user.value = null;
    token.value = null;
    error.value = null;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isVendedor,
    isCliente,
    isEquipe,
    login,
    register,
    fetchCurrentUser,
    logout,
  };
});
