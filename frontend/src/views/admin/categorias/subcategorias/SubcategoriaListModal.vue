<script setup lang="ts">
import type { ICategory } from "@/types";
import { useRouter } from "vue-router";
import SubcategoriaTagManager from "./SubcategoriaTagManager.vue";

interface Props {
  open: boolean;
  category: ICategory | null;
}

defineProps<Props>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "change"): void;
}>();

const router = useRouter();
</script>

<template>
  <UiModal
    :open="open"
    :title="`Subtipos · ${category?.name || ''}`"
    variant="info"
    :show-icon="false"
    max-width="xl"
    :show-close="true"
    @close="emit('close')"
  >
    <div v-if="category" class="space-y-4 pt-1">
      <div class="flex items-center justify-between pb-1">
        <p class="text-xs text-stone-500">
          Gerencie as tipologias de móveis vinculadas a este ambiente.
        </p>
        <UiButton
          variant="link"
          size="none"
          class="text-xs text-secondary hover:text-secondary-hover"
          @click="router.push(`/admin/categorias/${category.id}/editar`)"
        >
          Abrir edição completa &rarr;
        </UiButton>
      </div>

      <!-- Gerenciador de Tags em Modo Live -->
      <SubcategoriaTagManager
        :category-id="category.id"
        mode="live"
        @change="emit('change')"
      />
    </div>

    <template #footer="{ cancel }">
      <UiButton variant="outline" size="sm" @click="cancel">
        Fechar
      </UiButton>
    </template>
  </UiModal>
</template>
