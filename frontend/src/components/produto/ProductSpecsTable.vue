<script setup lang="ts">
import type { ProductSpecificationItem } from "@/types";

interface Props {
  specifications: ProductSpecificationItem[];
}

defineProps<Props>();
</script>

<template>
  <div
    v-if="specifications && specifications.length > 0"
    class="w-full overflow-hidden rounded-xl border border-stone-200 shadow-xs"
  >
    <table class="w-full text-left border-collapse">
      <tbody>
        <tr
          v-for="(spec, index) in specifications"
          :key="spec.label"
          class="transition-colors border-b border-stone-100 last:border-b-0"
          :class="index % 2 === 0 ? 'bg-white' : 'bg-stone-50'"
        >
          <td
            class="py-3 px-4 sm:px-6 text-xs sm:text-sm font-medium text-stone-700 w-1/3 sm:w-1/4 align-top"
          >
            {{ spec.label }}
          </td>
          <td
            class="py-3 px-4 sm:px-6 text-xs sm:text-sm text-neutral-dark font-normal leading-relaxed align-top"
          >
            {{ spec.value }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
