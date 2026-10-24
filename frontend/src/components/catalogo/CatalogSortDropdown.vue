<script setup lang="ts">
import type { CatalogSortOption, UiSelectValue } from "@/types";

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

function handleSelectChange(value: UiSelectValue | undefined) {
  emit("update:modelValue", value as CatalogSortOption);
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
    <UiSelect
      id="catalog-sort"
      :model-value="modelValue"
      :options="sortOptions"
      size="sm"
      :block="false"
      @update:model-value="handleSelectChange"
    />
  </div>
</template>
