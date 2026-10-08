<script setup lang="ts">
import type { CatalogSortOption } from "@/types";

interface Props {
  modelValue?: CatalogSortOption;
}

withDefaults(defineProps<Props>(), {
  modelValue: "relevancia",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: CatalogSortOption): void;
}>();

const sortOptions: { value: CatalogSortOption; label: string }[] = [
  { value: "relevancia", label: "Relevância" },
  { value: "menor-preco", label: "Menor Preço" },
  { value: "maior-preco", label: "Maior Preço" },
  { value: "recentes", label: "Mais Recentes" },
];

function handleSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit("update:modelValue", target.value as CatalogSortOption);
}
</script>

<template>
  <div class="flex items-center gap-2">
    <label
      for="catalog-sort"
      class="text-xs sm:text-sm text-stone-900 font-medium whitespace-nowrap"
    >
      Ordem:
    </label>
    <div class="relative inline-flex items-center">
      <select
        id="catalog-sort"
        :value="modelValue"
        class="appearance-none bg-white border border-stone-300 hover:border-stone-400 rounded-xl pl-3 sm:pl-4 pr-8 py-2 text-xs sm:text-sm font-medium text-stone-800 cursor-pointer shadow-none focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-colors"
        @change="handleSelectChange"
      >
        <option
          v-for="option in sortOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <div
        class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-stone-500"
        aria-hidden="true"
      >
        <!-- Ícone de setinhas verticais ⇅ / chevron duplo -->
        <Icon
          icon="mdi:unfold-more-horizontal"
          class="w-3.5 h-3.5 sm:w-4 sm:h-4"
        />
      </div>
    </div>
  </div>
</template>
