<script setup lang="ts">
import AppFooter from "@/components/layout/AppFooter.vue";
import AppNavbar from "@/components/layout/AppNavbar.vue";
import LoginParaSalvarModal from "@/components/listas/LoginParaSalvarModal.vue";
import MinhasListasModal from "@/components/listas/MinhasListasModal.vue";
import SalvarEmListaModal from "@/components/listas/SalvarEmListaModal.vue";
import { useAuthStore } from "@/stores/auth";
import { onMounted } from "vue";

const authStore = useAuthStore();

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

    <!-- Conteúdo Principal -->
    <main class="flex-1 w-full">
      <RouterView />
    </main>

    <!-- Rodapé do Figma (com Floating Actions integrado) -->
    <AppFooter />

    <!-- Modais Globais de Listas e Salvamento de Produtos -->
    <SalvarEmListaModal />
    <LoginParaSalvarModal />
    <MinhasListasModal />
  </div>
</template>
