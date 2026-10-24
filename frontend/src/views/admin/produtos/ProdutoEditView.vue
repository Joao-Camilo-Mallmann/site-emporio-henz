<script setup lang="ts">
import { produtosApi } from "@/api";
import {
  erroDeGravacao,
  useProdutoEnvioArquivos,
  useProdutoOpcoes,
} from "@/composables/useProdutoTela";
import { useToast } from "@/composables/useToast";
import type {
  FieldErrors,
  ProductFormState,
  ProductDto,
  ProductImageDto,
} from "@/types";
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  useTemplateRef,
  watch,
} from "vue";
import { useRoute, useRouter } from "vue-router";
import ProdutoForm from "./ProdutoForm.vue";
import {
  apiErrorMessage,
  FIELD_IDS,
} from "@/utils/produtos/produtoFormConstantes";
import {
  createEmptyForm,
  formFromProduct,
  resolveVariationIds,
  revokeFormObjectUrls,
  toUpdatePayload,
} from "@/utils/produtos/produtoFormEstado";

// Casca da tela `/admin/produtos/:id/editar`. Reaproveita o `ProdutoForm` do
// cadastro: carrega o produto no formulário, grava com `PUT /produtos/:id` e
// envia os arquivos novos em sequência, um por requisição
// (`useProdutoTela`).
//
// Fotos e amostras não entram no corpo do `PUT`: excluir uma foto publicada
// ou a amostra de uma variação é uma chamada imediata à API, como no contrato
// da collection Bruno.

const route = useRoute();
const router = useRouter();
const toast = useToast();

const LISTA_URL = "/admin/produtos";

const productId = computed(() => String(route.params.id ?? ""));

const form = ref<ProductFormState>(createEmptyForm());
const product = ref<ProductDto | null>(null);
const existingImages = ref<ProductImageDto[]>([]);

const {
  categories,
  suppliers,
  supplierLocked,
  noSupplier,
  carregarListas,
  garantirSelecionados,
} = useProdutoOpcoes();
const loading = ref(true);
const loadError = ref<string | null>(null);
const notFound = ref(false);

const saving = ref(false);
const saved = ref(false);
const errorMessage = ref<string | null>(null);
const serverErrors = ref<FieldErrors>({});
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
  produto: () => product.value,
  produtoRotulo: "salvo",
  mensagemSucesso: "Produto atualizado com sucesso!",
  prefixoAviso: "Produto atualizado",
  destino: LISTA_URL,
  // A amostra nova passa a ser a amostra publicada da variação.
  aoEnviarAmostra: (variation, url) => {
    variation.existingSampleUrl = url;
  },
  mostrarPainel: () => layout.value?.mostrarPainelEnvio(),
});

// Exclusões com confirmação: foto publicada, amostra publicada ou o produto.
type PendingRemoval =
  | { kind: "image"; imageId: string }
  | { kind: "sample"; variationKey: string }
  | { kind: "product" };

const pendingRemoval = ref<PendingRemoval | null>(null);
const removing = ref(false);

const locked = computed(() => saving.value || saved.value);
const painelTitulo = computed(
  () => `Alterações de "${product.value?.name}" salvas`,
);
const tituloRemocao = computed(() => {
  switch (pendingRemoval.value?.kind) {
    case "image":
      return "Excluir foto";
    case "sample":
      return "Remover amostra";
    case "product":
      return "Desativar produto";
    default:
      return "";
  }
});

// ---------------------------------------------------------------------------
// Carga do produto e das opções
// ---------------------------------------------------------------------------

function aplicarProduto(loaded: ProductDto) {
  product.value = loaded;
  existingImages.value = [...(loaded.images ?? [])].sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
  revokeFormObjectUrls(form.value);
  form.value = formFromProduct(loaded);
}

async function carregarTela() {
  if (!productId.value) {
    notFound.value = true;
    loading.value = false;
    return;
  }

  loading.value = true;
  loadError.value = null;
  notFound.value = false;

  try {
    const [loaded] = await Promise.all([
      produtosApi.buscarDetalhe(productId.value),
      carregarListas(),
    ]);
    aplicarProduto(loaded);

    // Categoria, subtipo ou fornecedor do produto podem estar inativos ou
    // fora da página carregada: voltam à lista para o seletor não ficar vazio
    // nem a validação recusar o próprio produto.
    const fornecedorOk = await garantirSelecionados(form.value);
    if (!fornecedorOk) form.value.supplierId = "";
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 404) {
      notFound.value = true;
    } else {
      loadError.value = apiErrorMessage(
        err,
        "Não foi possível carregar o produto.",
      );
    }
  } finally {
    loading.value = false;
  }
}

// ---------------------------------------------------------------------------
// Gravação: PUT e depois os arquivos novos
// ---------------------------------------------------------------------------

async function handleSubmit() {
  if (locked.value || !product.value) return;

  saving.value = true;
  errorMessage.value = null;
  serverErrors.value = {};

  let updated: ProductDto;
  try {
    updated = await produtosApi.atualizar(
      product.value.id,
      toUpdatePayload(form.value),
    );
  } catch (err: unknown) {
    const erro = erroDeGravacao(err, "Ocorreu um erro ao salvar as alterações.");
    serverErrors.value = erro.serverErrors;
    errorMessage.value = erro.errorMessage;
    saving.value = false;
    return;
  }

  // Produto salvo: o formulário trava e só os arquivos novos seguem.
  product.value = { ...product.value, ...updated };
  saved.value = true;

  // As variações novas ganharam `id` no `PUT`; as antigas mantiveram o seu.
  const variationIds = resolveVariationIds(form.value.variations, updated);
  for (const variation of form.value.variations) {
    variation.id = variationIds.get(variation.key) ?? variation.id;
  }
  saving.value = false;

  await iniciarEnvio();
}

