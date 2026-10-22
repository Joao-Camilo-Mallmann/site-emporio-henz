<script setup lang="ts">
import { categoriasApi, fornecedoresApi, produtosApi } from "@/api";
import { useToast } from "@/composables/useToast";
import { useAuthStore } from "@/stores/auth";
import type {
  FieldErrors,
  ICategory,
  ISupplier,
  PhotoFormItem,
  ProductCreatePayload,
  ProductFormState,
  ProductDto,
  ProductImageDto,
  VariationFormItem,
} from "@/types";
import { Icon } from "@iconify/vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProdutoForm from "./ProdutoForm.vue";
import {
  FIELD_IDS,
} from "@/utils/produtos/produtoFormConstantes";
import {
  createEmptyForm,
  formFromProduct,
  listUploadStates,
  resolveVariationIds,
  revokeFormObjectUrls,
} from "@/utils/produtos/produtoFormEstado";

// Casca da tela `/admin/produtos/:id/editar`. Reaproveita o `ProdutoForm` do
// cadastro: carrega o produto no formulário, grava com `PUT /produtos/:id` e
// envia os arquivos novos em sequência, um por requisição.
//
// Fotos e amostras não entram no corpo do `PUT`: excluir uma foto publicada
// ou a amostra de uma variação é uma chamada imediata à API, como no contrato
// da collection Bruno.

const route = useRoute();
const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const LISTA_URL = "/admin/produtos";

const productId = computed(() => String(route.params.id ?? ""));

const form = ref<ProductFormState>(createEmptyForm());
const product = ref<ProductDto | null>(null);
const existingImages = ref<ProductImageDto[]>([]);

const categories = ref<ICategory[]>([]);
const suppliers = ref<ISupplier[]>([]);
const loading = ref(true);
const loadError = ref<string | null>(null);
const notFound = ref(false);

const saving = ref(false);
const saved = ref(false);
const uploading = ref(false);
const errorMessage = ref<string | null>(null);
const serverErrors = ref<FieldErrors>({});
const uploadPanelRef = ref<HTMLElement | null>(null);

// Exclusões com confirmação: foto publicada, amostra publicada ou o produto.
type PendingRemoval =
  | { kind: "image"; imageId: string }
  | { kind: "sample"; variationKey: string }
  | { kind: "product" };

const pendingRemoval = ref<PendingRemoval | null>(null);
const removing = ref(false);

const isVendedor = computed(() => authStore.isVendedor);
const supplierLocked = computed(
  () => isVendedor.value && suppliers.value.length === 1,
);
const noSupplier = computed(
  () => isVendedor.value && suppliers.value.length === 0,
);

const locked = computed(() => saving.value || saved.value);

const uploadStates = computed(() => listUploadStates(form.value));
const totalFiles = computed(() => uploadStates.value.length);
const doneFiles = computed(
  () => uploadStates.value.filter((state) => state === "done").length,
);
const failedFiles = computed(
  () => uploadStates.value.filter((state) => state === "error").length,
);
const progressPercent = computed(() =>
  totalFiles.value === 0
    ? 100
    : Math.round((doneFiles.value / totalFiles.value) * 100),
);

const removalModalTitle = computed(() => {
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

function apiErrorMessage(err: unknown, fallback: string): string {
  const errorObj = err as {
    response?: { data?: { message?: string | string[] } };
    message?: string;
  };
  const message = errorObj.response?.data?.message;
  if (Array.isArray(message)) return message.join(" ");
  return message || errorObj.message || fallback;
}

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
    const [loaded, categoriesResponse, suppliersResponse] = await Promise.all([
      produtosApi.buscarDetalhe(productId.value),
      categoriasApi.listar({ limit: 100, active: true }),
      fornecedoresApi.listar({ limit: 100, active: true }),
    ]);

    // Com token de Admin a API inclui inativos: filtra no cliente também.
    categories.value = categoriesResponse.data
      .filter((category) => category.active)
      .map((category) => ({
        ...category,
        subtypes: (category.subtypes ?? []).filter((subtype) => subtype.active),
      }));
    suppliers.value = suppliersResponse.data.filter(
      (supplier) => supplier.active,
    );

    aplicarProduto(loaded);

    // O fornecedor atual pode estar inativo ou fora da página carregada: sem
    // ele na lista o seletor ficaria vazio e o `PUT` trocaria o fornecedor.
    if (
      form.value.supplierId &&
      !suppliers.value.some((supplier) => supplier.id === form.value.supplierId)
    ) {
      try {
        suppliers.value = [
          await fornecedoresApi.buscarPorId(form.value.supplierId),
          ...suppliers.value,
        ];
      } catch {
        form.value.supplierId = "";
      }
    }
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

async function handleSubmit(payload: ProductCreatePayload) {
  if (locked.value || !product.value) return;

  saving.value = true;
  errorMessage.value = null;
  serverErrors.value = {};

  let updated: ProductDto;
  try {
    updated = await produtosApi.atualizar(product.value.id, payload);
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } }).response?.status;
    if (status === 409) {
      serverErrors.value = {
        [FIELD_IDS.slug]: apiErrorMessage(
          err,
          "Já existe um produto com este slug. Escolha outro.",
        ),
      };
    } else {
      errorMessage.value = apiErrorMessage(
        err,
        "Ocorreu um erro ao salvar as alterações.",
      );
    }
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

  if (totalFiles.value > 0) {
    nextTick(() =>
      uploadPanelRef.value?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      }),
    );
  }

  await enviarArquivos();
}

