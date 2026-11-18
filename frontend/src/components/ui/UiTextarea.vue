<script setup lang="ts">
import { computed, useId } from "vue";

// Textarea do design system, com label, hint e erro iguais aos do UiInput.
// Atributos extras (rows, placeholder, maxlength, @blur...) vão para o `<textarea>`.

defineOptions({ inheritAttrs: false });

const model = defineModel<string>();

const props = defineProps<{
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}>();

const fallbackId = useId();
const textareaId = computed(() => props.id ?? `ui-textarea-${fallbackId}`);
const describedBy = computed(
  () =>
    [
      props.error && `${textareaId.value}-error`,
      props.hint && `${textareaId.value}-hint`,
    ]
      .filter(Boolean)
      .join(" ") || undefined,
);
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      :for="textareaId"
      class="block text-xs font-semibold text-neutral-dark mb-1.5"
    >
      {{ label }}<span v-if="required" class="text-rose-600"> *</span>
    </label>

    <textarea
      :id="textareaId"
      v-model="model"
      :required="required"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy"
      v-bind="$attrs"
      :class="[
        'w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:ring-1 transition-colors resize-y',
        'disabled:bg-stone-50 disabled:text-stone-500 disabled:cursor-not-allowed',
        error
          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
          : 'border-stone-300 focus:border-secondary focus:ring-secondary/20',
      ]"
    />

    <p v-if="error" :id="`${textareaId}-error`" class="mt-1 text-xs text-rose-600">
      {{ error }}
    </p>
    <p v-if="hint" :id="`${textareaId}-hint`" class="mt-1 block text-xs text-stone-500">
      {{ hint }}
    </p>
  </div>
</template>
