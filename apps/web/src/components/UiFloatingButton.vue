<script setup lang="ts">
import type { UiFloatingButtonProps } from "@/types";
import { Icon } from "@iconify/vue";

const props = withDefaults(defineProps<UiFloatingButtonProps>(), {
  variant: "primary",
  size: "md",
  target: "_self",
});

const emit = defineEmits<{
  (e: "click", event: MouseEvent): void;
}>();
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
    :class="[
      'rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm hover:scale-115 select-none group',
      props.size === 'sm' && 'w-7 h-7',
      props.size === 'md' && 'w-10 h-10',
      props.size === 'lg' && 'w-12 h-12',
      props.variant === 'whatsapp' &&
        'bg-secondary hover:bg-secondary-hover text-white',
      props.variant === 'primary' && 'bg-secondary hover:bg-secondary-hover text-white',
      props.variant === 'secondary' &&
        'bg-stone-200 hover:bg-stone-300 text-stone-800',
      props.variant === 'dark' && 'bg-primary hover:bg-secondary text-white',
    ]"
    @click="(e) => emit('click', e)"
  >
    <slot>
      <Icon
        v-if="props.icon"
        :icon="props.icon"
        :class="[
          'text-current transition-transform duration-200',
          props.size === 'sm' && 'w-4 h-4',
          props.size === 'md' && 'w-5 h-5',
          props.size === 'lg' && 'w-6 h-6',
        ]"
      />
    </slot>
  </a>

  <!-- RouterLink interno com to -->
  <RouterLink
    v-else-if="props.to"
    :to="props.to"
    :aria-label="props.ariaLabel || props.title"
    :title="props.title"
    :class="[
      'rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 select-none group',
      props.size === 'sm' && 'w-10 h-10',
      props.size === 'md' && 'w-12 h-12',
      props.size === 'lg' && 'w-14 h-14',
      props.variant === 'whatsapp' &&
        'bg-[#25D366] hover:bg-[#20BD5A] text-white',
      props.variant === 'primary' && 'bg-secondary hover:bg-secondary-hover text-white',
      props.variant === 'secondary' &&
        'bg-stone-200 hover:bg-stone-300 text-stone-800',
      props.variant === 'dark' && 'bg-primary hover:bg-secondary text-white',
    ]"
    @click="(e) => emit('click', e)"
  >
    <slot>
      <Icon
        v-if="props.icon"
        :icon="props.icon"
        :class="[
          'text-current transition-transform duration-200',
          props.size === 'sm' && 'w-5 h-5',
          props.size === 'md' && 'w-6 h-6',
          props.size === 'lg' && 'w-7 h-7',
        ]"
      />
    </slot>
  </RouterLink>

  <!-- Botão de ação (ex: scroll to top) -->
  <button
    v-else
    type="button"
    :aria-label="props.ariaLabel || props.title"
    :title="props.title"
    :class="[
      'rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg hover:shadow-2xl hover:scale-110 active:scale-95 select-none group',
      props.size === 'sm' && 'w-10 h-10',
      props.size === 'md' && 'w-12 h-12',
      props.size === 'lg' && 'w-14 h-14',
      props.variant === 'whatsapp' &&
        'bg-[#25D366] hover:bg-[#20BD5A] text-white',
      props.variant === 'primary' && 'bg-secondary hover:bg-secondary-hover text-white',
      props.variant === 'secondary' &&
        'bg-stone-200 hover:bg-stone-300 text-stone-800',
      props.variant === 'dark' && 'bg-primary hover:bg-secondary text-white',
    ]"
    @click="(e) => emit('click', e)"
  >
    <slot>
      <Icon
        v-if="props.icon"
        :icon="props.icon"
        :class="[
          'text-current transition-transform duration-200',
          props.size === 'sm' && 'w-5 h-5',
          props.size === 'md' && 'w-6 h-6',
          props.size === 'lg' && 'w-7 h-7',
        ]"
      />
    </slot>
  </button>
</template>
