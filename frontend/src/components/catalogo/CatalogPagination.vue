<script setup lang="ts">
import type { CatalogPaginationMeta } from "@/types";
import { computed } from "vue";


interface Props {
  meta: CatalogPaginationMeta;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "change-page", page: number): void;
}>();

type PageItem = number | "...";

const visiblePages = computed<PageItem[]>(() => {
  const total = props.meta.totalPages;
  const current = props.meta.currentPage;

  if (total <= 1) return [1];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: PageItem[] = [];

  if (current <= 4) {
    for (let i = 1; i <= 5; i++) {
      pages.push(i);
    }
    pages.push("...");
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push("...");
    for (let i = total - 4; i <= total; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    pages.push("...");
    pages.push(current - 1);
    pages.push(current);
    pages.push(current + 1);
    pages.push("...");
    pages.push(total);
  }

  return pages;
});

function goToPage(page: number) {
  if (
    page < 1 ||
    page > props.meta.totalPages ||
    page === props.meta.currentPage
  ) {
    return;
  }
  emit("change-page", page);
}
</script>

<template>
  <nav
    v-if="meta.totalPages > 1"
    aria-label="Navegação da paginação"
    class="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 py-6"
  >
    <!-- Botão Anterior -->
    <UiButton
      variant="outline"
      size="sm"
      :disabled="meta.currentPage <= 1"
      aria-label="Página anterior"
      @click="goToPage(meta.currentPage - 1)"
    >
      <Icon icon="mdi:chevron-left" class="h-4 w-4" />
      <span>Anterior</span>
    </UiButton>

    <!-- Números de Página -->
    <div class="flex items-center gap-1 sm:gap-1.5">
      <template v-for="(page, index) in visiblePages" :key="index">
        <span
          v-if="page === '...'"
          class="flex h-8 w-8 items-center justify-center text-sm text-stone-400 select-none"
          aria-hidden="true"
        >
          …
        </span>
        <UiButton
          v-else
          size="sm"
          :variant="page === meta.currentPage ? 'primary' : 'outline'"
          :aria-current="page === meta.currentPage ? 'page' : undefined"
          class="min-w-8 px-2"
          @click="goToPage(page)"
        >
          {{ page }}
        </UiButton>
      </template>
    </div>

    <!-- Botão Próximo -->
    <UiButton
      variant="outline"
      size="sm"
      :disabled="meta.currentPage >= meta.totalPages"
      aria-label="Próxima página"
      @click="goToPage(meta.currentPage + 1)"
    >
      <span>Próximo</span>
      <Icon icon="mdi:chevron-right" class="h-4 w-4" />
    </UiButton>
  </nav>
</template>
