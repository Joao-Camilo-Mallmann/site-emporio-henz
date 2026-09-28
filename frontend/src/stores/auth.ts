import { authApi } from "@/api";
import { UserRole, type UserProfile } from "@/types";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const TOKEN_STORAGE_KEY = "token";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY));
  const user = ref<UserProfile | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === UserRole.Administrador);
  const isVendedor = computed(() => user.value?.role === UserRole.Vendedor);
  const isCliente = computed(() => user.value?.role === UserRole.Cliente);
  const isEquipe = computed(() => isAdmin.value || isVendedor.value);

  function setAuth(response: { token: string; user: UserProfile }): void {
    token.value = response.token;
    user.value = {
      ...response.user,
      name: response.user.name || response.user.fullName || "",
    };
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
  }

  async function fetchCurrentUser(): Promise<void> {
    if (!token.value) {
      user.value = null;
      return;
    }

    loading.value = true;
    try {
      const profile = await authApi.me();
      user.value = {
        ...profile,
        name: profile.name || profile.fullName || "",
      };
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
    setAuth,
    fetchCurrentUser,
    logout,
  };
});
