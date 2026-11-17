<script setup lang="ts">
import { useProdutoFormStore } from "@/stores/produtoForm";
import type { NumericInput } from "@/types";
import { FIELD_IDS } from "@/utils/admin/produtos/produtoFormConstantes";
import { storeToRefs } from "pinia";

// Etapa 3 do formulário de produto: altura, largura e profundidade em
// milímetros, com o equivalente em centímetros abaixo de cada campo.

const store = useProdutoFormStore();
const { form, locked } = storeToRefs(store);
const { fieldError } = store;

const dimensionFields = [
  { id: FIELD_IDS.heightMm, key: "heightMm", label: "Altura" },
  { id: FIELD_IDS.widthMm, key: "widthMm", label: "Largura" },
  { id: FIELD_IDS.depthMm, key: "depthMm", label: "Profundidade" },
] as const;

/** "2300" mm → "230 cm"; `null` se o valor não é um número positivo. */
function formatMmAsCm(value: NumericInput): string | null {
  const mm = Number(value);
  if (!(mm > 0)) return null;
  const cm = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  return `${cm.format(mm / 10)} cm`;
}
</script>

<template>
  <ProdutoEtapaCartao
    id="secao-dimensoes"
    :numero="3"
    titulo="Dimensões"
    descricao="Medidas externas em milímetros, números inteiros."
  >

    <fieldset :disabled="locked" class="min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UiInput
        v-for="dimension in dimensionFields"
        :id="dimension.id"
        :key="dimension.id"
        v-model="form[dimension.key]"
        type="number"
        inputmode="numeric"
        min="1"
        step="1"
        :label="`${dimension.label} (mm) *`"
        placeholder="Ex.: 2300"
        aria-required="true"
        :error="fieldError(dimension.id)"
        :hint="
          formatMmAsCm(form[dimension.key])
            ? `= ${formatMmAsCm(form[dimension.key])}`
            : 'Equivalente em cm aparece aqui.'
        "
        suffix="mm"
      />
    </fieldset>
  </ProdutoEtapaCartao>
</template>
