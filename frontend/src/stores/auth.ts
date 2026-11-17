import { authApi } from "@/api";
import { UserRole, type UserProfile } from "@/types";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<UserProfile | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const sessionInitialized = ref(false);
  let currentUserRequest: Promise<void> | null = null;
  let sessionRevision = 0;

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === UserRole.Administrador);
  const isVendedor = computed(() => user.value?.role === UserRole.Vendedor);
  const isCliente = computed(() => user.value?.role === UserRole.Cliente);
  const isEquipe = computed(() => isAdmin.value || isVendedor.value);

  function setAuth(response: { user: UserProfile }): void {
    sessionRevision += 1;
    const normalizedName = response.user.name || response.user.fullName || "";
    user.value = {
      ...response.user,
      name: normalizedName,
      fullName: response.user.fullName || normalizedName,
    };
    sessionInitialized.value = true;
  }

  function fetchCurrentUser(): Promise<void> {
    if (sessionInitialized.value) return Promise.resolve();
    if (currentUserRequest) return currentUserRequest;

    loading.value = true;
    const requestRevision = sessionRevision;
    currentUserRequest = (async () => {
      try {
        const profile = await authApi.me();
        if (requestRevision === sessionRevision) {
          setAuth({ user: profile });
        }
      } catch {
        if (requestRevision === sessionRevision) {
          user.value = null;
          sessionInitialized.value = true;
        }
      } finally {
        loading.value = false;
        currentUserRequest = null;
      }
    })();

    return currentUserRequest;
  }

  async function logout(): Promise<void> {
    sessionRevision += 1;
    user.value = null;
    error.value = null;
    sessionInitialized.value = true;
    try {
      await authApi.logout();
    } catch (err) {
      console.error("Não foi possível limpar o cookie de sessão no servidor.", err);
    }
  }

  return {
    user,
    loading,
    error,
    sessionInitialized,
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
