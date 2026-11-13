<script setup lang="ts">
import type { FieldErrors, ProductFormState } from "@/types";
import { FIELD_IDS } from "@/utils/admin/produtos/produtoFormConstantes";

// Etapa 6 do formulário de produto: ficha técnica livre em chave e valor e o
// status do produto no catálogo.

const form = defineModel<ProductFormState>({ required: true });

withDefaults(defineProps<{ errors?: FieldErrors; locked?: boolean }>(), {
  errors: () => ({}),
  locked: false,
});
</script>

<template>
  <div class="space-y-5">
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

    <label
      :for="FIELD_IDS.active"
      class="flex items-start gap-3 cursor-pointer select-none border-t border-stone-100 pt-5"
    >
      <input
        :id="FIELD_IDS.active"
        v-model="form.active"
        type="checkbox"
        :disabled="locked"
        class="mt-0.5 w-4 h-4 rounded border-stone-300 text-secondary focus:ring-secondary cursor-pointer disabled:cursor-not-allowed"
      />
      <span>
        <span class="text-sm font-medium text-neutral-dark block">Produto ativo no catálogo</span>
        <span class="text-xs text-stone-500 block mt-0.5">
          Produtos inativos ficam guardados no painel e não aparecem para os clientes.
        </span>
      </span>
    </label>
  </div>
</template>
