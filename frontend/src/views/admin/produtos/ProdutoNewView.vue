<script setup lang="ts">
import { useProdutoEnvioArquivos, useProdutoOpcoes } from "@/composables/useProdutoTela";
import type { ProductDto, ProductFormState } from "@/types";
import { apiErrorMessage } from "@/utils/admin/produtos/produtoFormConstantes";
import {
  createEmptyForm,
  resolveVariationIds,
  revokeFormObjectUrls,
} from "@/utils/admin/produtos/produtoFormEstado";
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import { useRouter } from "vue-router";
import ProdutoForm from "./ProdutoForm.vue";

// Casca da tela `/admin/produtos/novo`: carga das opções, regra do seletor de
// fornecedor por perfil e envio dos arquivos depois de gravar (design D5, D6
// e D9). O `POST /produtos` é feito pelo `ProdutoForm`, que emite `saved`;
// daí amostras e fotos sobem um arquivo por vez. O envio dos arquivos e as
// opções dos seletores ficam em `useProdutoTela`.

const router = useRouter();

const DESTINO_URL = "/admin";

const form = ref<ProductFormState>(createEmptyForm());

const { categories, suppliers, supplierLocked, noSupplier, carregarListas } =
  useProdutoOpcoes();
const loadingOptions = ref(true);
const optionsError = ref<string | null>(null);

const createdProduct = ref<ProductDto | null>(null);
// O formulário expõe `mostrarPainelEnvio`; o envio chama ao começar.
const layout = useTemplateRef<{ mostrarPainelEnvio: () => void }>("layout");

const {
  uploading,
  totalFiles,
  doneFiles,
  failedFiles,
  progressPercent,
  iniciarEnvio,
  tentarAmostraDeNovo,
  tentarFotoDeNovo,
  concluirAssimMesmo,
} = useProdutoEnvioArquivos({
  form,
  produto: () => createdProduct.value,
  produtoRotulo: "cadastrado",
  mensagemSucesso: "Produto cadastrado com sucesso!",
  prefixoAviso: "Produto cadastrado",
  destino: DESTINO_URL,
  mostrarPainel: () => layout.value?.mostrarPainelEnvio(),
});

// Produto criado: o formulário trava e só os arquivos podem ser reenviados.
const locked = computed(() => createdProduct.value !== null);
const painelTitulo = computed(
  () => `Produto "${createdProduct.value?.name}" cadastrado`,
);

// ---------------------------------------------------------------------------
// Carga das opções (D9)
// ---------------------------------------------------------------------------

async function carregarOpcoes() {
  loadingOptions.value = true;
  optionsError.value = null;

  try {
    await carregarListas();

    if (supplierLocked.value) {
      form.value.supplierId = suppliers.value[0].id;
    } else if (
      form.value.supplierId &&
      !suppliers.value.some((supplier) => supplier.id === form.value.supplierId)
    ) {
      form.value.supplierId = "";
    }
  } catch (err: unknown) {
    optionsError.value = apiErrorMessage(
      err,
      "Não foi possível carregar categorias e fornecedores.",
    );
  } finally {
    loadingOptions.value = false;
  }
}

// ---------------------------------------------------------------------------
// Depois do `POST`: ids das variações e envio dos arquivos (D5, D6)
// ---------------------------------------------------------------------------

async function handleSaved(product: ProductDto) {
  createdProduct.value = product;
  const variationIds = resolveVariationIds(form.value.variations, product);
  for (const variation of form.value.variations) {
    variation.id = variationIds.get(variation.key) ?? null;
  }

  await iniciarEnvio();
}

function handleCancel() {
  router.push(DESTINO_URL);
}

onMounted(() => {
  carregarOpcoes();
});

onBeforeUnmount(() => {
  revokeFormObjectUrls(form.value);
});
</script>

<template>
  <ProdutoForm
    ref="layout"
    v-model:form="form"
    modo="novo"
    :loading="loadingOptions"
    :load-error="optionsError"
    :categories="categories"
    :suppliers="suppliers"
    :supplier-locked="supplierLocked"
    :no-supplier="noSupplier"
    :locked="locked"
    :upload-phase="createdProduct !== null"
    :busy="uploading"
    :envio-titulo="painelTitulo"
    :uploading="uploading"
    :total-files="totalFiles"
    :done-files="doneFiles"
    :failed-files="failedFiles"
    :progress-percent="progressPercent"
    @saved="handleSaved"
    @cancel="handleCancel"
    @retry="carregarOpcoes"
    @concluir="concluirAssimMesmo"
    @retry-sample="tentarAmostraDeNovo"
    @retry-photo="tentarFotoDeNovo"
  />
</template>