// ---------------------------------------------------------------------------
// Exclusões imediatas (foto, amostra e produto)
// ---------------------------------------------------------------------------

function pedirExclusaoFoto(imageId: string) {
  pendingRemoval.value = { kind: "image", imageId };
}

function pedirExclusaoAmostra(variationKey: string) {
  pendingRemoval.value = { kind: "sample", variationKey };
}

function pedirDesativacao() {
  pendingRemoval.value = { kind: "product" };
}

function fecharModalRemocao() {
  if (removing.value) return;
  pendingRemoval.value = null;
}

async function removerFoto(imageId: string) {
  const current = product.value;
  if (!current) return;
  await produtosApi.removerFoto(current.id, imageId);
  existingImages.value = existingImages.value.filter(
    (image) => image.id !== imageId,
  );
  toast.info("Foto removida do produto.");
}

async function removerAmostra(variationKey: string) {
  const current = product.value;
  const variation = form.value.variations.find(
    (item) => item.key === variationKey,
  );
  if (!current || !variation) return;

  // Variação ainda não gravada: a amostra só existe no navegador.
  if (!variation.id) {
    variation.existingSampleUrl = null;
    return;
  }

  await produtosApi.removerAmostra(current.id, variation.id);
  variation.existingSampleUrl = null;
  toast.info("Amostra removida da variação.");
}

async function desativarProduto() {
  const current = product.value;
  if (!current) return;
  await produtosApi.deletar(current.id);
  toast.info("Produto desativado com sucesso.");
  router.push(LISTA_URL);
}

async function confirmarRemocao() {
  const pending = pendingRemoval.value;
  if (!pending) return;

  removing.value = true;
  try {
    if (pending.kind === "image") {
      await removerFoto(pending.imageId);
    } else if (pending.kind === "sample") {
      await removerAmostra(pending.variationKey);
    } else {
      await desativarProduto();
    }
    pendingRemoval.value = null;
  } catch (err: unknown) {
    toast.error(apiErrorMessage(err, "Não foi possível concluir a exclusão."));
  } finally {
    removing.value = false;
  }
}

function handleCancel() {
  router.push(LISTA_URL);
}

// O erro de slug duplicado some quando o usuário edita o slug.
watch(
  () => form.value.slug,
  () => {
    if (serverErrors.value[FIELD_IDS.slug]) serverErrors.value = {};
  },
);

onMounted(() => {
  carregarTela();
});

onBeforeUnmount(() => {
  revokeFormObjectUrls(form.value);
});
</script>

<template>
  <ProdutoTelaLayout
    ref="layout"
    modo="editar"
    :produto="product"
    :lista-url="LISTA_URL"
    :bloqueado="locked || uploading"
    :loading="loading"
    loading-label="Carregando produto..."
    :not-found="notFound"
    :error="loadError"
    voltar-label="Voltar para a lista"
    :envio-visivel="saved"
    :envio-titulo="painelTitulo"
    envio-orientacao-falha="complete as fotos em outra edição."
    :uploading="uploading"
    :total-files="totalFiles"
    :done-files="doneFiles"
    :failed-files="failedFiles"
    :progress-percent="progressPercent"
    @retry="carregarTela"
    @voltar="handleCancel"
    @desativar="pedirDesativacao"
    @concluir="concluirAssimMesmo"
  >
    <ProdutoForm
      v-model:form="form"
      :categories="categories"
      :suppliers="suppliers"
      :supplier-locked="supplierLocked"
      :no-supplier="noSupplier"
      :locked="locked"
      :upload-phase="saved"
      :saving="saving"
      :busy="uploading || removing"
      :error-message="errorMessage"
      :server-errors="serverErrors"
      :existing-images="existingImages"
      submit-label="Salvar alterações"
      steps-unlocked
      @submit="handleSubmit"
      @cancel="handleCancel"
      @retry-sample="tentarAmostraDeNovo"
      @retry-photo="tentarFotoDeNovo"
      @remove-image="pedirExclusaoFoto"
      @remove-existing-sample="pedirExclusaoAmostra"
    />

    <!-- Confirmação das exclusões imediatas (foto, amostra ou produto) -->
    <UiModal
      :open="pendingRemoval !== null"
      :title="tituloRemocao"
      variant="danger"
      :loading="removing"
      @close="fecharModalRemocao"
      @confirm="confirmarRemocao"
    >
      <template v-if="pendingRemoval?.kind === 'image'">
        A foto sai do carrossel do produto assim que você confirmar, sem esperar
        o botão de salvar. Para repor, envie o arquivo de novo.
      </template>
      <template v-else-if="pendingRemoval?.kind === 'sample'">
        A amostra de textura desta variação será apagada agora, sem esperar o
        botão de salvar. Para repor, escolha um arquivo novo.
      </template>
      <template v-else>
        Deseja desativar
        <strong class="text-neutral-dark">{{ product?.name }}</strong
        >? O produto sai do catálogo e continua guardado no painel, com as
        variações e fotos.
      </template>
    </UiModal>
  </ProdutoTelaLayout>
</template>
