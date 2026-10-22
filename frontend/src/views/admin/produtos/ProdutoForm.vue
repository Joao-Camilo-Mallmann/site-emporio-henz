<script setup lang="ts">
import type {
  FieldErrors,
  ICategory,
  ISupplier,
  ProductCreatePayload,
  ProductFormState,
  ProductImageDto,
} from "@/types";
import { slugify } from "@/utils/slug";
import { Icon } from "@iconify/vue";
import { computed, nextTick, ref, watch } from "vue";
import {
  AVAILABILITY_OPTIONS,
  ERROR_TEXT_CLASS,
  FIELD_IDS,
  fieldClass,
  fieldStep,
  FORM_SECTIONS,
  HINT_CLASS,
  INSTALLMENTS_MAX,
  INSTALLMENTS_MIN,
  LABEL_CLASS,
  TEXT_MAX_LENGTH,
} from "@/utils/produtos/produtoFormConstantes";
import {
  formatMmAsCm,
  toCreatePayload,
} from "@/utils/produtos/produtoFormEstado";
import {
  validateForm,
} from "@/utils/produtos/produtoFormValidacao";

// Formulário em etapas (uma seção visível por vez): seções 1, 2, 3 e 6, o
// indicador de etapas e a composição das seções
// 4 (variações) e 5 (fotos). A validação roda no navegador antes do envio e
// leva até o primeiro campo com erro.

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
  (e: "submit", payload: ProductCreatePayload): void;
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

