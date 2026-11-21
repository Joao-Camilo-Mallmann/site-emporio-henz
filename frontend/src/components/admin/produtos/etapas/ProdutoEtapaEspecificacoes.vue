<script setup lang="ts">
import { useProdutoFormStore } from "@/stores/produtoForm";
import { FIELD_IDS } from "@/utils/admin/produtos/produtoFormConstantes";
import { storeToRefs } from "pinia";

// Etapa 6 do formulário de produto: ficha técnica livre (pares
// característica/valor).

const { form, locked, serverErrors: errors } = storeToRefs(
  useProdutoFormStore(),
);
</script>

<template>
  <ProdutoEtapaCartao
    id="secao-especificacoes"
    :numero="6"
    titulo="Especificações técnicas"
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
</template>
