<script setup lang="ts">
import type { UiCardProps } from "@/types";

defineProps<UiCardProps>();
</script>

<template>
  <div class="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all hover:border-amber-800/40 hover:shadow-md">
    <div v-if="title || badge" class="mb-3 flex items-center justify-between gap-2">
      <h3 v-if="title" class="text-base font-semibold text-stone-900">
        {{ title }}
      </h3>
      <span
        v-if="badge"
        class="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 border border-amber-200/60"
      >
        {{ badge }}
      </span>
    </div>
    <p v-if="description" class="text-sm text-stone-600 leading-relaxed">
      {{ description }}
    </p>
    <div v-if="$slots.default" class="mt-4">
      <slot />
    </div>
  </div>
</template>
