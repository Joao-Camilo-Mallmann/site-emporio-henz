<script setup lang="ts">
import { computed } from "vue";
import type { UiFloatingButtonProps } from "@/types";
import { Icon } from "@iconify/vue";

const props = withDefaults(defineProps<UiFloatingButtonProps>(), {
  variant: "primary",
  size: "md",
  target: "_self",
  type: "button",
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();

const sizeClasses = computed(() => {
  switch (props.size) {
    case "sm":
      return "w-7 h-7";
    case "lg":
      return "w-12 h-12";
    case "md":
    default:
      return "w-10 h-10";
  }
});

const iconSizeClasses = computed(() => {
  switch (props.size) {
    case "sm":
      return "w-4 h-4";
    case "lg":
      return "w-6 h-6";
    case "md":
    default:
      return "w-5 h-5";
  }
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case "secondary":
      return "bg-stone-200 hover:bg-stone-300 text-stone-800";
    case "dark":
      return "bg-primary hover:bg-secondary text-white";
    case "ghost":
      return "bg-transparent text-white/70 hover:text-white";
    case "primary":
    default:
      return "bg-secondary hover:bg-secondary-hover text-white";
  }
});

const commonClasses = computed(() => [
  "rounded-full flex items-center justify-center transition-all duration-200 select-none group cursor-pointer shadow-sm hover:scale-115",
  sizeClasses.value,
  variantClasses.value,
]);
</script>

<template>
  <!-- Link Externo com href -->
  <a
    v-if="props.href"
    :href="props.href"
    :target="props.target"
    :rel="props.target === '_blank' ? 'noopener noreferrer' : undefined"
    :aria-label="props.ariaLabel || props.title"
    :title="props.title"
    :class="commonClasses"
    @click="(e) => emit('click', e)"
  >
    <slot>
      <Icon
        v-if="props.icon"
        :icon="props.icon"
        :class="['text-current transition-transform duration-200', iconSizeClasses]"
      />
    </slot>
  </a>

  <!-- RouterLink interno com to -->
  <RouterLink
    v-else-if="props.to"
    :to="props.to"
    :aria-label="props.ariaLabel || props.title"
    :title="props.title"
    :class="commonClasses"
    @click="(e) => emit('click', e)"
  >
    <slot>
      <Icon
        v-if="props.icon"
        :icon="props.icon"
        :class="['text-current transition-transform duration-200', iconSizeClasses]"
      />
    </slot>
  </RouterLink>

  <!-- Botão de ação padrão -->
  <button
    v-else
    :type="props.type"
    :aria-label="props.ariaLabel || props.title"
    :title="props.title"
    :class="commonClasses"
    @click="(e) => emit('click', e)"
  >
    <slot>
      <Icon
        v-if="props.icon"
        :icon="props.icon"
        :class="['text-current transition-transform duration-200', iconSizeClasses]"
      />
    </slot>
  </button>
</template>
