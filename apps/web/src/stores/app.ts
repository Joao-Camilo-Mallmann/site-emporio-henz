import { defineStore } from "pinia";
import { ref } from "vue";
import { sistemaApi, produtosApi } from "@/api";
import { Product, type BackendStatus } from "@/types";

export const useAppStore = defineStore("app", () => {
  const backendStatus = ref<BackendStatus>({
    online: false,
    loading: false,
  });

  const produtos = ref<Product[]>([]);
  const produtosLoading = ref(false);
  const produtosError = ref<string>();

  async function checkBackendHealth() {
    backendStatus.value.loading = true;
    backendStatus.value.error = undefined;
    try {
      const data = await sistemaApi.status();
      backendStatus.value = {
        online: true,
        timestamp: data.timestamp,
        uptime: data.uptime,
        loading: false,
      };
    } catch (err: unknown) {
      backendStatus.value = {
        online: false,
        loading: false,
        error: err instanceof Error ? err.message : "Falha na conexão",
      };
    }
  }

  async function carregarProdutos() {
    produtosLoading.value = true;
    produtosError.value = undefined;
    try {
      const lista = await produtosApi.listar();
      produtos.value = lista.map((p) => new Product(p));
    } catch (err: unknown) {
      produtosError.value =
        err instanceof Error ? err.message : "Erro ao carregar produtos";
    } finally {
      produtosLoading.value = false;
    }
  }

  return {
    backendStatus,
    produtos,
    produtosLoading,
    produtosError,
    checkBackendHealth,
    carregarProdutos,
  };
});
