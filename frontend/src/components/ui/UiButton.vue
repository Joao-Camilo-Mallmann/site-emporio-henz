<script setup lang="ts">
import type { UiButtonProps } from "@/types";
import { defineEmits, defineProps, withDefaults } from "vue";

const props = withDefaults(defineProps<UiButtonProps>(), {
  variant: "primary",
  type: "button",
  disabled: false,
  loading: false,
  block: false,
  size: "md",
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();
</script>

<template>
  <button
    :type="props.type"
    :disabled="props.disabled || props.loading"
    :aria-busy="props.loading"
    :class="[
      // Base estrutural e alinhamento
      'items-center justify-center font-medium transition-all duration-150 ease-out select-none',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:transform-none',
      props.block ? 'flex w-full' : 'inline-flex',
      props.loading ? 'cursor-wait' : 'cursor-pointer active:scale-[0.98]',

      // Escala dinâmica de tamanhos
      props.size === 'xs' &&
        'h-7 px-2.5 rounded-md text-xs gap-1.5 tracking-tight',
      props.size === 'sm' && 'h-8.5 px-3.5 rounded-lg text-xs gap-2',
      props.size === 'md' && 'h-10 px-4.5 rounded-lg text-sm gap-2',
      props.size === 'lg' &&
        'h-11.5 px-5.5 rounded-xl text-base gap-2.5 font-medium',
      props.size === 'xl' &&
        'h-13 px-6.5 rounded-xl text-base sm:text-lg gap-3 font-semibold',
      props.size === 'icon' &&
        'h-10 w-10 p-0 rounded-lg text-sm aspect-square shrink-0',

      // Variantes de cores e superfícies alinhadas ao Design System
      props.variant === 'primary' &&
        'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark/95 shadow-xs hover:shadow-sm focus-visible:ring-primary',
      props.variant === 'secondary' &&
        'bg-secondary text-white hover:bg-secondary-hover active:bg-secondary-hover/95 shadow-xs hover:shadow-sm focus-visible:ring-secondary',
      props.variant === 'outline' &&
        'border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 hover:border-stone-400 active:bg-stone-100 shadow-2xs hover:shadow-xs focus-visible:ring-stone-400',
      props.variant === 'ghost' &&
        'bg-transparent text-stone-600 hover:text-stone-900 hover:bg-stone-100/70 active:bg-stone-200/60 focus-visible:ring-stone-300',
      props.variant === 'danger' &&
        'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs hover:shadow-sm focus-visible:ring-rose-500',
      props.variant === 'custom' && 'focus-visible:ring-secondary',
    ]"
    @click="(e) => emit('click', e)"
  >
    <!-- Spinner dinâmico de carregamento baseado na cor e tamanho -->
    <span
      v-if="props.loading"
      class="inline-block shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin"
      :class="[
        props.size === 'xs' || props.size === 'sm' ? 'w-3 h-3' : 'w-4 h-4',
      ]"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
