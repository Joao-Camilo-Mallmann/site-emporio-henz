<script setup lang="ts">
import type { UiStepperProps } from "@/types";
import { Icon } from "@iconify/vue";

// Indicador de etapas horizontal: círculo numerado e título de cada etapa,
// ligados por uma linha. Em telas estreitas só o título da etapa atual
// aparece. Só apresenta o estado; quem decide a etapa atual é o pai, que
// recebe `select` ao clicar numa etapa liberada. Posição (ex.: `sticky`) e
// fundo vêm pela `class` do pai.

const props = withDefaults(defineProps<UiStepperProps>(), {
  reached: 0,
  free: false,
  errors: () => [],
});

const emit = defineEmits<{ (e: "select", index: number): void }>();

const isOpen = (index: number) => props.free || index <= props.reached;
const isDone = (index: number) => !props.free && index < props.reached;

function circleClass(index: number): string {
  if (props.errors.includes(index)) return "bg-rose-500 text-white ring-4 ring-rose-100";
  if (index === props.current) return "bg-secondary text-white ring-4 ring-secondary/15";
  if (isDone(index)) return "bg-emerald-500 text-white";
  return isOpen(index) ? "bg-stone-200 text-stone-700" : "bg-stone-100 text-stone-400";
}
</script>

<template>
  <nav aria-label="Etapas">
    <ol class="flex items-center gap-2">
      <li
        v-for="(title, index) in steps"
        :key="title"
        class="flex items-center gap-2"
        :class="index < steps.length - 1 ? 'flex-1' : ''"
      >
        <UiButton
          type="button"
          variant="custom"
          size="none"
          :disabled="!isOpen(index)"
          :aria-current="index === current ? 'step' : undefined"
          :aria-label="`Etapa ${index + 1}: ${title}`"
          class="gap-2 whitespace-nowrap text-xs disabled:cursor-not-allowed"
          @click="emit('select', index)"
        >
          <span
            class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-semibold transition-all"
            :class="circleClass(index)"
          >
            <Icon v-if="errors.includes(index)" icon="mdi:exclamation-thick" class="h-4 w-4" />
            <Icon v-else-if="isDone(index)" icon="mdi:check" class="h-4 w-4" />
            <template v-else>{{ index + 1 }}</template>
          </span>
          <span
            :class="
              index === current
                ? 'font-semibold text-neutral-dark'
                : ['hidden lg:inline', isOpen(index) ? 'text-stone-500' : 'text-stone-400']
            "
          >
            {{ title }}
          </span>
        </UiButton>
        <span
          v-if="index < steps.length - 1"
          aria-hidden="true"
          class="h-px min-w-3 flex-1"
          :class="isDone(index) ? 'bg-emerald-300' : 'bg-stone-200'"
        ></span>
      </li>
    </ol>
  </nav>
</template>