async function enviarAmostra(variation: VariationFormItem) {
  const sample = variation.sample;
  const current = product.value;
  if (!sample || !current) return;

  if (!variation.id) {
    sample.uploadState = "error";
    sample.uploadError = "A variação não foi encontrada no produto salvo.";
    return;
  }

  sample.uploadState = "uploading";
  sample.uploadError = undefined;
  try {
    const updated = await produtosApi.enviarAmostra(
      current.id,
      variation.id,
      sample.file,
    );
    sample.uploadedUrl = updated.sampleImageUrl;
    variation.existingSampleUrl = updated.sampleImageUrl;
    sample.uploadState = "done";
  } catch (err: unknown) {
    sample.uploadState = "error";
    sample.uploadError = apiErrorMessage(
      err,
      "Não foi possível enviar a amostra.",
    );
  }
}

async function enviarFoto(photo: PhotoFormItem) {
  const current = product.value;
  if (!current) return;

  let variationId: string | null = null;
  if (photo.variationKey) {
    const variation = form.value.variations.find(
      (item) => item.key === photo.variationKey,
    );
    if (!variation?.id) {
      photo.uploadState = "error";
      photo.uploadError =
        "A variação desta foto não foi encontrada no produto salvo.";
      return;
    }
    variationId = variation.id;
  }

  photo.uploadState = "uploading";
  photo.uploadError = undefined;
  try {
    photo.uploaded = await produtosApi.enviarFoto(
      current.id,
      photo.file,
      variationId,
    );
    photo.uploadState = "done";
  } catch (err: unknown) {
    photo.uploadState = "error";
    photo.uploadError = apiErrorMessage(err, "Não foi possível enviar a foto.");
  }
}

/** Amostras e depois fotos, uma requisição por vez (sem `Promise.all`). */
async function enviarArquivos() {
  uploading.value = true;
  try {
    for (const variation of form.value.variations) {
      if (variation.sample && variation.sample.uploadState !== "done") {
        await enviarAmostra(variation);
      }
    }
    for (const photo of form.value.photos) {
      if (photo.uploadState !== "done") {
        await enviarFoto(photo);
      }
    }
  } finally {
    uploading.value = false;
  }
  concluirSeCompleto();
}

function concluirSeCompleto() {
  if (failedFiles.value > 0 || doneFiles.value < totalFiles.value) return;
  toast.success("Produto atualizado com sucesso!");
  router.push(LISTA_URL);
}

async function tentarAmostraDeNovo(variationKey: string) {
  if (uploading.value) return;
  const variation = form.value.variations.find(
    (item) => item.key === variationKey,
  );
  if (!variation) return;

  uploading.value = true;
  try {
    await enviarAmostra(variation);
  } finally {
    uploading.value = false;
  }
  concluirSeCompleto();
}

async function tentarFotoDeNovo(photoKey: string) {
  if (uploading.value) return;
  const photo = form.value.photos.find((item) => item.key === photoKey);
  if (!photo) return;

  uploading.value = true;
  try {
    await enviarFoto(photo);
  } finally {
    uploading.value = false;
  }
  concluirSeCompleto();
}

