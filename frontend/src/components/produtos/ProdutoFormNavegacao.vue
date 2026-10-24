<script setup lang="ts">
import { FORM_SECTIONS } from "@/utils/produtos/produtoFormConstantes";
import { Icon } from "@iconify/vue";
import { computed } from "vue";

// Navegação entre as etapas do formulário de produto, em duas partes
// escolhidas pela prop `parte`: o indicador de etapas (versão compacta no
// celular e tablet, cartão lateral em telas largas) e o rodapé com Cancelar,
// "Etapa X de N", Voltar, Próximo e Salvar. Só apresenta o estado; quem sabe a
// etapa atual e valida é o `ProdutoForm`. O botão de salvar do rodapé é
// `type="submit"` e dispara o `submit` do `<form>` que contém este componente.

const props = withDefaults(
  defineProps<{
    /** Parte exibida: indicador de etapas ou rodapé de ações. */
    parte: "indicador" | "rodape";
    /** Etapa visível (começa em 0). */
    currentStep: number;
    /** Indicador: etapa mais avançada já liberada. */
    maxStep?: number;
    /** Edição: todas as etapas ficam livres e o salvar aparece em todas. */
    stepsUnlocked?: boolean;
    /** Indicador: índices das etapas com erro de validação. */
    errorSteps?: number[];
    /** Rodapé: envio em andamento. */
    saving?: boolean;
    /** Rodapé: vendedor sem vínculo, desabilita o salvar. */
    noSupplier?: boolean;
    /** Rodapé: formulário travado, desabilita o salvar. */
    locked?: boolean;
    submitLabel?: string;
  }>(),
  {
    maxStep: 0,
    stepsUnlocked: false,
    errorSteps: () => [],
    saving: false,
    noSupplier: false,
    locked: false,
    submitLabel: "Salvar produto",
  },
);

const emit = defineEmits<{
  /** Indicador: o usuário clicou numa etapa liberada. */
  (e: "select", index: number): void;
  (e: "cancel"): void;
  (e: "back"): void;
  (e: "next"): void;
}>();

type StepState = "current" | "error" | "done" | "open" | "locked";

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
  Math.round(((props.currentStep + 1) / FORM_SECTIONS.length) * 100),
);

function canGoToStep(index: number): boolean {
  return props.stepsUnlocked || index <= props.maxStep;
}

function isStepDone(index: number): boolean {
  return !props.stepsUnlocked && index < props.maxStep;
}

function stepState(index: number): StepState {
  if (props.errorSteps.includes(index)) return "error";
  if (index === props.currentStep) return "current";
  if (isStepDone(index)) return "done";
  return canGoToStep(index) ? "open" : "locked";
}

function selectStep(index: number) {
  if (canGoToStep(index)) emit("select", index);
}

const isLastStep = computed(() => props.currentStep === FORM_SECTIONS.length - 1);
</script>

<template>
  <nav
    v-if="parte === 'indicador'"
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
            @click="selectStep(index)"
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
            @click="selectStep(index)"
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

  <div v-else class="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
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
        @click="emit('back')"
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
        @click="emit('next')"
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
</template>
