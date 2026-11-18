<script setup lang="ts">
import { maskPhoneInput } from "@/utils/phone";
import { Icon } from "@iconify/vue";
import { computed, ref, useId, useSlots } from "vue";

// Campo de texto do design system: label, hint e erro com o mesmo visual e
// acessibilidade do UiSelect. Atributos extras (type, placeholder, @blur,
// class...) vão para o `<input>`. `type="password"` ganha o botão de mostrar.
// `prefix`/`suffix` (texto) e `prefixIcon`/`suffixIcon` (Iconify) ficam dentro
// do campo; o slot `hint` aceita HTML.
// `mask="phone"` formata `(99) 99999-9999` enquanto a pessoa digita.

defineOptions({ inheritAttrs: false });

// Igual ao v-model nativo: `type="number"` (ou `.number`) devolve número.
const [model, modifiers] = defineModel<string | number | null>({
  set: (value) => {
    const toNumber = modifiers.number || type === "number";
    if (!toNumber || typeof value !== "string" || value === "") return value;
    const number = Number.parseFloat(value);
    return Number.isNaN(number) ? value : number;
  },
});

const props = withDefaults(
  defineProps<{
    id?: string;
    label?: string;
    hint?: string;
    error?: string;
    required?: boolean;
    type?: string;
    /** Texto fixo antes/depois do valor (ex.: "R$", "mm"). */
    prefix?: string;
    suffix?: string;
    /** Ícone Iconify antes/depois do valor (ex.: "mdi:magnify"). */
    prefixIcon?: string;
    suffixIcon?: string;
    size?: "sm" | "md" | "lg";
    /** Máscara aplicada enquanto digita. */
    mask?: "phone";
  }>(),
  {
    id: undefined,
    label: undefined,
    hint: undefined,
    type: "text",
    error: undefined,
    size: "md",
  },
);

const type = props.type as string;
const isPassword = type === "password";

const slots = useSlots();
const showPassword = ref(false);

const fallbackId = useId();
const inputId = computed(() => props.id ?? `ui-input-${fallbackId}`);
const describedBy = computed(
  () =>
    [
      props.error && `${inputId.value}-error`,
      (props.hint || slots.hint) && `${inputId.value}-hint`,
    ]
      .filter(Boolean)
      .join(" ") || undefined,
);

function onInput(event: Event) {
  model.value = props.mask
    ? maskPhoneInput(event)
    : (event.target as HTMLInputElement).value;
}
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="inputId"
      :class="
        size === 'lg'
          ? 'block text-sm font-bold text-stone-900 mb-2'
          : 'block text-xs font-semibold text-neutral-dark mb-1.5'
      "
    >
      {{ label }}<span v-if="required" class="text-rose-600"> *</span>
    </label>

    <div class="relative">
      <span
        v-if="prefix || prefixIcon"
        class="absolute inset-y-0 left-3 flex items-center text-sm text-stone-400"
      >
        <Icon v-if="prefixIcon" :icon="prefixIcon" class="w-4 h-4" />
        {{ prefix }}
      </span>
      <input
        :id="inputId"
        :value="model"
        :required="required"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
        @input="onInput"
        v-bind="$attrs"
        :type="isPassword && showPassword ? 'text' : type"
        :class="[
          'w-full rounded-lg border bg-white text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:ring-1 transition-colors',
          'disabled:bg-stone-50 disabled:text-stone-500 disabled:cursor-not-allowed',
          {
            sm: 'px-2.5 py-1.5 text-xs',
            md: 'px-3.5 py-2.5 text-sm',
            lg: 'px-4 py-3 text-sm',
          }[size],
          {
            'pl-10': prefix || prefixIcon,
            'pr-11': suffix || suffixIcon || isPassword,
          },
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
            : 'border-stone-300 focus:border-secondary focus:ring-secondary/20',
        ]"
      />
      <span
        v-if="suffix || suffixIcon || isPassword"
        class="absolute inset-y-0 right-3 flex items-center text-sm text-stone-400"
      >
        <button
          v-if="isPassword"
          type="button"
          tabindex="-1"
          class="hover:text-stone-600 focus:outline-none"
          aria-label="Alternar visibilidade da senha"
          @click="showPassword = !showPassword"
        >
          <Icon
            :icon="showPassword ? 'mdi:eye-off' : 'mdi:eye'"
            class="w-5 h-5"
          />
        </button>
        <Icon v-else-if="suffixIcon" :icon="suffixIcon" class="w-4 h-4" />
        {{ suffix }}
      </span>
    </div>

    <p v-if="error" :id="`${inputId}-error`" class="mt-1 text-xs text-rose-600">
      {{ error }}
    </p>
    <p
      v-if="hint || $slots.hint"
      :id="`${inputId}-hint`"
      class="mt-1 block text-xs text-stone-500"
    >
      <slot name="hint">{{ hint }}</slot>
    </p>
  </div>
</template>
