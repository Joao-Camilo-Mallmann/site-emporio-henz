<script setup lang="ts">
import { produtosApi } from "@/api";
import { erroDeGravacao } from "@/composables/useProdutoTela";
import type {
  FieldErrors,
  ICategory,
  ISupplier,
  ProductDto,
  ProductFormState,
  ProductImageDto,
} from "@/types";
import {
  FIELD_IDS,
  fieldStep,
  FORM_SECTIONS,
} from "@/utils/admin/produtos/produtoFormConstantes";
import {
  toCreatePayload,
  toUpdatePayload,
} from "@/utils/admin/produtos/produtoFormEstado";
import { validateForm } from "@/utils/admin/produtos/produtoFormValidacao";
import { Icon } from "@iconify/vue";
import { computed, nextTick, ref, useTemplateRef, watch } from "vue";

// Tela única de cadastro e edição de produto: cabeçalho, estados de carga,
// indicador de etapas fixo no topo, cartão da etapa atual, rodapé fixo e
// painel de envio dos arquivos. Cada etapa é um componente de
// `components/admin/produtos/etapas/`. É o dono do estado das etapas, da
// validação (que roda no navegador e leva ao primeiro campo com erro) e da
// gravação: `POST /produtos` no cadastro e `PUT /produtos/:id` na edição,
// com o erro de gravação (409 no slug, 400 e 403 no alerta geral). Depois
// emite `saved` com o produto gravado e a tela segue com o envio dos
// arquivos. Na fase de envio, todas as etapas ficam visíveis com o estado de
// cada arquivo.

const form = defineModel<ProductFormState>("form", { required: true });

const props = withDefaults(
  defineProps<{
    /** `editar` libera todas as etapas e mostra nome, status e "Desativar". */
    modo: "novo" | "editar";
    produto?: ProductDto | null;
    loading: boolean;
    notFound?: boolean;
    loadError?: string | null;
    categories: ICategory[];
    suppliers: ISupplier[];
    /** Vendedor com um único vínculo: fornecedor pré-selecionado e travado. */
    supplierLocked?: boolean;
    /** Vendedor sem vínculo: aviso e salvar desabilitado. */
    noSupplier?: boolean;
    /** Trava a edição (produto já gravado, só os arquivos seguem). */
    locked?: boolean;
    /** Produto gravado: mostra todas as etapas e o painel de envio. */
    uploadPhase?: boolean;
    /** Algum envio ou exclusão de arquivo em andamento. */
    busy?: boolean;
    existingImages?: ProductImageDto[];
    envioTitulo?: string;
    uploading?: boolean;
    totalFiles?: number;
    doneFiles?: number;
    failedFiles?: number;
    progressPercent?: number;
  }>(),
  {
    produto: null,
    notFound: false,
    loadError: null,
    supplierLocked: false,
    noSupplier: false,
    locked: false,
    uploadPhase: false,
    busy: false,
    existingImages: () => [],
    envioTitulo: "",
    uploading: false,
    totalFiles: 0,
    doneFiles: 0,
    failedFiles: 0,
    progressPercent: 0,
  },
);

const emit = defineEmits<{
  /** Produto gravado (`POST` ou `PUT`): a tela segue com os arquivos. */
  saved: [product: ProductDto];
  cancel: [];
  retry: [];
  desativar: [];
  /** "Concluir assim mesmo": segue com arquivos pendentes. */
  concluir: [];
  "retry-sample": [variationKey: string];
  "retry-photo": [photoKey: string];
  "remove-image": [imageId: string];
  "remove-existing-sample": [variationKey: string];
}>();

const editando = computed(() => props.modo === "editar");
const textos = computed(() =>
  editando.value
    ? {
        carregando: "Carregando produto...",
        voltar: "Voltar para a lista",
        salvar: "Salvar alterações",
        falha: "complete as fotos em outra edição.",
      }
    : {
        carregando: "Carregando categorias e fornecedores...",
        voltar: "Voltar ao painel",
        salvar: "Salvar produto",
        falha: "complete as fotos depois, na edição do produto.",
      },
);