function concluirAssimMesmo() {
  const pending = totalFiles.value - doneFiles.value;
  toast.warning(
    pending === 1
      ? "Produto atualizado, mas 1 arquivo não foi enviado."
      : `Produto atualizado, mas ${pending} arquivos não foram enviados.`,
  );
  router.push(LISTA_URL);
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
  <div class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Breadcrumbs e cabeçalho -->
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
            <UiButton
              variant="custom"
              size="none"
              class="font-normal hover:text-neutral-dark transition-colors"
              @click="router.push('/admin')"
            >
              Painel
            </UiButton>
            <span>/</span>
            <UiButton
              variant="custom"
              size="none"
              class="font-normal hover:text-neutral-dark transition-colors"
              @click="router.push(LISTA_URL)"
            >
              Produtos
            </UiButton>
            <span>/</span>
            <span class="text-neutral-dark font-medium">Editar</span>
          </div>

          <h1 class="text-2xl font-bold text-neutral-dark tracking-tight truncate">
            {{ product?.name || "Editar Produto" }}
          </h1>
          <p class="text-sm text-stone-500 mt-0.5">
            Altere os dados do móvel, as variações, as fotos e a ficha técnica
          </p>
        </div>

        <div v-if="product" class="flex items-center gap-2 shrink-0">
          <span
            class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
            :class="
              product.active
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-stone-100 text-stone-500'
            "
          >
            <span
              class="w-1.5 h-1.5 rounded-full"
              :class="product.active ? 'bg-emerald-500' : 'bg-stone-400'"
            ></span>
            {{ product.active ? "Ativo" : "Inativo" }}
          </span>

          <UiButton
            v-if="product.active"
            variant="outline"
            size="sm"
            class="text-rose-600 border-rose-200 hover:bg-rose-50"
            :disabled="locked || uploading"
            @click="pedirDesativacao"
          >
            <Icon icon="mdi:trash-can-outline" class="w-4 h-4" />
            Desativar
          </UiButton>
        </div>
      </div>

      <!-- Carregando -->
      <div
        v-if="loading"
        class="bg-white rounded-xl border border-stone-200 py-12 flex flex-col items-center justify-center text-stone-500 gap-2.5"
      >
        <div
          class="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"
        ></div>
        <span class="text-xs">Carregando produto...</span>
      </div>

      <!-- Produto inexistente -->
      <div
        v-else-if="notFound"
        class="py-14 bg-white rounded-xl border border-stone-200 text-center px-4"
      >
        <div
          class="w-12 h-12 rounded-lg bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3"
        >
          <Icon icon="mdi:package-variant-closed-remove" class="w-6 h-6" />
        </div>
        <h2 class="text-sm font-semibold text-neutral-dark">
          Produto não encontrado
        </h2>
        <p class="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          O produto pode ter sido desativado ou pertencer a outro fornecedor.
        </p>
        <UiButton
          variant="secondary"
          size="sm"
          class="mt-3.5"
          @click="router.push(LISTA_URL)"
        >
          Voltar para a lista
        </UiButton>
      </div>

      <!-- Erro de carga -->
      <div
        v-else-if="loadError"
        role="alert"
        class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="flex items-center gap-2.5">
          <Icon
            icon="mdi:alert-circle-outline"
            class="w-5 h-5 text-rose-500 shrink-0"
          />
          <span>{{ loadError }}</span>
        </div>
        <div class="flex items-center gap-2">
          <UiButton variant="danger" size="sm" @click="carregarTela">
            Tentar de novo
          </UiButton>
          <UiButton variant="outline" size="sm" @click="handleCancel">
            Voltar para a lista
          </UiButton>
        </div>
      </div>

      <ProdutoForm
        v-else
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
      >
        <template #after>
          <!-- Painel de envio dos arquivos novos (depois do PUT) -->
          <div
            v-if="saved"
            ref="uploadPanelRef"
            class="rounded-xl border bg-white p-5 sm:p-6 shadow-xs space-y-4"
            :class="
              !uploading && failedFiles > 0
                ? 'border-amber-300'
                : 'border-stone-200'
            "
            aria-live="polite"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                :class="
                  !uploading && failedFiles > 0
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-emerald-50 text-emerald-600'
                "
              >
                <Icon
                  :icon="
                    !uploading && failedFiles > 0
                      ? 'mdi:alert-circle-outline'
                      : 'mdi:check-circle-outline'
                  "
                  class="w-5 h-5"
                />
              </div>
              <div class="min-w-0 flex-1">
                <h2 class="text-sm font-semibold text-neutral-dark">
                  Alterações de "{{ product?.name }}" salvas
                </h2>
                <p v-if="uploading" class="text-xs text-stone-500 mt-0.5">
                  Enviando arquivos: {{ doneFiles }} de {{ totalFiles }}. Não
                  feche esta página até o envio terminar.
                </p>
                <p
                  v-else-if="failedFiles > 0"
                  class="text-xs text-stone-600 mt-0.5"
                >
                  {{
                    failedFiles === 1
                      ? "1 arquivo não foi enviado."
                      : `${failedFiles} arquivos não foram enviados.`
                  }}
                  Use "Tentar de novo" no arquivo com erro ou conclua assim
                  mesmo e complete as fotos em outra edição.
                </p>
                <p v-else class="text-xs text-stone-500 mt-0.5">
                  Todos os arquivos foram enviados.
                </p>
              </div>
            </div>

            <div
              v-if="totalFiles > 0"
              class="h-2 w-full overflow-hidden rounded-full bg-stone-100"
              role="progressbar"
              :aria-valuenow="doneFiles"
              aria-valuemin="0"
              :aria-valuemax="totalFiles"
              :aria-label="`Arquivos enviados: ${doneFiles} de ${totalFiles}`"
            >
              <div
                class="h-full rounded-full bg-secondary transition-all duration-300"
                :style="{ width: `${progressPercent}%` }"
              ></div>
            </div>

            <div v-if="!uploading && failedFiles > 0" class="flex justify-end">
              <UiButton variant="primary" size="md" @click="concluirAssimMesmo">
                Concluir assim mesmo
              </UiButton>
            </div>
          </div>
        </template>
      </ProdutoForm>
    </div>

    <!-- Confirmação das exclusões imediatas -->
    <UiModal
      :open="pendingRemoval !== null"
      :title="removalModalTitle"
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
  </div>
</template>
