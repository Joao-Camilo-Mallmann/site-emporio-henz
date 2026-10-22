<script setup lang="ts">
import { computed } from "vue";
import { isHexColor, normalizeHexColor } from "./produtoDraft";

// Círculo de pré-visualização das cores de uma variação: sólido (1 cor),
// dividido ao meio (2) ou em fatias iguais (3+). As cores são dados do
// produto e entram por `:style`, não por classe (design D11).

const props = withDefaults(
  defineProps<{
    colors: string[];
    size?: "sm" | "md" | "lg";
    label?: string;
  }>(),
  {
    size: "md",
    label: "",
  },
);

const validColors = computed(() =>
  props.colors.map(normalizeHexColor).filter(isHexColor),
);

const swatchStyle = computed<{ background?: string }>(() => {
  const colors = validColors.value;
  if (colors.length === 0) return {};
  if (colors.length === 1) return { background: colors[0] };
  if (colors.length === 2) {
    return {
      background: `linear-gradient(90deg, ${colors[0]} 50%, ${colors[1]} 50%)`,
    };
  }
  const slice = 100 / colors.length;
  const stops = colors
    .map(
      (color, index) =>
        `${color} ${(index * slice).toFixed(3)}% ${((index + 1) * slice).toFixed(3)}%`,
    )
    .join(", ");
  return { background: `conic-gradient(${stops})` };
});

const ariaLabel = computed(() => {
  if (props.label) return props.label;
  return validColors.value.length > 0
    ? `Cores: ${validColors.value.join(", ")}`
    : "Nenhuma cor válida";
});

const sizeClass = computed(() => {
  switch (props.size) {
    case "sm":
      return "w-5 h-5";
    case "lg":
      return "w-12 h-12";
    default:
      return "w-8 h-8";
  }
});
</script>

<template>
  <span
    role="img"
    :aria-label="ariaLabel"
    :title="ariaLabel"
    class="inline-block shrink-0 rounded-full border shadow-2xs"
    :class="[
      sizeClass,
      validColors.length === 0
        ? 'border-dashed border-stone-300 bg-stone-50'
        : 'border-black/10',
    ]"
    :style="swatchStyle"
  />
</template>