const formRoot = useTemplateRef<HTMLFormElement>("formRoot");
const alertEl = useTemplateRef<HTMLElement>("alert");
const painelEl = useTemplateRef<HTMLElement>("painel");

// Gravação: estado do `POST`/`PUT` e os erros devolvidos pela API.
const saving = ref(false);
const errorMessage = ref<string | null>(null);
/** Erros por campo devolvidos pela API (ex.: slug duplicado). */
const serverErrors = ref<FieldErrors>({});
const travado = computed(() => props.locked || saving.value);

// `maxStep` é a etapa mais avançada já liberada; `attemptedSteps` são as
// etapas em que o usuário tentou avançar e que passam a mostrar os erros.
const currentStep = ref(0);
const maxStep = ref(0);
const attemptedSteps = ref<number[]>([]);
const stepTitles = FORM_SECTIONS.map((section) => section.title);
const isLastStep = computed(
  () => currentStep.value === FORM_SECTIONS.length - 1,
);

const subtypeOptions = computed(
  () =>
    props.categories.find((c) => c.id === form.value.categoryId)?.subtypes ??
    [],
);

// Uma validação por mudança do formulário, compartilhada pelos erros
// exibidos, pelo "Próximo" e pelo envio.
const allErrors = computed<FieldErrors>(() =>
  validateForm(form.value, {
    subtypeIds: subtypeOptions.value.map((s) => s.id),
  }),
);
const clientErrors = computed<FieldErrors>(() =>
  Object.fromEntries(
    Object.entries(allErrors.value).filter(([id]) =>
      attemptedSteps.value.includes(fieldStep(id)),
    ),
  ),
);
const errors = computed<FieldErrors>(() => ({
  ...serverErrors.value,
  ...clientErrors.value,
}));
const errorSteps = computed(() =>
  Object.keys(clientErrors.value).map(fieldStep),
);
const clientErrorCount = computed(
  () =>
    Object.keys(clientErrors.value).filter(
      (id) => fieldStep(id) === currentStep.value,
    ).length,
);
const comFalha = computed(() => !props.uploading && props.failedFiles > 0);

const canGoToStep = (index: number) => editando.value || index <= maxStep.value;
const isStepVisible = (index: number) =>
  props.uploadPhase || currentStep.value === index;

function focusField(id: string) {
  // O campo pode estar numa etapa escondida: abre a etapa antes de focar.
  if (!props.uploadPhase) currentStep.value = fieldStep(id);
  nextTick(() => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: "smooth", block: "center" });
    element?.focus({ preventScroll: true });
  });
}

function markAttempted(step: number) {
  if (!attemptedSteps.value.includes(step)) attemptedSteps.value.push(step);
}

function showStep(index: number) {
  if (!canGoToStep(index) && index !== maxStep.value + 1) return;
  currentStep.value = index;
  maxStep.value = Math.max(maxStep.value, index);
  nextTick(() =>
    formRoot.value?.scrollIntoView({ behavior: "smooth", block: "start" }),
  );
}

/** Avança se a etapa atual não tem erros (na edição, sempre). */
function goNext() {
  if (isLastStep.value) return;
  if (!editando.value) {
    markAttempted(currentStep.value);
    const firstError = Object.keys(allErrors.value).find(
      (id) => fieldStep(id) === currentStep.value,
    );
    if (firstError) return focusField(firstError);
  }
  showStep(currentStep.value + 1);
}

/**
 * `POST` no cadastro ou `PUT` na edição. Com sucesso, emite `saved`; a tela
 * trava o formulário (`locked`) e envia os arquivos. Reenviar o `POST` daria
 * 409 pelo slug, por isso o cadastro só grava uma vez.
 */
