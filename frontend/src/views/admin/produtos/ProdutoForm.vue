<script setup lang="ts">
import type {
  Category,
  FieldErrors,
  ProductFormState,
  ProductImageDto,
  Supplier,
} from "@/types";
import {
  FIELD_IDS,
  fieldStep,
  FORM_STEP_COUNT,
} from "@/utils/admin/produtos/produtoFormConstantes";
import { Icon } from "@iconify/vue";
import { computed, nextTick, ref, watch } from "vue";

// Formulário em etapas (uma seção visível por vez). Este componente é o dono
// do estado das etapas; cada etapa é um componente próprio de
// `components/admin/produtos/etapas/`. A validação fica na API, que devolve os
// campos com erro para abrir a etapa e focar o input correspondente.

const form = defineModel<ProductFormState>("form", { required: true });

const props = withDefaults(
  defineProps<{
    categories: Category[];
    suppliers: Supplier[];
    /** Vendedor com um único vínculo: fornecedor pré-selecionado e travado. */
    supplierLocked?: boolean;
    /** Vendedor sem vínculo: aviso e "Salvar produto" desabilitado. */
    noSupplier?: boolean;
    /** Trava a edição (salvando ou produto já criado). */
    locked?: boolean;
    /** Produto criado: mostra o estado do envio de cada arquivo. */
    uploadPhase?: boolean;
    /** `POST /produtos` em andamento. */
    saving?: boolean;
    /** Algum envio de arquivo em andamento. */
    busy?: boolean;
    errorMessage?: string | null;
    /** Erros por campo devolvidos pela API (ex.: slug duplicado). */
    serverErrors?: FieldErrors;
    /** Fotos já gravadas na API (só na edição). */
    existingImages?: ProductImageDto[];
    /** Texto do botão de envio ("Salvar produto" no cadastro). */
    submitLabel?: string;
    /** Edição: todas as etapas ficam livres e o botão de salvar aparece em todas. */
    stepsUnlocked?: boolean;
  }>(),
  {
    supplierLocked: false,
    noSupplier: false,
    locked: false,
    uploadPhase: false,
    saving: false,
    busy: false,
    errorMessage: null,
    serverErrors: () => ({}),
    existingImages: () => [],
    submitLabel: "Salvar produto",
    stepsUnlocked: false,
  },
);

const emit = defineEmits<{
  /** Formulário válido: a tela monta o corpo do `POST` ou do `PUT`. */
  (e: "submit"): void;
  (e: "cancel"): void;
  (e: "retry-sample", variationKey: string): void;
  (e: "retry-photo", photoKey: string): void;
  /** Edição: excluir uma foto já publicada. */
  (e: "remove-image", imageId: string): void;
  /** Edição: excluir a amostra já publicada de uma variação. */
  (e: "remove-existing-sample", variationKey: string): void;
}>();

const formRoot = ref<HTMLFormElement | null>(null);
const alertRef = ref<HTMLElement | null>(null);

// Etapas: `maxStep` é a mais avançada já liberada.
const currentStep = ref(0);
const maxStep = ref(0);
const clearedFields = ref<Record<string, true>>({});

const isLastStep = computed(
  () => currentStep.value === FORM_STEP_COUNT - 1,
);

const errors = computed<FieldErrors>(() => {
  const active: FieldErrors = {};
  for (const [id, message] of Object.entries(props.serverErrors)) {
    if (!clearedFields.value[id]) active[id] = message;
  }
  return active;
});

/** Índices das etapas com erro devolvido pela API. */
const errorSteps = computed(() =>
  Array.from({ length: FORM_STEP_COUNT }, (_, index) => index).filter((index) =>
    Object.keys(errors.value).some((id) => fieldStep(id) === index),
  ),
);

function clearFieldError(id: string) {
  if (!(id in props.serverErrors) || clearedFields.value[id]) return;
  clearedFields.value = { ...clearedFields.value, [id]: true };
}

function onFieldInteraction(event: Event) {
  const target = event.target as HTMLElement | null;
  if (!target?.id) return;

  clearFieldError(target.id);
  if (target.id === FIELD_IDS.category) {
    clearFieldError(FIELD_IDS.subtype);
  } else if (target.id === FIELD_IDS.name && !form.value.slugEdited) {
    clearFieldError(FIELD_IDS.slug);
  }
}

function focusField(id: string) {
  // O campo pode estar numa etapa escondida: abre a etapa antes de focar.
  if (!props.uploadPhase) currentStep.value = fieldStep(id);
  nextTick(() => {
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.focus({ preventScroll: true });
  });
}

