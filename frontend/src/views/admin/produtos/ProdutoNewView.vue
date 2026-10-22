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
  VariationFormItem,
} from "@/types";
import { Icon } from "@iconify/vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import ProdutoForm from "./ProdutoForm.vue";
import {
  FIELD_IDS,
} from "@/utils/produtos/produtoFormConstantes";
import {
  createEmptyForm,
  listUploadStates,
  resolveVariationIds,
  revokeFormObjectUrls,
} from "@/utils/produtos/produtoFormEstado";

// Casca da tela `/admin/produtos/novo`: carga das opções, regra do seletor de
// fornecedor por perfil e gravação em etapas (design D5, D6 e D9):
// POST /produtos → amostras → fotos, um arquivo por vez.

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const form = ref<ProductFormState>(createEmptyForm());

const categories = ref<ICategory[]>([]);
const suppliers = ref<ISupplier[]>([]);
const loadingOptions = ref(true);
const optionsError = ref<string | null>(null);

const saving = ref(false);
const errorMessage = ref<string | null>(null);
const serverErrors = ref<FieldErrors>({});
const createdProduct = ref<ProductDto | null>(null);
const uploading = ref(false);
const uploadPanelRef = ref<HTMLElement | null>(null);

const isVendedor = computed(() => authStore.isVendedor);
const supplierLocked = computed(
  () => isVendedor.value && suppliers.value.length === 1,
);
const noSupplier = computed(
  () => isVendedor.value && suppliers.value.length === 0,
);

const locked = computed(() => saving.value || createdProduct.value !== null);

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
// Carga das opções (D9)
// ---------------------------------------------------------------------------

async function carregarOpcoes() {
  loadingOptions.value = true;
  optionsError.value = null;

  try {
    const [categoriesResponse, suppliersResponse] = await Promise.all([
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
    suppliers.value = suppliersResponse.data.filter((supplier) => supplier.active);

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

async function handleSubmit(payload: ProductCreatePayload) {
  if (locked.value) return;

  saving.value = true;
  errorMessage.value = null;
  serverErrors.value = {};

  let product: ProductDto;
  try {
    product = await produtosApi.criar(payload);
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
        "Ocorreu um erro ao cadastrar o produto.",
      );
    }
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

  if (totalFiles.value > 0) {
    nextTick(() =>
      uploadPanelRef.value?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  }

  await enviarArquivos();
}

async function enviarAmostra(variation: VariationFormItem) {
  const sample = variation.sample;
  const product = createdProduct.value;
  if (!sample || !product) return;

  if (!variation.id) {
    sample.uploadState = "error";
    sample.uploadError = "A variação não foi encontrada no produto cadastrado.";
    return;
  }

  sample.uploadState = "uploading";
  sample.uploadError = undefined;
  try {
    const updated = await produtosApi.enviarAmostra(
      product.id,
      variation.id,
      sample.file,
    );
    sample.uploadedUrl = updated.sampleImageUrl;
    sample.uploadState = "done";
  } catch (err: unknown) {
    sample.uploadState = "error";
    sample.uploadError = apiErrorMessage(err, "Não foi possível enviar a amostra.");
  }
}

async function enviarFoto(photo: PhotoFormItem) {
  const product = createdProduct.value;
  if (!product) return;

  let variationId: string | null = null;
  if (photo.variationKey) {
    const variation = form.value.variations.find(
      (item) => item.key === photo.variationKey,
    );
    if (!variation?.id) {
      photo.uploadState = "error";
      photo.uploadError = "A variação desta foto não foi encontrada no produto cadastrado.";
      return;
    }
    variationId = variation.id;
  }

  photo.uploadState = "uploading";
  photo.uploadError = undefined;
  try {
    photo.uploaded = await produtosApi.enviarFoto(product.id, photo.file, variationId);
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
  toast.success("Produto cadastrado com sucesso!");
  router.push("/admin");
}

async function tentarAmostraDeNovo(variationKey: string) {
  if (uploading.value) return;
  const variation = form.value.variations.find((item) => item.key === variationKey);
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
      ? "Produto cadastrado, mas 1 arquivo não foi enviado."
      : `Produto cadastrado, mas ${pending} arquivos não foram enviados.`,
  );
  router.push("/admin");
}

function handleCancel() {
  router.push("/admin");
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
  <div class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Breadcrumbs e cabeçalho -->
      <div>
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
          <span>Produtos</span>
          <span>/</span>
          <span class="text-neutral-dark font-medium">Novo Produto</span>
        </div>

        <h1 class="text-2xl font-bold text-neutral-dark tracking-tight">
          Novo Produto
        </h1>
        <p class="text-sm text-stone-500 mt-0.5">
          Cadastre o móvel com variações de acabamento, fotos e ficha técnica
        </p>
      </div>

      <!-- Carregando opções -->
      <div
        v-if="loadingOptions"
        class="bg-white rounded-xl border border-stone-200 py-12 flex flex-col items-center justify-center text-stone-500 gap-2.5"
      >
        <div
          class="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"
        ></div>
        <span class="text-xs">Carregando categorias e fornecedores...</span>
      </div>

      <!-- Erro ao carregar opções -->
      <div
        v-else-if="optionsError"
        role="alert"
        class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="flex items-center gap-2.5">
          <Icon icon="mdi:alert-circle-outline" class="w-5 h-5 text-rose-500 shrink-0" />
          <span>{{ optionsError }}</span>
        </div>
        <div class="flex items-center gap-2">
          <UiButton variant="danger" size="sm" @click="carregarOpcoes">
            Tentar de novo
          </UiButton>
          <UiButton variant="outline" size="sm" @click="handleCancel">
            Voltar ao painel
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
        :upload-phase="createdProduct !== null"
        :saving="saving"
        :busy="uploading"
        :error-message="errorMessage"
        :server-errors="serverErrors"
        @submit="handleSubmit"
        @cancel="handleCancel"
        @retry-sample="tentarAmostraDeNovo"
        @retry-photo="tentarFotoDeNovo"
      >
        <template #after>
          <!-- Painel de envio dos arquivos (depois do 201) -->
          <div
            v-if="createdProduct"
            ref="uploadPanelRef"
            class="rounded-xl border bg-white p-5 sm:p-6 shadow-xs space-y-4"
            :class="!uploading && failedFiles > 0 ? 'border-amber-300' : 'border-stone-200'"
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
                  :icon="!uploading && failedFiles > 0 ? 'mdi:alert-circle-outline' : 'mdi:check-circle-outline'"
                  class="w-5 h-5"
                />
              </div>
              <div class="min-w-0 flex-1">
                <h2 class="text-sm font-semibold text-neutral-dark">
                  Produto "{{ createdProduct.name }}" cadastrado
                </h2>
                <p v-if="uploading" class="text-xs text-stone-500 mt-0.5">
                  Enviando arquivos: {{ doneFiles }} de {{ totalFiles }}. Não feche
                  esta página até o envio terminar.
                </p>
                <p v-else-if="failedFiles > 0" class="text-xs text-stone-600 mt-0.5">
                  {{
                    failedFiles === 1
                      ? "1 arquivo não foi enviado."
                      : `${failedFiles} arquivos não foram enviados.`
                  }}
                  Use "Tentar de novo" no arquivo com erro ou conclua assim mesmo e
                  complete as fotos depois, na edição do produto.
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
  </div>
</template>
