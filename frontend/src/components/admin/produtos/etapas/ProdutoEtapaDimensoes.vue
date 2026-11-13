<script setup lang="ts">
import type { FieldErrors, ProductFormState } from "@/types";
import {
  ERROR_TEXT_CLASS,
  FIELD_IDS,
  fieldClass,
  HINT_CLASS,
  LABEL_CLASS,
} from "@/utils/admin/produtos/produtoFormConstantes";
import { formatMmAsCm } from "@/utils/admin/produtos/produtoFormEstado";

// Etapa 3 do formulário de produto: altura, largura e profundidade em
// milímetros, com o equivalente em centímetros abaixo de cada campo.

const form = defineModel<ProductFormState>({ required: true });

const props = withDefaults(
  defineProps<{
    /** Etapa visível (a seção fica no DOM e é escondida com `v-show`). */
    visible?: boolean;
    errors?: FieldErrors;
    locked?: boolean;
  }>(),
  {
    visible: true,
    errors: () => ({}),
    locked: false,
  },
);

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
  <ProdutoEtapaCartao
    id="secao-dimensoes"
    :numero="3"
    titulo="Dimensões"
    :visible="visible"
    descricao="Medidas externas em milímetros, números inteiros."
  >

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
  </ProdutoEtapaCartao>
</template>
