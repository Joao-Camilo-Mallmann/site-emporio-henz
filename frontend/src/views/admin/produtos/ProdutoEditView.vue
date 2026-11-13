<script setup lang="ts">
import { produtosApi } from "@/api";
import { toast } from "@/composables/useToast";
import { formFromProduct, useProdutoFormStore } from "@/stores/produtoForm";
import { apiErrorMessage } from "@/utils/admin/produtos/produtoFormConstantes";
import { onBeforeUnmount, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProdutoForm from "./ProdutoForm.vue";

// Tela `/admin/produtos/:id/editar`: busca o produto, monta o formulário com
// ele, entrega à store e pede as opções dos seletores. Daí em diante o
// formulário fala com a store.

const store = useProdutoFormStore();
const router = useRouter();
// Falso depois de sair: a resposta da busca não mexe mais na store.
let ativa = true;

onMounted(() => {
  store.editando = true;
  produtosApi
    .buscarDetalhe(String(useRoute().params.id))
    .then((produto) => {
      if (!ativa) return;
      store.setProduto(formFromProduct(produto), produto);
      store.carregarOpcoes();
    })
    .catch((err: unknown) => {
      if (!ativa) return;
      toast.error(apiErrorMessage(err, "Não foi possível carregar o produto."));
      router.push("/admin/produtos");
    });
});

onBeforeUnmount(() => {
  ativa = false;
  store.limpar();
});
</script>

<template>
  <ProdutoTelaLayout>
    <ProdutoForm />
  </ProdutoTelaLayout>
</template>