async function gravar() {
  const atual = props.produto;
  if (editando.value && !atual) return;

  saving.value = true;
  errorMessage.value = null;
  serverErrors.value = {};

  try {
    const product =
      editando.value && atual
        ? await produtosApi.atualizar(atual.id, toUpdatePayload(form.value))
        : await produtosApi.criar(toCreatePayload(form.value));
    emit("saved", product);
  } catch (err: unknown) {
    const erro = erroDeGravacao(
      err,
      editando.value
        ? "Ocorreu um erro ao salvar as alterações."
        : "Ocorreu um erro ao cadastrar o produto.",
    );
    serverErrors.value = erro.serverErrors;
    errorMessage.value = erro.errorMessage;
  } finally {
    saving.value = false;
  }
}

function handleSubmit() {
  if (travado.value || props.noSupplier) return;
  // Enter numa etapa intermediária do cadastro avança, não salva.
  if (!editando.value && !isLastStep.value) return goNext();
  FORM_SECTIONS.forEach((_, index) => markAttempted(index));
  const firstError = Object.keys(allErrors.value)[0];
  if (firstError) return focusField(firstError);
  void gravar();
}

function onVariationRemoved(key: string) {
  for (const photo of form.value.photos) {
    if (photo.variationKey === key) photo.variationKey = null;
  }
}

watch(serverErrors, (current) => {
  const first = Object.keys(current)[0];
  if (first) focusField(first);
});

