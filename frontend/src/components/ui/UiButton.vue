<script setup lang="ts">
import type { UiButtonProps } from "@/types";

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
      // Alinhamento, transição e layout estrutural
      'items-center justify-center font-medium transition-all duration-150 ease-out select-none text-center',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none disabled:transform-none',
      props.block ? 'w-full flex' : 'inline-flex',
      props.loading ? 'cursor-wait' : 'cursor-pointer active:scale-[0.98]',

      // Escala limpa e padronizada de tamanhos com cantos mais arredondados e padding proporcional
      props.size === 'xs' && 'h-8 px-3 rounded-lg text-xs gap-1.5',
      props.size === 'sm' && 'h-9 px-4 rounded-xl text-xs sm:text-sm gap-2',
      props.size === 'md' && 'h-11 px-5 rounded-xl text-sm gap-2.5',
      props.size === 'lg' &&
        'h-12 px-6 rounded-2xl text-base gap-3 font-medium',
      props.size === 'xl' &&
        'h-14 px-8 rounded-2xl text-base sm:text-lg gap-3.5 font-semibold',
      props.size === 'icon' &&
        'h-11 w-11 p-0 rounded-xl text-sm aspect-square shrink-0',
      props.size === 'none' && 'p-0 rounded-none',

      // Variantes refinadas de superfícies, bordas e cores
      props.variant === 'primary' &&
        'bg-primary text-white border border-transparent hover:bg-primary-dark active:bg-primary-dark/95 shadow-xs hover:shadow-sm focus-visible:ring-primary',
      props.variant === 'secondary' &&
        'bg-secondary text-white border border-transparent hover:bg-secondary-hover active:bg-secondary-hover/95 shadow-xs hover:shadow-sm focus-visible:ring-secondary',
      props.variant === 'outline' &&
        'border border-stone-300 bg-white text-stone-700 hover:border-secondary hover:text-secondary hover:bg-stone-50 active:bg-stone-100 shadow-2xs hover:shadow-xs focus-visible:ring-secondary',
      props.variant === 'ghost' &&
        'border border-transparent bg-transparent text-stone-700 hover:text-stone-900 hover:bg-stone-100/80 active:bg-stone-200/70 focus-visible:ring-stone-400',
      props.variant === 'danger' &&
        'bg-rose-600 text-white border border-transparent hover:bg-rose-700 active:bg-rose-800 shadow-xs hover:shadow-sm focus-visible:ring-rose-500',
      props.variant === 'link' &&
        'border-none bg-transparent text-secondary hover:text-secondary-hover underline-offset-4 hover:underline p-0 h-auto font-semibold focus-visible:ring-secondary',
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
