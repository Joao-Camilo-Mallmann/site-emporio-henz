<script setup lang="ts">
import type {
  FieldErrors,
  ICategory,
  ISupplier,
  ProductFormState,
  ProductImageDto,
} from "@/types";
import { Icon } from "@iconify/vue";
import { computed, nextTick, ref, watch } from "vue";
import { FIELD_IDS, fieldStep, FORM_SECTIONS } from "@/utils/produtos/produtoFormConstantes";
import { validateForm } from "@/utils/produtos/produtoFormValidacao";

// Formulário em etapas (uma seção visível por vez). Este componente é o dono
// do estado das etapas e da validação; cada etapa é um componente próprio de
// `components/produtos/`. A validação roda no navegador antes do envio e leva
// até o primeiro campo com erro.

const form = defineModel<ProductFormState>("form", { required: true });

const props = withDefaults(
  defineProps<{
    categories: ICategory[];
    suppliers: ISupplier[];
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

// Etapas: `maxStep` é a mais avançada já liberada; `attemptedSteps` são as
// etapas em que o usuário tentou avançar e que passam a mostrar os erros.
const currentStep = ref(0);
const maxStep = ref(0);
const attemptedSteps = ref<number[]>([]);

const isLastStep = computed(() => currentStep.value === FORM_SECTIONS.length - 1);

const selectedCategory = computed(() =>
  props.categories.find((category) => category.id === form.value.categoryId),
);

const subtypeOptions = computed(() => selectedCategory.value?.subtypes ?? []);

const validationContext = computed(() => ({
  subtypeIds: subtypeOptions.value.map((subtype) => subtype.id),
}));

// Uma validação por mudança do formulário, compartilhada pelos erros
// exibidos, pelo "Próximo" e pelo envio.
const allErrors = computed<FieldErrors>(() =>
  validateForm(form.value, validationContext.value),
);

const clientErrors = computed<FieldErrors>(() => {
  if (attemptedSteps.value.length === 0) return {};
  return Object.fromEntries(
    Object.entries(allErrors.value).filter(([id]) =>
      attemptedSteps.value.includes(fieldStep(id)),
    ),
  );
});

const errors = computed<FieldErrors>(() => ({
  ...props.serverErrors,
  ...clientErrors.value,
}));

const clientErrorCount = computed(
  () =>
    Object.keys(clientErrors.value).filter(
      (id) => fieldStep(id) === currentStep.value,
    ).length,
);

/** Índices das etapas com erro de validação do navegador. */
const errorSteps = computed(() =>
  FORM_SECTIONS.map((_, index) => index).filter((index) =>
    Object.keys(clientErrors.value).some((id) => fieldStep(id) === index),
  ),
);

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

function markAttempted(step: number) {
  if (!attemptedSteps.value.includes(step)) attemptedSteps.value.push(step);
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

/** Avança para a próxima etapa se a atual não tem erros (na edição, sempre). */
function goNext() {
  if (isLastStep.value) return;

  if (!props.stepsUnlocked) {
    const step = currentStep.value;
    markAttempted(step);
    const firstError = Object.keys(allErrors.value).find(
      (id) => fieldStep(id) === step,
    );
    if (firstError) {
      focusField(firstError);
      return;
    }
  }
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
    const first = Object.keys(current)[0];
    if (first) focusField(first);
  },
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

  FORM_SECTIONS.forEach((_, index) => markAttempted(index));
  const firstError = Object.keys(allErrors.value)[0];
  if (firstError) {
    focusField(firstError);
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
      <!-- 1. Dados básicos -->
      <ProdutoDadosBasicosSection
        v-model="form"
        :visible="isStepVisible(0)"
        :categories="categories"
        :suppliers="suppliers"
        :subtype-options="subtypeOptions"
        :errors="errors"
        :locked="locked"
        :supplier-locked="supplierLocked"
        :no-supplier="noSupplier"
      />

      <!-- 2. Preço e disponibilidade e 3. Dimensões -->
      <ProdutoPrecoDimensoesSection
        v-model="form"
        :price-visible="isStepVisible(1)"
        :dimensions-visible="isStepVisible(2)"
        :errors="errors"
        :locked="locked"
      />

      <!-- 4. Variações de acabamento -->
      <section
        v-show="isStepVisible(3)"
        :id="FORM_SECTIONS[3].id"
        class="scroll-mt-32 rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs"
        :aria-labelledby="`${FORM_SECTIONS[3].id}-title`"
      >
        <header class="mb-5">
          <h2
            :id="`${FORM_SECTIONS[3].id}-title`"
            class="flex items-center gap-2.5 text-base font-semibold text-neutral-dark"
          >
            <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">4</span>
            {{ FORM_SECTIONS[3].title }}
          </h2>
          <p class="mt-1 text-xs text-stone-500">
            Opcional. A ordem da lista é a ordem de exibição no catálogo.
          </p>
        </header>

        <ProdutoVariacoesSection
          v-model="form.variations"
          :errors="errors"
          :locked="locked"
          :upload-phase="uploadPhase"
          :busy="busy"
          @removed="onVariationRemoved"
          @retry-sample="(key) => emit('retry-sample', key)"
          @remove-existing-sample="(key) => emit('remove-existing-sample', key)"
        />
      </section>

      <!-- 5. Fotos -->
      <section
        v-show="isStepVisible(4)"
        :id="FORM_SECTIONS[4].id"
        class="scroll-mt-32 rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs"
        :aria-labelledby="`${FORM_SECTIONS[4].id}-title`"
      >
        <header class="mb-5">
          <h2
            :id="`${FORM_SECTIONS[4].id}-title`"
            class="flex items-center gap-2.5 text-base font-semibold text-neutral-dark"
          >
            <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">5</span>
            {{ FORM_SECTIONS[4].title }}
          </h2>
          <p class="mt-1 text-xs text-stone-500">
            A ordem da tela é a ordem do carrossel. Associe a foto a uma variação para mostrá-la junto daquele acabamento.
          </p>
        </header>

        <ProdutoFotosSection
          v-model="form.photos"
          :variations="form.variations"
          :locked="locked"
          :upload-phase="uploadPhase"
          :busy="busy"
          :existing-images="existingImages"
          @retry-photo="(key) => emit('retry-photo', key)"
          @remove-image="(imageId) => emit('remove-image', imageId)"
        />
      </section>

      <!-- 6. Especificações técnicas e status no catálogo -->
      <section
        v-show="isStepVisible(5)"
        :id="FORM_SECTIONS[5].id"
        class="scroll-mt-32 rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs"
        :aria-labelledby="`${FORM_SECTIONS[5].id}-title`"
      >
        <header class="mb-5">
          <h2
            :id="`${FORM_SECTIONS[5].id}-title`"
            class="flex items-center gap-2.5 text-base font-semibold text-neutral-dark"
          >
            <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">6</span>
            {{ FORM_SECTIONS[5].title }}
          </h2>
          <p class="mt-1 text-xs text-stone-500">
            Ficha técnica livre, como portas, gavetas ou tipo de espuma. Linhas vazias são ignoradas.
          </p>
        </header>

        <KeyValueEditor
          v-model="form.specifications"
          :id-prefix="FIELD_IDS.specifications"
          :errors="errors"
          :disabled="locked"
          key-label="Característica"
          value-label="Valor"
          key-placeholder="Ex.: Gavetas"
          value-placeholder="Ex.: 4"
          add-label="Adicionar especificação"
          empty-text="Nenhuma especificação adicionada."
        />
      </section>

      <!-- Status no catálogo (fica na última etapa) -->
      <div
        v-show="isStepVisible(FORM_SECTIONS.length - 1)"
        class="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs"
      >
        <label :for="FIELD_IDS.active" class="flex items-start gap-3 cursor-pointer select-none">
          <input
            :id="FIELD_IDS.active"
            v-model="form.active"
            type="checkbox"
            :disabled="locked"
            class="mt-0.5 w-4 h-4 rounded border-stone-300 text-secondary focus:ring-secondary cursor-pointer disabled:cursor-not-allowed"
          />
          <span>
            <span class="text-sm font-medium text-neutral-dark block">Produto ativo no catálogo</span>
            <span class="text-xs text-stone-500 block mt-0.5">
              Produtos inativos ficam guardados no painel e não aparecem para os clientes.
            </span>
          </span>
        </label>
      </div>

      <!-- Resumo de erros de validação -->
      <p
        v-if="clientErrorCount > 0"
        role="status"
        class="flex items-center gap-2 text-sm text-rose-700"
      >
        <Icon icon="mdi:alert-circle-outline" class="w-4 h-4 shrink-0" />
        {{
          clientErrorCount === 1
            ? "Há 1 campo para corrigir."
            : `Há ${clientErrorCount} campos para corrigir.`
        }}
      </p>

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
