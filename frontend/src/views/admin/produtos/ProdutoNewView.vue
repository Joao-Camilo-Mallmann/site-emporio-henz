<script setup lang="ts">
import { produtosApi } from "@/api";
import {
  erroDeGravacao,
  useProdutoEnvioArquivos,
  useProdutoOpcoes,
} from "@/composables/useProdutoTela";
import type { FieldErrors, ProductFormState, ProductDto } from "@/types";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import { useRouter } from "vue-router";
import ProdutoForm from "./ProdutoForm.vue";
import {
  apiErrorMessage,
  FIELD_IDS,
} from "@/utils/produtos/produtoFormConstantes";
import {
  createEmptyForm,
  resolveVariationIds,
  revokeFormObjectUrls,
  toCreatePayload,
} from "@/utils/produtos/produtoFormEstado";

// Casca da tela `/admin/produtos/novo`: carga das opções, regra do seletor de
// fornecedor por perfil e gravação em etapas (design D5, D6 e D9):
// POST /produtos → amostras → fotos, um arquivo por vez. O envio dos arquivos
// e as opções dos seletores ficam em `useProdutoTela`.

const router = useRouter();

const DESTINO_URL = "/admin";

const form = ref<ProductFormState>(createEmptyForm());

const { categories, suppliers, supplierLocked, noSupplier, carregarListas } =
  useProdutoOpcoes();
const loadingOptions = ref(true);
const optionsError = ref<string | null>(null);

const saving = ref(false);
const errorMessage = ref<string | null>(null);
const serverErrors = ref<FieldErrors>({});
const createdProduct = ref<ProductDto | null>(null);
// A moldura expõe `mostrarPainelEnvio`; o envio chama ao começar.
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

const locked = computed(() => saving.value || createdProduct.value !== null);
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
// Gravação em etapas (D5, D6)
// ---------------------------------------------------------------------------

async function handleSubmit() {
  if (locked.value) return;

  saving.value = true;
  errorMessage.value = null;
  serverErrors.value = {};

  let product: ProductDto;
  try {
    product = await produtosApi.criar(toCreatePayload(form.value));
  } catch (err: unknown) {
    const erro = erroDeGravacao(err, "Ocorreu um erro ao cadastrar o produto.");
    serverErrors.value = erro.serverErrors;
    errorMessage.value = erro.errorMessage;
    saving.value = false;
    return;
  }

  // Produto criado: a partir daqui o formulário fica travado e só os
  // arquivos podem ser reenviados (reenviar o POST daria 409 pelo slug).
  createdProduct.value = product;
  const variationIds = resolveVariationIds(form.value.variations, product);
  for (const variation of form.value.variations) {
    variation.id = variationIds.get(variation.key) ?? null;
  }
  saving.value = false;

  await iniciarEnvio();
}

function handleCancel() {
  router.push(DESTINO_URL);
}

// O erro de slug duplicado some quando o usuário edita o slug.
watch(
  () => form.value.slug,
  () => {
    if (serverErrors.value[FIELD_IDS.slug]) serverErrors.value = {};
  },
);

onMounted(() => {
  carregarOpcoes();
});

onBeforeUnmount(() => {
  revokeFormObjectUrls(form.value);
});
</script>

<template>
  <ProdutoTelaLayout
    ref="layout"
    modo="novo"
    :loading="loadingOptions"
    loading-label="Carregando categorias e fornecedores..."
    :error="optionsError"
    voltar-label="Voltar ao painel"
    :envio-visivel="createdProduct !== null"
    :envio-titulo="painelTitulo"
    envio-orientacao-falha="complete as fotos depois, na edição do produto."
    :uploading="uploading"
    :total-files="totalFiles"
    :done-files="doneFiles"
    :failed-files="failedFiles"
    :progress-percent="progressPercent"
    @retry="carregarOpcoes"
    @voltar="handleCancel"
    @concluir="concluirAssimMesmo"
  >
    <ProdutoForm
      v-model:form="form"
      :categories="categories"
      :suppliers="suppliers"
      :supplier-locked="supplierLocked"
      :no-supplier="noSupplier"
      :locked="locked"
      :upload-phase="createdProduct !== null"
      :saving="saving"
      :busy="uploading"
      :error-message="errorMessage"
      :server-errors="serverErrors"
      @submit="handleSubmit"
      @cancel="handleCancel"
      @retry-sample="tentarAmostraDeNovo"
      @retry-photo="tentarFotoDeNovo"
    />
  </ProdutoTelaLayout>
</template>
