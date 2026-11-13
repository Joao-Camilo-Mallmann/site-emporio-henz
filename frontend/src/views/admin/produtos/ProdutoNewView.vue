<script setup lang="ts">
import { useProdutoFormStore } from "@/stores/produtoForm";
import { onBeforeUnmount } from "vue";
import ProdutoForm from "./ProdutoForm.vue";

// Tela `/admin/produtos/novo`: pede à store um produto em branco e as opções
// dos seletores. Daí em diante o formulário fala com a store.

const store = useProdutoFormStore();

store.setProduto();
store.carregarOpcoes();

onBeforeUnmount(store.limpar);
</script>

<template>
  <ProdutoTelaLayout>
    <ProdutoForm />
  </ProdutoTelaLayout>
</template>
