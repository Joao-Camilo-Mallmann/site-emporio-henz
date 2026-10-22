<script setup lang="ts">
import type { UiSelectProps, UiSelectValue } from "@/types";
import { Icon } from "@iconify/vue";
import { computed, useId } from "vue";

// Select nativo do design system: mantém a acessibilidade e o teclado do
// navegador, com o visual dos campos de formulário e uma seta própria.
// Atributos extras (ex.: `@change`, `class`) vão para o `<select>`.

defineOptions({ inheritAttrs: false });

const model = defineModel<UiSelectValue>();

const props = withDefaults(defineProps<UiSelectProps>(), {
  options: undefined,
  placeholder: undefined,
  placeholderValue: "",
  placeholderDisabled: false,
  id: undefined,
  name: undefined,
  label: undefined,
  ariaLabel: undefined,
  hint: undefined,
  error: undefined,
  required: false,
  disabled: false,
  size: "md",
  block: true,
});

const fallbackId = useId();
const selectId = computed(() => props.id ?? `ui-select-${fallbackId}`);
const errorId = computed(() => `${selectId.value}-error`);
const hintId = computed(() => `${selectId.value}-hint`);

const describedBy = computed(() => {
  // O texto de ajuda some quando há erro, então só um dos dois é referenciado.
  const ids = [props.error ? errorId.value : props.hint ? hintId.value : ""];
  const joined = ids.filter(Boolean).join(" ");
  return joined || undefined;
});
</script>

<template>
  <div :class="block ? 'w-full' : 'inline-block'">
    <label
      v-if="label"
      :for="selectId"
      class="block text-xs font-semibold text-neutral-dark mb-1.5"
    >
      {{ label }}<span v-if="required" class="text-rose-600"> *</span>
    </label>

    <div class="relative">
      <select
        :id="selectId"
        v-model="model"
        :name="name"
        :required="required"
        :disabled="disabled"
        :aria-label="label ? undefined : ariaLabel"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
        v-bind="$attrs"
        :class="[
          'w-full appearance-none rounded-lg border bg-white text-neutral-dark transition-colors cursor-pointer',
          'focus:outline-none focus:ring-1',
          'disabled:bg-stone-50 disabled:text-stone-500 disabled:cursor-not-allowed',
          size === 'sm'
            ? 'py-2 pl-3 pr-9 text-xs sm:text-sm'
            : 'py-2.5 pl-3.5 pr-10 text-sm',
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
            : 'border-stone-300 focus:border-secondary focus:ring-secondary/20',
        ]"
      >
        <option
          v-if="placeholder !== undefined"
          :value="placeholderValue"
          :disabled="placeholderDisabled"
        >
          {{ placeholder }}
        </option>
        <template v-if="options">
          <option
            v-for="option in options"
            :key="String(option.value)"
            :value="option.value"
            :disabled="option.disabled"
          >
            {{ option.label }}
          </option>
        </template>
        <slot v-else />
      </select>

      <Icon
        icon="mdi:chevron-down"
        aria-hidden="true"
        class="pointer-events-none absolute top-1/2 -translate-y-1/2 w-4 h-4"
        :class="[
          size === 'sm' ? 'right-2.5' : 'right-3',
          disabled ? 'text-stone-300' : 'text-stone-500',
        ]"
      />
    </div>

    <p v-if="error" :id="errorId" class="mt-1 text-xs text-rose-600">
      {{ error }}
    </p>
    <p v-else-if="hint" :id="hintId" class="mt-1 block text-xs text-stone-500">
      {{ hint }}
    </p>
  </div>
</template>
