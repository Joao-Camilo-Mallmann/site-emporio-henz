<script setup lang="ts">
import type { FieldErrors, ProductFormState } from "@/types";
import {
  AVAILABILITY_OPTIONS,
  ERROR_TEXT_CLASS,
  FIELD_IDS,
  fieldClass,
  FORM_SECTIONS,
  HINT_CLASS,
  INSTALLMENTS_MAX,
  INSTALLMENTS_MIN,
  LABEL_CLASS,
} from "@/utils/admin/produtos/produtoFormConstantes";
import { formatMmAsCm } from "@/utils/admin/produtos/produtoFormEstado";

// Etapas 2 e 3 do formulário de produto, como dois cartões irmãos. Etapa 2:
// preço de referência, parcelas, disponibilidade e, só sob encomenda, o prazo
// de fabricação. Etapa 3: altura, largura e profundidade em milímetros, com o
// equivalente em centímetros abaixo de cada campo. Cada cartão tem a própria
// visibilidade e fica no DOM, escondido com `v-show`.

const form = defineModel<ProductFormState>({ required: true });

const props = withDefaults(
  defineProps<{
    /** Etapa 2 visível. */
    priceVisible?: boolean;
    /** Etapa 3 visível. */
    dimensionsVisible?: boolean;
    errors?: FieldErrors;
    locked?: boolean;
  }>(),
  {
    priceVisible: true,
    dimensionsVisible: true,
    errors: () => ({}),
    locked: false,
  },
);

const secaoPreco = FORM_SECTIONS[1];
const secaoDimensoes = FORM_SECTIONS[2];

const dimensionFields = [
  { id: FIELD_IDS.heightMm, key: "heightMm", label: "Altura" },
  { id: FIELD_IDS.widthMm, key: "widthMm", label: "Largura" },
  { id: FIELD_IDS.depthMm, key: "depthMm", label: "Profundidade" },
] as const;

function fieldError(id: string): string {
  return props.errors[id] ?? "";
}

function describedBy(id: string, hintId?: string): string | undefined {
  const parts = [fieldError(id) ? `${id}-error` : "", hintId ?? ""].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
}
</script>

<template>
  <!-- Etapa 2: preço e disponibilidade -->
  <section
    v-show="priceVisible"
    :id="secaoPreco.id"
    class="scroll-mt-32 rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs"
    :aria-labelledby="`${secaoPreco.id}-title`"
  >
    <header class="mb-5">
      <h2
        :id="`${secaoPreco.id}-title`"
        class="flex items-center gap-2.5 text-base font-semibold text-neutral-dark"
      >
        <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
        {{ secaoPreco.title }}
      </h2>
      <p class="mt-1 text-xs text-stone-500">
        Valor base de referência; condições especiais são combinadas no atendimento.
      </p>
    </header>

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
  </section>

  <!-- Etapa 3: dimensões -->
  <section
    v-show="dimensionsVisible"
    :id="secaoDimensoes.id"
    class="scroll-mt-32 rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs"
    :aria-labelledby="`${secaoDimensoes.id}-title`"
  >
    <header class="mb-5">
      <h2
        :id="`${secaoDimensoes.id}-title`"
        class="flex items-center gap-2.5 text-base font-semibold text-neutral-dark"
      >
        <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
        {{ secaoDimensoes.title }}
      </h2>
      <p class="mt-1 text-xs text-stone-500">
        Medidas externas em milímetros, números inteiros.
      </p>
    </header>

    <fieldset :disabled="locked" class="min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div v-for="dimension in dimensionFields" :key="dimension.id">
        <label :for="dimension.id" :class="LABEL_CLASS">{{ dimension.label }} (mm) *</label>
        <div class="relative">
          <input
            :id="dimension.id"
            v-model="form[dimension.key]"
            type="number"
            inputmode="numeric"
            min="1"
            step="1"
            placeholder="Ex.: 2300"
            aria-required="true"
            :aria-invalid="fieldError(dimension.id) ? 'true' : undefined"
            :aria-describedby="describedBy(dimension.id, `${dimension.id}-hint`)"
            :class="[fieldClass(!!fieldError(dimension.id)), 'pr-12']"
          />
          <span class="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs text-stone-500" aria-hidden="true">mm</span>
        </div>
        <p v-if="fieldError(dimension.id)" :id="`${dimension.id}-error`" :class="ERROR_TEXT_CLASS">
          {{ fieldError(dimension.id) }}
        </p>
        <p :id="`${dimension.id}-hint`" :class="HINT_CLASS">
          {{ formatMmAsCm(form[dimension.key]) ? `= ${formatMmAsCm(form[dimension.key])}` : "Equivalente em cm aparece aqui." }}
        </p>
      </div>
    </fieldset>
  </section>
</template>
