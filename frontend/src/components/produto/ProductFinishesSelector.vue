<script setup lang="ts">
import { computed } from "vue";
import type { ProductVariationItem } from "@/types";

interface Props {
  variations: ProductVariationItem[];
  modelValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", id: string): void;
  (e: "change", variation: ProductVariationItem): void;
}>();

const selectedVariation = computed(() => {
  if (!props.variations || props.variations.length === 0) return null;
  return (
    props.variations.find((v) => v.id === props.modelValue) ||
    props.variations[0]
  );
});

function selectVariation(variation: ProductVariationItem) {
  emit("update:modelValue", variation.id);
  emit("change", variation);
}
</script>

<template>
  <div v-if="variations && variations.length > 0" class="flex flex-col gap-2.5">
    <div class="text-sm text-stone-700">
      <span>Acabamento: </span>
      <span class="font-bold text-neutral-dark">
        {{ selectedVariation?.name || "Padrão" }}
      </span>
    </div>

    <div
      class="flex items-center gap-3"
      role="radiogroup"
      aria-label="Opções de acabamento"
    >
      <button
        v-for="variation in variations"
        :key="variation.id"
        type="button"
        role="radio"
        :aria-checked="selectedVariation?.id === variation.id"
        :aria-label="variation.name"
        :title="variation.name"
        class="w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-200 cursor-pointer focus:outline-none shrink-0 shadow-xs relative"
        :class="[
          selectedVariation?.id === variation.id
            ? 'ring-2 ring-secondary/80 ring-offset-2 ring-offset-white scale-105 border border-black/10'
            : 'border border-black/10 hover:border-black/25 hover:scale-105',
        ]"
        :style="{
          backgroundColor: variation.colorHex || '#A58D63',
        }"
        @click="selectVariation(variation)"
      >
        <span class="sr-only">{{ variation.name }}</span>
      </button>
    </div>
  </div>
</template>
