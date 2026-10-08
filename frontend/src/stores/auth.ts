import { authApi } from "@/api";
import { UserRole, type UserProfile } from "@/types";
import { getAuthToken, removeAuthToken, setAuthToken } from "@/utils/cookie";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const TOKEN_STORAGE_KEY = "token";

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(null);
  const user = ref<UserProfile | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === UserRole.Administrador);
  const isVendedor = computed(() => user.value?.role === UserRole.Vendedor);
  const isCliente = computed(() => user.value?.role === UserRole.Cliente);
  const isEquipe = computed(() => isAdmin.value || isVendedor.value);

  function setAuth(response: { token: string; user: UserProfile }): void {
    const persisted = setAuthToken(response.token);
    if (!persisted) {
      throw new Error(
        "Não foi possível salvar a sessão. Verifique se os cookies estão habilitados no navegador.",
      );
    }

    token.value = response.token;
    const normalizedName = response.user.name || response.user.fullName || "";
    user.value = {
      ...response.user,
      name: normalizedName,
      fullName: response.user.fullName || normalizedName,
    };
  }

  async function fetchCurrentUser(): Promise<void> {
    const validToken = getAuthToken();
    if (!validToken) {
      await logout();
      return;
    }

    token.value = validToken;
    loading.value = true;
    try {
      const profile = await authApi.me();
      const normalizedName = profile.name || profile.fullName || "";
      user.value = {
        ...profile,
        name: normalizedName,
        fullName: profile.fullName || normalizedName,
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
    removeAuthToken();
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

export default useAuthStore;
