<script setup lang="ts">
import type { FieldErrors, ProductFormState } from "@/types";
import { FIELD_IDS } from "@/utils/admin/produtos/produtoFormConstantes";

// Etapa 6 do formulário de produto: ficha técnica livre (pares
// característica/valor) e, num cartão à parte, o status no catálogo.

const form = defineModel<ProductFormState>({ required: true });

withDefaults(
  defineProps<{
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
</script>

<template>
  <ProdutoEtapaCartao
    :etapa="5"
    :visible="visible"
    descricao="Ficha técnica livre, como portas, gavetas ou tipo de espuma. Linhas vazias são ignoradas."
  >
    <KeyValueEditor
      v-model="form.specifications"
      :id-prefix="FIELD_IDS.specifications"
      :errors="errors"
      :disabled="locked"
      key-label="Característica"
      value-label="Valor"
      key-placeholder="Ex.: Gavetas"
      value-placeholder="Ex.: 4"
      add-label="Adicionar especificação"
      empty-text="Nenhuma especificação adicionada."
    />
  </ProdutoEtapaCartao>

  <!-- Status no catálogo -->
  <div
    v-show="visible"
    class="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs"
  >
    <label
      :for="FIELD_IDS.active"
      class="flex items-start gap-3 cursor-pointer select-none"
    >
      <input
        :id="FIELD_IDS.active"
        v-model="form.active"
        type="checkbox"
        :disabled="locked"
        class="mt-0.5 w-4 h-4 rounded border-stone-300 text-secondary focus:ring-secondary cursor-pointer disabled:cursor-not-allowed"
      />
      <span>
        <span class="text-sm font-medium text-neutral-dark block"
          >Produto ativo no catálogo</span
        >
        <span class="text-xs text-stone-500 block mt-0.5">
          Produtos inativos ficam guardados no painel e não aparecem para os
          clientes.
        </span>
      </span>
    </label>
  </div>
</template>
