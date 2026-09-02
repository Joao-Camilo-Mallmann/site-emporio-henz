<script setup lang="ts">
interface Props {
  variant?: "primary" | "secondary" | "outline";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

withDefaults(defineProps<Props>(), {
  variant: "primary",
  type: "button",
  disabled: false,
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
      variant === 'primary' && 'bg-amber-800 text-white hover:bg-amber-900 focus:ring-amber-800 shadow-sm',
      variant === 'secondary' && 'bg-stone-200 text-stone-900 hover:bg-stone-300 focus:ring-stone-400',
      variant === 'outline' && 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 focus:ring-stone-400',
    ]"
    @click="(e) => emit('click', e)"
  >
    <slot />
  </button>
</template>
