<script setup lang="ts">
import { createEmptyForm, useProdutoFormStore } from "@/stores/produtoForm";
import { onBeforeUnmount } from "vue";
import ProdutoForm from "./ProdutoForm.vue";

// Tela `/admin/produtos/novo`: cria o formulário vazio, entrega à store e
// pede as opções dos seletores. Daí em diante o formulário fala com a store.

const store = useProdutoFormStore();

store.setProduto(createEmptyForm());
store.carregarOpcoes();

onBeforeUnmount(store.limpar);
</script>

<template>
  <ProdutoTelaLayout>
    <ProdutoForm />
  </ProdutoTelaLayout>
</template>
