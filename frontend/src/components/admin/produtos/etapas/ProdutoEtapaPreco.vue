<script setup lang="ts">
import { useProdutoFormStore } from "@/stores/produtoForm";
import {
  AVAILABILITY_OPTIONS,
  FIELD_IDS,
  INSTALLMENTS_MAX,
  INSTALLMENTS_MIN,
  LABEL_CLASS,
} from "@/utils/admin/produtos/produtoFormConstantes";
import { storeToRefs } from "pinia";

// Etapa 2 do formulário de produto: preço de referência, parcelas,
// disponibilidade e, só sob encomenda, o prazo de fabricação.

const store = useProdutoFormStore();
const { form, locked } = storeToRefs(store);
const { fieldError } = store;
</script>

<template>
  <ProdutoEtapaCartao
    id="secao-preco"
    :numero="2"
    titulo="Preço e disponibilidade"
    descricao="Valor base de referência; condições especiais são combinadas no atendimento."
  >

    <fieldset :disabled="locked" class="min-w-0 space-y-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Preço de referência -->
        <!-- Preço de referência -->
        <UiInput
          :id="FIELD_IDS.referencePrice"
          v-model="form.referencePrice"
          type="number"
          inputmode="decimal"
          min="0"
          step="0.01"
          label="Preço de referência *"
          placeholder="0,00"
          aria-required="true"
          :error="fieldError(FIELD_IDS.referencePrice)"
          prefix="R$"
        />

        <!-- Parcelas -->
        <UiInput
          :id="FIELD_IDS.maxInstallments"
          v-model="form.maxInstallments"
          type="number"
          inputmode="numeric"
          :min="INSTALLMENTS_MIN"
          :max="INSTALLMENTS_MAX"
          step="1"
          label="Parcelas máximas *"
          aria-required="true"
          :error="fieldError(FIELD_IDS.maxInstallments)"
          :hint="`De ${INSTALLMENTS_MIN} a ${INSTALLMENTS_MAX}. Use 1 para pagamento à vista.`"
        />
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
        <UiInput
          :id="FIELD_IDS.estimatedDays"
          v-model="form.estimatedDays"
          type="number"
          inputmode="numeric"
          min="1"
          step="1"
          label="Prazo de fabricação (dias) *"
          placeholder="Ex.: 15"
          aria-required="true"
          :error="fieldError(FIELD_IDS.estimatedDays)"
        />
      </div>
    </fieldset>
  </ProdutoEtapaCartao>
</template>
