<script setup lang="ts">
import { useListasStore } from "@/stores/listas";
import { useRoute, useRouter } from "vue-router";

const listasStore = useListasStore();
const route = useRoute();
const router = useRouter();

// Leva o visitante ao login ou cadastro e volta para a página atual depois
function goToAuth(path: "/login" | "/cadastro") {
  listasStore.closeLoginPrompt(true);
  router.push({ path, query: { redirect: route.fullPath } });
}
</script>

<template>
  <UiModal
    :model-value="listasStore.isLoginPromptOpen"
    title="Entre para salvar seus móveis"
    variant="primary"
    icon="mdi:heart-outline"
    max-width="sm"
    :show-footer="false"
    :show-close="true"
    @update:model-value="(val) => (!val ? listasStore.closeLoginPrompt() : null)"
    @close="listasStore.closeLoginPrompt()"
  >
    <div class="space-y-5">
      <p class="text-sm text-stone-600">
        Suas listas ficam guardadas na sua conta. Entre ou crie uma conta com seu e-mail
        para salvar este móvel e encontrá-lo depois.
      </p>
      <div class="flex flex-col gap-2.5">
        <UiButton variant="primary" size="md" block @click="goToAuth('/login')">
          Entrar
        </UiButton>
        <UiButton variant="outline" size="md" block @click="goToAuth('/cadastro')">
          Criar conta
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>