const clientErrors = computed<FieldErrors>(() => {
  if (attemptedSteps.value.length === 0) return {};
  const all = validateForm(form.value, validationContext.value);
  return Object.fromEntries(
    Object.entries(all).filter(([id]) =>
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

const dimensionFields = [
  { id: FIELD_IDS.heightMm, key: "heightMm", label: "Altura" },
  { id: FIELD_IDS.widthMm, key: "widthMm", label: "Largura" },
  { id: FIELD_IDS.depthMm, key: "depthMm", label: "Profundidade" },
] as const;

function fieldError(id: string): string {
  return errors.value[id] ?? "";
}

function describedBy(id: string, hintId?: string): string | undefined {
  const parts = [fieldError(id) ? `${id}-error` : "", hintId ?? ""].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : undefined;
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

function isStepDone(index: number): boolean {
  return !props.stepsUnlocked && index < maxStep.value;
}

function stepHasError(index: number): boolean {
  return Object.keys(clientErrors.value).some((id) => fieldStep(id) === index);
}

type StepState = "current" | "error" | "done" | "open" | "locked";

function stepState(index: number): StepState {
  if (stepHasError(index)) return "error";
  if (index === currentStep.value) return "current";
  if (isStepDone(index)) return "done";
  return canGoToStep(index) ? "open" : "locked";
}

const STEP_CIRCLE_CLASS: Record<StepState, string> = {
  current: "bg-secondary text-white shadow-sm ring-4 ring-secondary/15",
  error: "bg-rose-500 text-white ring-4 ring-rose-100",
  done: "bg-emerald-500 text-white",
  open: "bg-stone-200 text-stone-700",
  locked: "bg-stone-100 text-stone-400",
};

const STEP_TITLE_CLASS: Record<StepState, string> = {
  current: "font-semibold text-neutral-dark",
  error: "font-semibold text-rose-700",
  done: "font-medium text-neutral-dark",
  open: "font-medium text-stone-700",
  locked: "text-stone-400",
};

const progressPercent = computed(() =>
  Math.round(((currentStep.value + 1) / FORM_SECTIONS.length) * 100),
);

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
    const firstError = Object.keys(
      validateForm(form.value, validationContext.value),
    ).find((id) => fieldStep(id) === step);
    if (firstError) {
      focusField(firstError);
      return;
    }
  }
  showStep(currentStep.value + 1);
}

// Slug acompanha o nome até o usuário editá-lo.
watch(
  () => form.value.name,
  (name) => {
    if (!form.value.slugEdited) form.value.slug = slugify(name);
  },
);

function onSlugInput() {
  form.value.slugEdited = true;
}

function regenerateSlug() {
  form.value.slugEdited = false;
  form.value.slug = slugify(form.value.name);
}

// Trocar a categoria limpa o subtipo escolhido.
watch(
  () => form.value.categoryId,
  (current, previous) => {
    if (current !== previous) form.value.subtypeId = "";
  },
);

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
  const result = validateForm(form.value, validationContext.value);
  const firstError = Object.keys(result)[0];
  if (firstError) {
    focusField(firstError);
    return;
  }

  emit("submit", toCreatePayload(form.value));
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
    <!-- Indicador de etapas: cartão lateral em telas largas, versão compacta no celular -->
    <nav
      v-if="!uploadPhase"
      aria-label="Etapas do formulário"
      class="mb-6 lg:mb-0 lg:sticky lg:top-32"
    >
      <!-- Compacto (celular e tablet) -->
      <div class="lg:hidden rounded-xl border border-stone-200 bg-white p-4 shadow-xs space-y-3">
        <div class="flex items-baseline justify-between gap-3">
          <p class="min-w-0 truncate text-sm font-semibold text-neutral-dark">
            {{ FORM_SECTIONS[currentStep].title }}
          </p>
          <span class="shrink-0 text-xs text-stone-500">
            Etapa {{ currentStep + 1 }} de {{ FORM_SECTIONS.length }}
          </span>
        </div>
        <div
          class="h-1.5 w-full overflow-hidden rounded-full bg-stone-100"
          role="progressbar"
          :aria-valuenow="currentStep + 1"
          aria-valuemin="1"
          :aria-valuemax="FORM_SECTIONS.length"
          :aria-label="`Etapa ${currentStep + 1} de ${FORM_SECTIONS.length}`"
        >
          <div
            class="h-full rounded-full bg-secondary transition-all duration-300"
            :style="{ width: `${progressPercent}%` }"
          ></div>
        </div>
        <ol class="flex items-center justify-between gap-1">
          <li v-for="(section, index) in FORM_SECTIONS" :key="section.id">
            <UiButton
              type="button"
              variant="custom"
              size="none"
              :disabled="!canGoToStep(index)"
              :aria-current="index === currentStep ? 'step' : undefined"
              :aria-label="`Etapa ${index + 1}: ${section.title}`"
              :title="section.title"
              class="h-8 w-8 rounded-full text-xs font-semibold transition-colors disabled:cursor-not-allowed"
              :class="STEP_CIRCLE_CLASS[stepState(index)]"
              @click="goToStep(index)"
            >
              <Icon v-if="stepState(index) === 'done'" icon="mdi:check" class="w-4 h-4" />
              <Icon
                v-else-if="stepState(index) === 'error'"
                icon="mdi:exclamation-thick"
                class="w-4 h-4"
              />
              <template v-else>{{ index + 1 }}</template>
            </UiButton>
          </li>
        </ol>
      </div>

      <!-- Lateral (telas largas) -->
      <div class="hidden lg:block rounded-xl border border-stone-200 bg-white p-4 shadow-xs">
        <div class="mb-3 space-y-2 px-1">
          <div class="flex items-baseline justify-between">
            <span class="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Etapas
            </span>
            <span class="text-xs text-stone-500">
              {{ currentStep + 1 }} de {{ FORM_SECTIONS.length }}
            </span>
          </div>
          <div
            class="h-1.5 w-full overflow-hidden rounded-full bg-stone-100"
            role="progressbar"
            :aria-valuenow="currentStep + 1"
            aria-valuemin="1"
            :aria-valuemax="FORM_SECTIONS.length"
            :aria-label="`Etapa ${currentStep + 1} de ${FORM_SECTIONS.length}`"
          >
            <div
              class="h-full rounded-full bg-secondary transition-all duration-300"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>
        </div>

        <ol>
          <li v-for="(section, index) in FORM_SECTIONS" :key="section.id" class="relative">
            <!-- Linha que liga esta etapa à próxima -->
            <span
              v-if="index < FORM_SECTIONS.length - 1"
              aria-hidden="true"
              class="pointer-events-none absolute left-6 top-[2.375rem] bottom-[-0.625rem] w-px"
              :class="isStepDone(index) ? 'bg-emerald-300' : 'bg-stone-200'"
            ></span>

            <UiButton
              type="button"
              variant="custom"
              size="none"
              :disabled="!canGoToStep(index)"
              :aria-current="index === currentStep ? 'step' : undefined"
              class="w-full items-start justify-start gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors disabled:cursor-not-allowed"
              :class="
                index === currentStep
                  ? 'bg-sky-50/70'
                  : canGoToStep(index)
                    ? 'hover:bg-stone-50'
                    : ''
              "
              @click="goToStep(index)"
            >
              <span
                class="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all"
                :class="STEP_CIRCLE_CLASS[stepState(index)]"
              >
                <Icon v-if="stepState(index) === 'done'" icon="mdi:check" class="w-4 h-4" />
                <Icon
                  v-else-if="stepState(index) === 'error'"
                  icon="mdi:exclamation-thick"
                  class="w-4 h-4"
                />
                <template v-else>{{ index + 1 }}</template>
              </span>
              <span class="min-w-0 flex-1 pt-0.5">
                <span class="block text-sm leading-tight" :class="STEP_TITLE_CLASS[stepState(index)]">
                  {{ section.title }}
                </span>
                <span
                  class="mt-0.5 block text-xs leading-snug"
                  :class="stepState(index) === 'locked' ? 'text-stone-300' : 'text-stone-500'"
                >
                  {{ section.hint }}
                </span>
              </span>
            </UiButton>
          </li>
        </ol>
      </div>
    </nav>

    <div class="min-w-0 space-y-6">
      <!-- 1. Dados básicos -->
      <section
        v-show="isStepVisible(0)"
        :id="FORM_SECTIONS[0].id"
        class="scroll-mt-32 rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs"
        :aria-labelledby="`${FORM_SECTIONS[0].id}-title`"
      >
        <header class="mb-5">
          <h2
            :id="`${FORM_SECTIONS[0].id}-title`"
            class="flex items-center gap-2.5 text-base font-semibold text-neutral-dark"
          >
            <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
            {{ FORM_SECTIONS[0].title }}
          </h2>
          <p class="mt-1 text-xs text-stone-500">
            Identificação do móvel, onde ele aparece no catálogo e quem o fabrica.
          </p>
        </header>

        <fieldset :disabled="locked" class="min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Nome -->
          <div class="sm:col-span-2">
            <label :for="FIELD_IDS.name" :class="LABEL_CLASS">Nome do produto *</label>
            <input
              :id="FIELD_IDS.name"
              v-model="form.name"
              type="text"
              :maxlength="TEXT_MAX_LENGTH"
              placeholder="Ex.: Roupeiro Roma 6 Portas"
              aria-required="true"
              :aria-invalid="fieldError(FIELD_IDS.name) ? 'true' : undefined"
              :aria-describedby="describedBy(FIELD_IDS.name)"
              :class="fieldClass(!!fieldError(FIELD_IDS.name))"
            />
            <p v-if="fieldError(FIELD_IDS.name)" :id="`${FIELD_IDS.name}-error`" :class="ERROR_TEXT_CLASS">
              {{ fieldError(FIELD_IDS.name) }}
            </p>
          </div>

          <!-- Slug -->
          <div class="sm:col-span-2">
            <label :for="FIELD_IDS.slug" :class="LABEL_CLASS">Slug (identificador na URL) *</label>
            <input
              :id="FIELD_IDS.slug"
              v-model="form.slug"
              type="text"
              :maxlength="TEXT_MAX_LENGTH"
              placeholder="Ex.: roupeiro-roma-6-portas"
              spellcheck="false"
              autocomplete="off"
              aria-required="true"
              :aria-invalid="fieldError(FIELD_IDS.slug) ? 'true' : undefined"
              :aria-describedby="describedBy(FIELD_IDS.slug, `${FIELD_IDS.slug}-hint`)"
              :class="[fieldClass(!!fieldError(FIELD_IDS.slug)), 'font-mono text-xs']"
              @input="onSlugInput"
            />
            <p v-if="fieldError(FIELD_IDS.slug)" :id="`${FIELD_IDS.slug}-error`" :class="ERROR_TEXT_CLASS">
              {{ fieldError(FIELD_IDS.slug) }}
            </p>
            <p :id="`${FIELD_IDS.slug}-hint`" :class="[HINT_CLASS, 'flex flex-wrap items-center gap-x-2']">
              <span v-if="form.slugEdited">Slug editado manualmente.</span>
              <span v-else>Gerado a partir do nome. Edite se quiser outro endereço.</span>
              <UiButton
                v-if="form.slugEdited && !locked"
                variant="link"
                size="none"
                class="text-xs"
                @click="regenerateSlug"
              >
                Gerar do nome novamente
              </UiButton>
            </p>
          </div>

          <!-- Categoria -->
          <div>
            <label :for="FIELD_IDS.category" :class="LABEL_CLASS">Categoria *</label>
            <select
              :id="FIELD_IDS.category"
              v-model="form.categoryId"
              aria-required="true"
              :aria-invalid="fieldError(FIELD_IDS.category) ? 'true' : undefined"
              :aria-describedby="describedBy(FIELD_IDS.category)"
              :class="fieldClass(!!fieldError(FIELD_IDS.category))"
            >
              <option value="" disabled>Selecione a categoria</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
            <p v-if="fieldError(FIELD_IDS.category)" :id="`${FIELD_IDS.category}-error`" :class="ERROR_TEXT_CLASS">
              {{ fieldError(FIELD_IDS.category) }}
            </p>
            <p v-else-if="categories.length === 0" :class="HINT_CLASS">
              Nenhuma categoria ativa cadastrada.
            </p>
          </div>

          <!-- Subtipo -->
          <div>
            <label :for="FIELD_IDS.subtype" :class="LABEL_CLASS">Subtipo</label>
            <select
              :id="FIELD_IDS.subtype"
              v-model="form.subtypeId"
              :disabled="!form.categoryId"
              :aria-invalid="fieldError(FIELD_IDS.subtype) ? 'true' : undefined"
              :aria-describedby="describedBy(FIELD_IDS.subtype)"
              :class="fieldClass(!!fieldError(FIELD_IDS.subtype))"
            >
              <option value="">Sem subtipo</option>
              <option v-for="subtype in subtypeOptions" :key="subtype.id" :value="subtype.id">
                {{ subtype.name }}
              </option>
            </select>
            <p v-if="fieldError(FIELD_IDS.subtype)" :id="`${FIELD_IDS.subtype}-error`" :class="ERROR_TEXT_CLASS">
              {{ fieldError(FIELD_IDS.subtype) }}
            </p>
            <p v-else-if="!form.categoryId" :class="HINT_CLASS">Escolha a categoria primeiro.</p>
          </div>

          <!-- Fornecedor -->
          <div class="sm:col-span-2">
            <label :for="FIELD_IDS.supplier" :class="LABEL_CLASS">Fornecedor / fabricante *</label>
            <select
              :id="FIELD_IDS.supplier"
              v-model="form.supplierId"
              :disabled="supplierLocked || noSupplier"
              aria-required="true"
              :aria-invalid="fieldError(FIELD_IDS.supplier) ? 'true' : undefined"
              :aria-describedby="describedBy(FIELD_IDS.supplier, `${FIELD_IDS.supplier}-hint`)"
              :class="fieldClass(!!fieldError(FIELD_IDS.supplier))"
            >
              <option value="" disabled>Selecione o fornecedor</option>
              <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
                {{ supplier.name }}
              </option>
            </select>
            <p v-if="fieldError(FIELD_IDS.supplier)" :id="`${FIELD_IDS.supplier}-error`" :class="ERROR_TEXT_CLASS">
              {{ fieldError(FIELD_IDS.supplier) }}
            </p>
            <div :id="`${FIELD_IDS.supplier}-hint`">
              <p
                v-if="noSupplier"
                role="alert"
                class="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800"
              >
                <Icon icon="mdi:alert-outline" class="w-4 h-4 shrink-0" />
                <span>
                  Seu usuário não tem empresa vinculada. Peça a um administrador
                  para vincular você a um fornecedor antes de cadastrar produtos.
                </span>
              </p>
              <p v-else-if="supplierLocked" :class="[HINT_CLASS, 'flex items-center gap-1.5']">
                <Icon icon="mdi:lock-outline" class="w-3.5 h-3.5" />
                Empresa vinculada ao seu usuário.
              </p>
              <p v-else-if="suppliers.length === 0" :class="HINT_CLASS">
                Nenhum fornecedor ativo cadastrado.
              </p>
            </div>
          </div>

          <!-- Linha / coleção -->
          <div>
            <label :for="FIELD_IDS.collectionLine" :class="LABEL_CLASS">Linha / coleção</label>
            <input
              :id="FIELD_IDS.collectionLine"
              v-model="form.collectionLine"
              type="text"
              :maxlength="TEXT_MAX_LENGTH"
              placeholder="Ex.: Linha Itália"
              :aria-invalid="fieldError(FIELD_IDS.collectionLine) ? 'true' : undefined"
              :aria-describedby="describedBy(FIELD_IDS.collectionLine)"
              :class="fieldClass(!!fieldError(FIELD_IDS.collectionLine))"
            />
            <p v-if="fieldError(FIELD_IDS.collectionLine)" :id="`${FIELD_IDS.collectionLine}-error`" :class="ERROR_TEXT_CLASS">
              {{ fieldError(FIELD_IDS.collectionLine) }}
            </p>
          </div>

          <!-- Material principal -->
          <div>
            <label :for="FIELD_IDS.mainMaterial" :class="LABEL_CLASS">Material principal</label>
            <input
              :id="FIELD_IDS.mainMaterial"
              v-model="form.mainMaterial"
              type="text"
              :maxlength="TEXT_MAX_LENGTH"
              placeholder="Ex.: MDF 18mm"
              :aria-invalid="fieldError(FIELD_IDS.mainMaterial) ? 'true' : undefined"
              :aria-describedby="describedBy(FIELD_IDS.mainMaterial)"
              :class="fieldClass(!!fieldError(FIELD_IDS.mainMaterial))"
            />
            <p v-if="fieldError(FIELD_IDS.mainMaterial)" :id="`${FIELD_IDS.mainMaterial}-error`" :class="ERROR_TEXT_CLASS">
              {{ fieldError(FIELD_IDS.mainMaterial) }}
            </p>
          </div>

          <!-- Descrição -->
          <div class="sm:col-span-2">
            <label :for="FIELD_IDS.description" :class="LABEL_CLASS">Descrição</label>
            <textarea
              :id="FIELD_IDS.description"
              v-model="form.description"
              rows="4"
              placeholder="Conte o que torna o móvel especial: materiais, uso e diferenciais."
              :class="[fieldClass(false), 'resize-y']"
            />
          </div>
        </fieldset>
      </section>

      <!-- 2. Preço e disponibilidade -->
      <section
        v-show="isStepVisible(1)"
        :id="FORM_SECTIONS[1].id"
        class="scroll-mt-32 rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs"
        :aria-labelledby="`${FORM_SECTIONS[1].id}-title`"
      >
        <header class="mb-5">
          <h2
            :id="`${FORM_SECTIONS[1].id}-title`"
            class="flex items-center gap-2.5 text-base font-semibold text-neutral-dark"
          >
            <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
            {{ FORM_SECTIONS[1].title }}
          </h2>
          <p class="mt-1 text-xs text-stone-500">
            Valor base de referência; condições especiais são combinadas no atendimento.
          </p>
        </header>

        <fieldset :disabled="locked" class="min-w-0 space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <!-- Preço de referência -->
            <div>
              <label :for="FIELD_IDS.referencePrice" :class="LABEL_CLASS">Preço de referência *</label>
              <div class="relative">
                <span class="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm text-stone-500" aria-hidden="true">R$</span>
                <input
                  :id="FIELD_IDS.referencePrice"
                  v-model="form.referencePrice"
                  type="number"
                  inputmode="decimal"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  aria-required="true"
                  :aria-invalid="fieldError(FIELD_IDS.referencePrice) ? 'true' : undefined"
                  :aria-describedby="describedBy(FIELD_IDS.referencePrice)"
                  :class="[fieldClass(!!fieldError(FIELD_IDS.referencePrice)), 'pl-10']"
                />
              </div>
              <p v-if="fieldError(FIELD_IDS.referencePrice)" :id="`${FIELD_IDS.referencePrice}-error`" :class="ERROR_TEXT_CLASS">
                {{ fieldError(FIELD_IDS.referencePrice) }}
              </p>
            </div>

            <!-- Parcelas -->
            <div>
              <label :for="FIELD_IDS.maxInstallments" :class="LABEL_CLASS">Parcelas máximas *</label>
              <input
                :id="FIELD_IDS.maxInstallments"
                v-model="form.maxInstallments"
                type="number"
                inputmode="numeric"
                :min="INSTALLMENTS_MIN"
                :max="INSTALLMENTS_MAX"
                step="1"
                aria-required="true"
                :aria-invalid="fieldError(FIELD_IDS.maxInstallments) ? 'true' : undefined"
                :aria-describedby="describedBy(FIELD_IDS.maxInstallments, `${FIELD_IDS.maxInstallments}-hint`)"
                :class="fieldClass(!!fieldError(FIELD_IDS.maxInstallments))"
              />
              <p v-if="fieldError(FIELD_IDS.maxInstallments)" :id="`${FIELD_IDS.maxInstallments}-error`" :class="ERROR_TEXT_CLASS">
                {{ fieldError(FIELD_IDS.maxInstallments) }}
              </p>
              <p :id="`${FIELD_IDS.maxInstallments}-hint`" :class="HINT_CLASS">
                De {{ INSTALLMENTS_MIN }} a {{ INSTALLMENTS_MAX }}. Use 1 para pagamento à vista.
              </p>
            </div>
          </div>

          <!-- Disponibilidade -->
          <fieldset class="min-w-0">
            <legend :class="LABEL_CLASS">Disponibilidade *</legend>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                v-for="option in AVAILABILITY_OPTIONS"
                :key="option.value"
                :for="`product-availability-${option.value}`"
                class="flex items-start gap-3 rounded-lg border p-3.5 cursor-pointer transition-colors"
                :class="
                  form.availabilityType === option.value
                    ? 'border-secondary bg-surface-tint/30'
                    : 'border-stone-200 hover:border-stone-300'
                "
              >
                <input
                  :id="`product-availability-${option.value}`"
                  v-model="form.availabilityType"
                  type="radio"
                  name="product-availability"
                  :value="option.value"
                  class="mt-0.5 w-4 h-4 border-stone-300 text-secondary focus:ring-secondary"
                />
                <span>
                  <span class="block text-sm font-medium text-neutral-dark">{{ option.label }}</span>
                  <span class="block text-xs text-stone-500 mt-0.5">{{ option.hint }}</span>
                </span>
              </label>
            </div>
          </fieldset>

          <!-- Prazo (só sob encomenda) -->
          <div v-if="form.availabilityType === 'ON_DEMAND'" class="sm:max-w-xs">
            <label :for="FIELD_IDS.estimatedDays" :class="LABEL_CLASS">Prazo de fabricação (dias) *</label>
            <input
              :id="FIELD_IDS.estimatedDays"
              v-model="form.estimatedDays"
              type="number"
              inputmode="numeric"
              min="1"
              step="1"
              placeholder="Ex.: 15"
              aria-required="true"
              :aria-invalid="fieldError(FIELD_IDS.estimatedDays) ? 'true' : undefined"
              :aria-describedby="describedBy(FIELD_IDS.estimatedDays)"
              :class="fieldClass(!!fieldError(FIELD_IDS.estimatedDays))"
            />
            <p v-if="fieldError(FIELD_IDS.estimatedDays)" :id="`${FIELD_IDS.estimatedDays}-error`" :class="ERROR_TEXT_CLASS">
              {{ fieldError(FIELD_IDS.estimatedDays) }}
            </p>
          </div>
        </fieldset>
      </section>

      <!-- 3. Dimensões -->
      <section
        v-show="isStepVisible(2)"
        :id="FORM_SECTIONS[2].id"
        class="scroll-mt-32 rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs"
        :aria-labelledby="`${FORM_SECTIONS[2].id}-title`"
      >
        <header class="mb-5">
          <h2
            :id="`${FORM_SECTIONS[2].id}-title`"
            class="flex items-center gap-2.5 text-base font-semibold text-neutral-dark"
          >
            <span class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
            {{ FORM_SECTIONS[2].title }}
          </h2>
          <p class="mt-1 text-xs text-stone-500">
            Medidas externas em milímetros, números inteiros.
          </p>
        </header>

        <fieldset :disabled="locked" class="min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div v-for="dimension in dimensionFields" :key="dimension.id">
            <label :for="dimension.id" :class="LABEL_CLASS">{{ dimension.label }} (mm) *</label>
            <div class="relative">
              <input
                :id="dimension.id"
                v-model="form[dimension.key]"
                type="number"
                inputmode="numeric"
                min="1"
                step="1"
                placeholder="Ex.: 2300"
                aria-required="true"
                :aria-invalid="fieldError(dimension.id) ? 'true' : undefined"
                :aria-describedby="describedBy(dimension.id, `${dimension.id}-hint`)"
                :class="[fieldClass(!!fieldError(dimension.id)), 'pr-12']"
              />
              <span class="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs text-stone-500" aria-hidden="true">mm</span>
            </div>
            <p v-if="fieldError(dimension.id)" :id="`${dimension.id}-error`" :class="ERROR_TEXT_CLASS">
              {{ fieldError(dimension.id) }}
            </p>
            <p :id="`${dimension.id}-hint`" :class="HINT_CLASS">
              {{ formatMmAsCm(form[dimension.key]) ? `= ${formatMmAsCm(form[dimension.key])}` : "Equivalente em cm aparece aqui." }}
            </p>
          </div>
        </fieldset>
      </section>

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
            A ordem da tela é a ordem do carrossel. Associe a foto a uma variação
            para mostrá-la junto daquele acabamento.
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

      <!-- 6. Especificações técnicas -->
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
            Ficha técnica livre, como portas, gavetas ou tipo de espuma. Linhas
            vazias são ignoradas.
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

      <!-- Status no catálogo -->
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

      <!-- Ações -->
      <div
        v-if="!uploadPhase"
        class="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <UiButton
          type="button"
          variant="outline"
          size="md"
          :disabled="saving"
          @click="emit('cancel')"
        >
          Cancelar
        </UiButton>

        <div class="flex flex-col-reverse sm:flex-row sm:items-center gap-3">
          <span class="text-xs text-stone-500 text-center sm:mr-1">
            Etapa {{ currentStep + 1 }} de {{ FORM_SECTIONS.length }}
          </span>
          <UiButton
            v-if="currentStep > 0"
            type="button"
            variant="outline"
            size="md"
            :disabled="saving"
            @click="goBack"
          >
            <Icon icon="mdi:arrow-left" class="w-4 h-4" />
            Voltar
          </UiButton>
          <UiButton
            v-if="!isLastStep"
            type="button"
            :variant="stepsUnlocked ? 'outline' : 'secondary'"
            size="md"
            :disabled="saving"
            @click="goNext"
          >
            Próximo
            <Icon icon="mdi:arrow-right" class="w-4 h-4" />
          </UiButton>
          <UiButton
            v-if="isLastStep || stepsUnlocked"
            variant="primary"
            type="submit"
            size="md"
            :loading="saving"
            :disabled="noSupplier || locked"
          >
            <Icon v-if="!saving" icon="mdi:content-save-outline" class="w-4 h-4" />
            {{ submitLabel }}
          </UiButton>
        </div>
      </div>

      <slot name="after" />
    </div>
  </form>
</template>
