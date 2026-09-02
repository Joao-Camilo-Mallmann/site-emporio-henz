import { defineStore } from "pinia";
import { ref } from "vue";

export interface BackendStatus {
  online: boolean;
  timestamp?: string;
  uptime?: number;
  loading: boolean;
  error?: string;
}

export const useAppStore = defineStore("app", () => {
  const backendStatus = ref<BackendStatus>({
    online: false,
    loading: false,
  });

  async function checkBackendHealth() {
    backendStatus.value.loading = true;
    backendStatus.value.error = undefined;
    try {
      // Usa o proxy '/api/health' configurado no vite.config.ts ou direto no backend port 3001
      const res = await fetch("http://localhost:3001/health");
      if (!res.ok) {
        throw new Error(`Status ${res.status}`);
      }
      const data = await res.json();
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

  return {
    backendStatus,
    checkBackendHealth,
  };
});
