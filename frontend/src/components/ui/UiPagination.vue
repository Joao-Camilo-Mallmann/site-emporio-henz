<script setup lang="ts">
import type { UiPaginationProps } from "@/types";
import { computed } from "vue";

const props = withDefaults(defineProps<UiPaginationProps>(), {
  total: undefined,
  itemLabel: "registros",
  disabled: false,
});

const emit = defineEmits<{
  (e: "update:page", page: number): void;
}>();

type PageItem = number | "...";

const hasSummary = computed(() => props.total !== undefined);
const showButtons = computed(() => props.totalPages > 1);
const isVisible = computed(() => hasSummary.value || showButtons.value);

const visiblePages = computed<PageItem[]>(() => {
  const total = props.totalPages;
  const current = props.page;

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
  if (props.disabled || page < 1 || page > props.totalPages || page === props.page) {
    return;
  }
  emit("update:page", page);
}
</script>

<template>
  <nav
    v-if="isVisible"
    aria-label="Navegação da paginação"
    :class="
      hasSummary
        ? 'flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 px-1'
        : 'flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 py-6'
    "
  >
    <!-- Resumo (somente quando o total de registros é informado) -->
    <span v-if="hasSummary">
      Página {{ page }} de {{ Math.max(totalPages, 1) }} ({{ total }}
      {{ itemLabel }})
    </span>

    <div
      v-if="showButtons"
      class="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2"
    >
      <!-- Botão Anterior -->
      <UiButton
        variant="outline"
        size="sm"
        :disabled="disabled || page <= 1"
        aria-label="Página anterior"
        @click="goToPage(page - 1)"
      >
        <Icon icon="mdi:chevron-left" class="h-4 w-4" />
        <span>Anterior</span>
      </UiButton>

      <!-- Números de Página -->
      <div class="flex items-center gap-1 sm:gap-1.5">
        <template v-for="(item, index) in visiblePages" :key="index">
          <span
            v-if="item === '...'"
            class="flex h-8 w-8 items-center justify-center text-sm text-stone-400 select-none"
            aria-hidden="true"
          >
            …
          </span>
          <UiButton
            v-else
            size="sm"
            :variant="item === page ? 'primary' : 'outline'"
            :disabled="disabled"
            :aria-current="item === page ? 'page' : undefined"
            class="min-w-8 px-2"
            @click="goToPage(item)"
          >
            {{ item }}
          </UiButton>
        </template>
      </div>

      <!-- Botão Próxima -->
      <UiButton
        variant="outline"
        size="sm"
        :disabled="disabled || page >= totalPages"
        aria-label="Próxima página"
        @click="goToPage(page + 1)"
      >
        <span>Próxima</span>
        <Icon icon="mdi:chevron-right" class="h-4 w-4" />
      </UiButton>
    </div>
  </nav>
</template>
