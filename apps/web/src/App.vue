<script setup lang="ts">
import AppFooter from "@/components/layout/AppFooter.vue";
import AppNavbar from "@/components/layout/AppNavbar.vue";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import { Icon } from "@iconify/vue";
import { onMounted } from "vue";

const authStore = useAuthStore();
const appStore = useAppStore();

onMounted(() => {
  // Restaura a sessão do usuário caso haja token salvo
  authStore.fetchCurrentUser();
});
</script>

<template>
  <div
    class="min-h-screen flex flex-col bg-surface-light text-stone-900 selection:bg-amber-100 selection:text-amber-900 font-sans"
  >
    <!-- Navbar Institucional do Figma -->
    <AppNavbar />

    <!-- Alerta Global de Notificação do Sistema -->
    <div
      v-if="appStore.systemAlert"
      class="bg-amber-500 text-stone-950 px-4 py-2.5 text-xs sm:text-sm font-semibold shadow-md transition-all animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div class="flex items-center gap-2.5">
          <Icon icon="mdi:alert-circle-outline" class="w-5 h-5 text-stone-950 shrink-0" />
          <span>{{ appStore.systemAlert.message }}</span>
        </div>
        <button
          type="button"
          @click="appStore.clearAlert()"
          class="p-1 hover:bg-black/10 rounded transition-colors cursor-pointer shrink-0"
          aria-label="Fechar notificação"
        >
          <Icon icon="mdi:close" class="w-4 h-4 text-stone-950" />
        </button>
      </div>
    </div>

    <!-- Conteúdo Principal -->
    <main class="flex-1 w-full">
      <RouterView />
    </main>

    <!-- Rodapé do Figma (com Floating Actions integrado) -->
    <AppFooter />
  </div>
</template>
