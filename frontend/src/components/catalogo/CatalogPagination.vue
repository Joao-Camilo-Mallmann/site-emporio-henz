<script setup lang="ts">
import UiButton from "@/components/ui/UiButton.vue";
import type { CatalogPaginationMeta } from "@/types";
import { computed, defineEmits, defineProps } from "vue";

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
      class="font-medium"
      @click="goToPage(meta.currentPage - 1)"
    >
      <svg
        class="w-4 h-4 mr-0.5 inline-block"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15 19l-7-7 7-7"
        />
      </svg>
      <span>Anterior</span>
    </UiButton>

    <!-- Números de Página -->
    <div class="flex items-center gap-1 sm:gap-1.5">
      <template v-for="(page, index) in visiblePages" :key="index">
        <span
          v-if="page === '...'"
          class="px-2 py-1 text-xs sm:text-sm text-stone-400 select-none flex items-center justify-center min-w-[32px]"
          aria-hidden="true"
        >
          …
        </span>
        <UiButton
          v-else
          size="sm"
          :variant="page === meta.currentPage ? 'primary' : 'outline'"
          :aria-current="page === meta.currentPage ? 'page' : undefined"
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
      class="font-medium"
      @click="goToPage(meta.currentPage + 1)"
    >
      <span>Próximo</span>
      <svg
        class="w-4 h-4 ml-0.5 inline-block"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </UiButton>
  </nav>
</template>