watch(errorMessage, (message) => {
  if (message)
    nextTick(() =>
      alertEl.value?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
});

// O erro de slug duplicado some quando o usuário edita o slug.
watch(
  () => form.value.slug,
  () => {
    if (serverErrors.value[FIELD_IDS.slug]) serverErrors.value = {};
  },
);

/** O envio dos arquivos chama ao começar, para trazer o painel à vista. */
function mostrarPainelEnvio() {
  painelEl.value?.scrollIntoView({ behavior: "smooth", block: "center" });
}

defineExpose({ mostrarPainelEnvio });
</script>

<template>
  <div
    class="min-h-[calc(100vh-14rem)] bg-stone-50/70 px-4 pt-4 sm:px-6 lg:px-8"
  >
    <div class="mx-auto max-w-5xl space-y-3">
      <!-- Cabeçalho -->
      <UiPageHeader
        :breadcrumbs="[
          { name: 'Painel', link: '/admin' },
          { name: 'Produtos', link: '/admin/produtos' },
          { name: editando ? 'Editar' : 'Novo Produto' },
        ]"
        :title="editando ? produto?.name || 'Editar Produto' : 'Novo Produto'"
      >
        <template v-if="editando && produto" #actions>
          <span
            class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
            :class="
              produto.active
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-stone-100 text-stone-500'
            "
          >
            <span
              class="h-1.5 w-1.5 rounded-full"
              :class="produto.active ? 'bg-emerald-500' : 'bg-stone-400'"
            ></span>
            {{ produto.active ? "Ativo" : "Inativo" }}
          </span>
          <UiButton
            v-if="produto.active"
            variant="outline"
            size="sm"
            class="border-rose-200 text-rose-600 hover:bg-rose-50"
            :disabled="travado || busy"
            @click="emit('desativar')"
          >
            <Icon icon="mdi:trash-can-outline" class="h-4 w-4" />
            Desativar
          </UiButton>
        </template>
      </UiPageHeader>

      <!-- Carregando, produto inexistente ou erro de carga -->
      <div
        v-if="loading"
        class="flex flex-col items-center gap-2.5 rounded-xl border border-stone-200 bg-white py-12 text-stone-500"
      >
        <div
          class="h-6 w-6 animate-spin rounded-full border-2 border-secondary/30 border-t-secondary"
        ></div>
        <span class="text-xs">{{ textos.carregando }}</span>
      </div>
      <div
        v-else-if="notFound || loadError"
        :role="loadError ? 'alert' : undefined"
        class="rounded-xl border px-4 py-10 text-center"
        :class="
          loadError
            ? 'border-rose-200 bg-rose-50 text-rose-700'
            : 'border-stone-200 bg-white'
        "
      >
        <Icon
          :icon="
            loadError
              ? 'mdi:alert-circle-outline'
              : 'mdi:package-variant-closed-remove'
          "
          class="mx-auto mb-2 h-7 w-7 opacity-60"
        />
        <p class="text-sm font-semibold">
          {{ loadError || "Produto não encontrado" }}
        </p>
        <p
          v-if="!loadError"
          class="mx-auto mt-1 max-w-sm text-xs text-stone-500"
        >
          O produto pode ter sido desativado ou pertencer a outro fornecedor.
        </p>
        <div class="mt-4 flex justify-center gap-2">
          <UiButton
            v-if="loadError"
            variant="danger"
            size="sm"
            @click="emit('retry')"
            >Tentar de novo</UiButton
          >
          <UiButton variant="outline" size="sm" @click="emit('cancel')">{{
            textos.voltar
          }}</UiButton>
        </div>
      </div>

      <form
        v-else
        ref="formRoot"
        novalidate
        class="scroll-mt-40"
        @submit.prevent="handleSubmit"
      >
        <!-- Indicador de etapas, fixo abaixo da barra de navegação -->
        <UiStepper
          v-if="!uploadPhase"
          :steps="stepTitles"
          :current="currentStep"
          :reached="maxStep"
          :free="editando"
          :errors="errorSteps"
          class="sticky top-28 z-30 -mx-4 mb-3 border-b border-stone-200 bg-stone-50/95 px-4 py-2 backdrop-blur-sm sm:mx-0 sm:rounded-xl sm:border md:top-20"
          @select="showStep"
        />

        <div class="space-y-3">
          <!-- Cartão de cada etapa: só a atual aparece, exceto na fase de envio -->
          <section
            v-for="(section, index) in FORM_SECTIONS"
            v-show="isStepVisible(index)"
            :id="section.id"
            :key="section.id"
            class="scroll-mt-40 rounded-xl border border-stone-200 bg-white p-4 shadow-xs sm:p-5"
            :aria-labelledby="`${section.id}-title`"
          >
            <header class="mb-3">
              <h2
                :id="`${section.id}-title`"
                class="flex items-center gap-2.5 text-base font-semibold text-neutral-dark"
              >
                <span
                  class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
                  >{{ index + 1 }}</span
                >
                {{ section.title }}
              </h2>
              <p class="mt-1 text-xs text-stone-500">
                {{ section.description }}
              </p>
            </header>

            <Etapa1DadosBasicos
              v-if="index === 0"
              v-model="form"
              :categories="categories"
              :suppliers="suppliers"
              :subtype-options="subtypeOptions"
              :errors="errors"
              :locked="travado"
              :supplier-locked="supplierLocked"
              :no-supplier="noSupplier"
            />
            <Etapa2Preco
              v-else-if="index === 1"
              v-model="form"
              :errors="errors"
              :locked="travado"
            />
            <Etapa3Dimensoes
              v-else-if="index === 2"
              v-model="form"
              :errors="errors"
              :locked="travado"
            />
            <Etapa4Variacoes
              v-else-if="index === 3"
              v-model="form.variations"
              :errors="errors"
              :locked="travado"
              :upload-phase="uploadPhase"
              :busy="busy"
              @removed="onVariationRemoved"
              @retry-sample="(key) => emit('retry-sample', key)"
              @remove-existing-sample="
                (key) => emit('remove-existing-sample', key)
              "
            />
            <Etapa5Fotos
              v-else-if="index === 4"
              v-model="form.photos"
              :variations="form.variations"
              :locked="travado"
              :upload-phase="uploadPhase"
              :busy="busy"
              :existing-images="existingImages"
              @retry-photo="(key) => emit('retry-photo', key)"
              @remove-image="(imageId) => emit('remove-image', imageId)"
            />
            <Etapa6Especificacoes
              v-else
              v-model="form"
              :errors="errors"
              :locked="travado"
            />
          </section>

          <p
            v-if="clientErrorCount > 0"
            role="status"
            class="flex items-center gap-2 text-sm text-rose-700"
          >
            <Icon icon="mdi:alert-circle-outline" class="h-4 w-4 shrink-0" />
            {{
              clientErrorCount === 1
                ? "Há 1 campo para corrigir."
                : `Há ${clientErrorCount} campos para corrigir.`
            }}
          </p>

          <!-- Alerta geral (erros 400/403 da API) -->
          <div
            v-if="errorMessage"
            ref="alert"
            role="alert"
            class="flex items-center gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"
          >
            <Icon
              icon="mdi:alert-circle"
              class="h-4 w-4 shrink-0 text-rose-500"
            />
            <span>{{ errorMessage }}</span>
          </div>
        </div>

        <!-- Rodapé de ações, fixo na base da tela -->
        <div
          v-if="!uploadPhase"
          class="sticky bottom-0 z-20 -mx-4 mt-3 flex items-center justify-between gap-3 border-t border-stone-200 bg-stone-50/95 px-4 py-2.5 backdrop-blur-sm sm:mx-0 sm:px-0"
        >
          <UiButton
            type="button"
            variant="outline"
            size="md"
            :disabled="saving"
            @click="emit('cancel')"
            >Cancelar</UiButton
          >
          <div class="flex items-center gap-2 sm:gap-3">
            <span class="hidden text-xs text-stone-500 sm:inline"
              >Etapa {{ currentStep + 1 }} de {{ FORM_SECTIONS.length }}</span
            >
            <UiButton
              v-if="currentStep > 0"
              type="button"
              variant="outline"
              size="md"
              :disabled="saving"
              aria-label="Voltar"
              @click="showStep(currentStep - 1)"
            >
              <Icon icon="mdi:arrow-left" class="h-4 w-4" />
              <span class="hidden sm:inline">Voltar</span>
            </UiButton>
            <UiButton
              v-if="!isLastStep"
              type="button"
              :variant="editando ? 'outline' : 'secondary'"
              size="md"
              :disabled="saving"
              @click="goNext"
            >
              Próximo
              <Icon icon="mdi:arrow-right" class="h-4 w-4" />
            </UiButton>
            <UiButton
              v-if="isLastStep || editando"
              variant="primary"
              type="submit"
              size="md"
              :loading="saving"
              :disabled="noSupplier || travado"
            >
              <Icon
                v-if="!saving"
                icon="mdi:content-save-outline"
                class="h-4 w-4"
              />
              {{ textos.salvar }}
            </UiButton>
          </div>
        </div>
      </form>

      <!-- Painel de envio dos arquivos (depois de gravar o produto) -->
      <div
        v-if="uploadPhase"
        ref="painel"
        class="space-y-4 rounded-xl border bg-white p-5 shadow-xs sm:p-6"
        :class="comFalha ? 'border-amber-300' : 'border-stone-200'"
        aria-live="polite"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            :class="
              comFalha
                ? 'bg-amber-50 text-amber-600'
                : 'bg-emerald-50 text-emerald-600'
            "
          >
            <Icon
              :icon="
                comFalha
                  ? 'mdi:alert-circle-outline'
                  : 'mdi:check-circle-outline'
              "
              class="h-5 w-5"
            />
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="text-sm font-semibold text-neutral-dark">
              {{ envioTitulo }}
            </h2>
            <p class="mt-0.5 text-xs text-stone-500">
              <template v-if="uploading">
                Enviando arquivos: {{ doneFiles }} de {{ totalFiles }}. Não
                feche esta página até o envio terminar.
              </template>
              <template v-else-if="failedFiles > 0">
                {{
                  failedFiles === 1
                    ? "1 arquivo não foi enviado."
                    : `${failedFiles} arquivos não foram enviados.`
                }}
                Use "Tentar de novo" no arquivo com erro ou conclua assim mesmo
                e {{ textos.falha }}
              </template>
              <template v-else>Todos os arquivos foram enviados.</template>
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
        <div v-if="comFalha" class="flex justify-end">
          <UiButton variant="primary" size="md" @click="emit('concluir')"
            >Concluir assim mesmo</UiButton
          >
        </div>
      </div>
    </div>
  </div>
</template>