function isStepVisible(index: number): boolean {
  return props.uploadPhase || currentStep.value === index;
}

function canGoToStep(index: number): boolean {
  return props.stepsUnlocked || index <= maxStep.value;
}

function showStep(index: number) {
  currentStep.value = index;
  maxStep.value = Math.max(maxStep.value, index);
  nextTick(() =>
    formRoot.value?.scrollIntoView({ behavior: "smooth", block: "start" }),
  );
}

function goToStep(index: number) {
  if (canGoToStep(index)) showStep(index);
}

function goBack() {
  if (currentStep.value > 0) showStep(currentStep.value - 1);
}

/** Avança para a próxima etapa. */
function goNext() {
  if (isLastStep.value) return;
  showStep(currentStep.value + 1);
}

function onVariationRemoved(key: string) {
  for (const photo of form.value.photos) {
    if (photo.variationKey === key) photo.variationKey = null;
  }
}

watch(
  () => props.serverErrors,
  (current) => {
    clearedFields.value = {};
    const first = Object.keys(current)[0];
    if (first) focusField(first);
  },
);

watch(
  () => form.value.slug,
  () => clearFieldError(FIELD_IDS.slug),
);

watch(
  () => props.errorMessage,
  (message) => {
    if (message) {
      nextTick(() =>
        alertRef.value?.scrollIntoView({ behavior: "smooth", block: "center" }),
      );
    }
  },
);

function handleSubmit() {
  if (props.locked || props.noSupplier) return;

  // Enter numa etapa intermediária do cadastro avança, não salva.
  if (!props.stepsUnlocked && !isLastStep.value) {
    goNext();
    return;
  }

  emit("submit");
}
</script>

<template>
  <form
    ref="formRoot"
    novalidate
    class="scroll-mt-28"
    :class="
      uploadPhase
        ? ''
        : 'lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-8 lg:items-start'
    "
    @submit.prevent="handleSubmit"
    @input="onFieldInteraction"
    @change="onFieldInteraction"
  >
    <ProdutoFormNavegacao
      v-if="!uploadPhase"
      parte="indicador"
      :current-step="currentStep"
      :max-step="maxStep"
      :steps-unlocked="stepsUnlocked"
      :error-steps="errorSteps"
      @select="goToStep"
    />

    <div class="min-w-0 space-y-6">
      <ProdutoEtapaDadosBasicos
        v-model="form"
        :visible="isStepVisible(0)"
        :categories="categories"
        :suppliers="suppliers"
        :errors="errors"
        :locked="locked"
        :supplier-locked="supplierLocked"
        :no-supplier="noSupplier"
      />

      <ProdutoEtapaPreco
        v-model="form"
        :visible="isStepVisible(1)"
        :errors="errors"
        :locked="locked"
      />

      <ProdutoEtapaDimensoes
        v-model="form"
        :visible="isStepVisible(2)"
        :errors="errors"
        :locked="locked"
      />

      <ProdutoEtapaVariacoes
        v-model="form.variations"
        :visible="isStepVisible(3)"
        :errors="errors"
        :locked="locked"
        :upload-phase="uploadPhase"
        :busy="busy"
        @removed="onVariationRemoved"
        @retry-sample="(key) => emit('retry-sample', key)"
        @remove-existing-sample="(key) => emit('remove-existing-sample', key)"
      />

      <ProdutoEtapaFotos
        v-model="form.photos"
        :visible="isStepVisible(4)"
        :variations="form.variations"
        :locked="locked"
        :upload-phase="uploadPhase"
        :busy="busy"
        :existing-images="existingImages"
        @retry-photo="(key) => emit('retry-photo', key)"
        @remove-image="(imageId) => emit('remove-image', imageId)"
      />

      <ProdutoEtapaEspecificacoes
        v-model="form"
        :visible="isStepVisible(5)"
        :errors="errors"
        :locked="locked"
      />

      <!-- Alerta geral (erros 400/403 da API) -->
      <div
        v-if="errorMessage"
        ref="alertRef"
        role="alert"
        class="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5"
      >
        <Icon icon="mdi:alert-circle" class="w-4 h-4 shrink-0 text-rose-500" />
        <span>{{ errorMessage }}</span>
      </div>

      <ProdutoFormNavegacao
        v-if="!uploadPhase"
        parte="rodape"
        :current-step="currentStep"
        :steps-unlocked="stepsUnlocked"
        :saving="saving"
        :no-supplier="noSupplier"
        :locked="locked"
        :submit-label="submitLabel"
        @cancel="emit('cancel')"
        @back="goBack"
        @next="goNext"
      />

      <slot name="after" />
    </div>
  </form>
</template>
