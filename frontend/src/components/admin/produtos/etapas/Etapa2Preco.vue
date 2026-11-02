<script setup lang="ts">
import type { FieldErrors, ProductFormState } from "@/types";
import {
  AVAILABILITY_OPTIONS,
  ERROR_TEXT_CLASS,
  FIELD_IDS,
  fieldClass,
  HINT_CLASS,
  INSTALLMENTS_MAX,
  INSTALLMENTS_MIN,
  LABEL_CLASS,
} from "@/utils/admin/produtos/produtoFormConstantes";

// Etapa 2 do formulário de produto: preço de referência, parcelas,
// disponibilidade e, só sob encomenda, o prazo de fabricação.

const form = defineModel<ProductFormState>({ required: true });

const props = withDefaults(
  defineProps<{ errors?: FieldErrors; locked?: boolean }>(),
  { errors: () => ({}), locked: false },
);

function fieldError(id: string): string {
  return props.errors[id] ?? "";
}

function describedBy(id: string, hintId?: string): string | undefined {
  const parts = [fieldError(id) ? `${id}-error` : "", hintId ?? ""].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
}
</script>

<template>
  <fieldset :disabled="locked" class="min-w-0 space-y-5">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <!-- Preço de referência -->
      <div>
        <label :for="FIELD_IDS.referencePrice" :class="LABEL_CLASS">Preço de referência *</label>
        <div class="relative">
          <span class="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-stone-500" aria-hidden="true">R$</span>
          <input
            :id="FIELD_IDS.referencePrice"
            v-model="form.referencePrice"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.01"
            placeholder="0,00"
            aria-required="true"
            :aria-invalid="fieldError(FIELD_IDS.referencePrice) ? 'true' : undefined"
            :aria-describedby="describedBy(FIELD_IDS.referencePrice)"
            :class="[fieldClass(!!fieldError(FIELD_IDS.referencePrice)), 'pl-10']"
          />
        </div>
        <p v-if="fieldError(FIELD_IDS.referencePrice)" :id="`${FIELD_IDS.referencePrice}-error`" :class="ERROR_TEXT_CLASS">
          {{ fieldError(FIELD_IDS.referencePrice) }}
        </p>
      </div>

      <!-- Parcelas -->
      <div>
        <label :for="FIELD_IDS.maxInstallments" :class="LABEL_CLASS">Parcelas máximas *</label>
        <input
          :id="FIELD_IDS.maxInstallments"
          v-model="form.maxInstallments"
          type="number"
          inputmode="numeric"
          :min="INSTALLMENTS_MIN"
          :max="INSTALLMENTS_MAX"
          step="1"
          aria-required="true"
          :aria-invalid="fieldError(FIELD_IDS.maxInstallments) ? 'true' : undefined"
          :aria-describedby="describedBy(FIELD_IDS.maxInstallments, `${FIELD_IDS.maxInstallments}-hint`)"
          :class="fieldClass(!!fieldError(FIELD_IDS.maxInstallments))"
        />
        <p v-if="fieldError(FIELD_IDS.maxInstallments)" :id="`${FIELD_IDS.maxInstallments}-error`" :class="ERROR_TEXT_CLASS">
          {{ fieldError(FIELD_IDS.maxInstallments) }}
        </p>
        <p :id="`${FIELD_IDS.maxInstallments}-hint`" :class="HINT_CLASS">
          De {{ INSTALLMENTS_MIN }} a {{ INSTALLMENTS_MAX }}. Use 1 para pagamento à vista.
        </p>
      </div>
    </div>

    <!-- Disponibilidade -->
    <fieldset class="min-w-0">
      <legend :class="LABEL_CLASS">Disponibilidade *</legend>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label
          v-for="option in AVAILABILITY_OPTIONS"
          :key="option.value"
          :for="`product-availability-${option.value}`"
          class="flex items-start gap-3 rounded-lg border p-3.5 cursor-pointer transition-colors"
          :class="
            form.availabilityType === option.value
              ? 'border-secondary bg-surface-tint/30'
              : 'border-stone-200 hover:border-stone-300'
          "
        >
          <input
            :id="`product-availability-${option.value}`"
            v-model="form.availabilityType"
            type="radio"
            name="product-availability"
            :value="option.value"
            class="mt-0.5 w-4 h-4 border-stone-300 text-secondary focus:ring-secondary"
          />
          <span>
            <span class="block text-sm font-medium text-neutral-dark">{{ option.label }}</span>
            <span class="block text-xs text-stone-500 mt-0.5">{{ option.hint }}</span>
          </span>
        </label>
      </div>
    </fieldset>

    <!-- Prazo (só sob encomenda) -->
    <div v-if="form.availabilityType === 'ON_DEMAND'" class="sm:max-w-xs">
      <label :for="FIELD_IDS.estimatedDays" :class="LABEL_CLASS">Prazo de fabricação (dias) *</label>
      <input
        :id="FIELD_IDS.estimatedDays"
        v-model="form.estimatedDays"
        type="number"
        inputmode="numeric"
        min="1"
        step="1"
        placeholder="Ex.: 15"
        aria-required="true"
        :aria-invalid="fieldError(FIELD_IDS.estimatedDays) ? 'true' : undefined"
        :aria-describedby="describedBy(FIELD_IDS.estimatedDays)"
        :class="fieldClass(!!fieldError(FIELD_IDS.estimatedDays))"
      />
      <p v-if="fieldError(FIELD_IDS.estimatedDays)" :id="`${FIELD_IDS.estimatedDays}-error`" :class="ERROR_TEXT_CLASS">
        {{ fieldError(FIELD_IDS.estimatedDays) }}
      </p>
    </div>
  </fieldset>
</template>
