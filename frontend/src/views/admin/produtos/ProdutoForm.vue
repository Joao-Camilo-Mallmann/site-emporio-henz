<script setup lang="ts">
import { useProdutoFormStore } from "@/stores/produtoForm";
import {
  FIELD_IDS,
  fieldStep,
  FORM_STEP_COUNT,
  FORM_STEP_TITLES,
} from "@/utils/admin/produtos/produtoFormConstantes";
import { Icon } from "@iconify/vue";
import { computed, nextTick, ref, watch } from "vue";
import { useRouter } from "vue-router";

// Formulário em etapas (uma seção visível por vez): indicador de etapas
// (`UiStepper`) fixo abaixo da barra de navegação, o cartão da etapa atual e
// o rodapé de ações fixo na base da tela. Este componente é o dono da
// navegação entre etapas; os dados ficam na store `produtoForm` e cada etapa
// é um componente de `components/admin/produtos/etapas/`. A validação
// fica na API, que devolve os campos com erro para abrir a etapa e focar o
// input correspondente.

const store = useProdutoFormStore();
const router = useRouter();

const formRoot = ref<HTMLFormElement | null>(null);
const alertRef = ref<HTMLElement | null>(null);

// Etapas: `maxStep` é a mais avançada já liberada.
const currentStep = ref(0);
const maxStep = ref(0);

const isLastStep = computed(() => currentStep.value === FORM_STEP_COUNT - 1);

/** Índices das etapas com erro devolvido pela API. */
const errorSteps = computed(() => [
  ...new Set(Object.keys(store.serverErrors).map(fieldStep)),
]);

// Mexer num campo apaga o erro que a API devolveu para ele.
function onFieldInteraction(event: Event) {
  const id = (event.target as HTMLElement | null)?.id;
  if (!id) return;

  delete store.serverErrors[id];
  if (id === FIELD_IDS.categoryId) {
    delete store.serverErrors[FIELD_IDS.subtypeId];
  }
}

/** Na fase de envio todas as etapas ficam abertas, para mostrar os arquivos. */
function isStepVisible(index: number): boolean {
  return store.saved || currentStep.value === index;
}

function showStep(index: number) {
  if (index < 0 || index >= FORM_STEP_COUNT) return;
  currentStep.value = index;
  maxStep.value = Math.max(maxStep.value, index);
  nextTick(() =>
    formRoot.value?.scrollIntoView({ behavior: "smooth", block: "start" }),
  );
}

function goToStep(index: number) {
  if (store.editando || index <= maxStep.value) showStep(index);
}

// Falha de gravação: abre a etapa do primeiro campo com erro e foca nele.
watch(
  () => store.serverErrors,
  (errors) => {
    const id = Object.keys(errors)[0];
    if (!id) return;
    if (!store.saved) currentStep.value = fieldStep(id);
    nextTick(() => {
      const element = document.getElementById(id);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      element?.focus({ preventScroll: true });
    });
  },
);

// O slug acompanha o nome: o erro dele some quando qualquer um dos dois muda.
watch(
  () => store.form.slug,
  () => delete store.serverErrors[FIELD_IDS.slug],
);

watch(
  () => store.errorMessage,
  (message) => {
    if (!message) return;
    nextTick(() =>
      alertRef.value?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  },
);

function handleSubmit() {
  if (store.noSupplier) return;

  // Enter numa etapa intermediária do cadastro avança, não salva.
  if (!store.editando && !isLastStep.value) showStep(currentStep.value + 1);
  else store.salvar();
}
</script>

<template>
  <form
    ref="formRoot"
    novalidate
    class="scroll-mt-40"
    @submit.prevent="handleSubmit"
    @input="onFieldInteraction"
    @change="onFieldInteraction"
  >
    <!-- Indicador de etapas, fixo abaixo da barra de navegação -->
    <UiStepper
      v-if="!store.saved"
      :steps="FORM_STEP_TITLES"
      :current="currentStep"
      :reached="maxStep"
      :free="store.editando"
      :errors="errorSteps"
      class="sticky top-28 z-30 -mx-4 mb-3 border-b border-stone-200 bg-stone-50/95 px-4 py-2 backdrop-blur-sm sm:mx-0 sm:rounded-xl sm:border md:top-20"
      @select="goToStep"
    />

    <div class="min-w-0 space-y-3">
      <ProdutoEtapaDadosBasicos v-show="isStepVisible(0)" />
      <ProdutoEtapaPreco v-show="isStepVisible(1)" />
      <ProdutoEtapaDimensoes v-show="isStepVisible(2)" />
      <ProdutoEtapaVariacoes v-show="isStepVisible(3)" />
      <ProdutoEtapaFotos v-show="isStepVisible(4)" />
      <ProdutoEtapaEspecificacoes v-show="isStepVisible(5)" />

      <!-- Alerta geral (erros 400/403 da API) -->
      <div
        v-if="store.errorMessage"
        ref="alertRef"
        role="alert"
        class="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5"
      >
        <Icon icon="mdi:alert-circle" class="w-4 h-4 shrink-0 text-rose-500" />
        <span>{{ store.errorMessage }}</span>
      </div>
    </div>

    <!-- Rodapé de ações, fixo na base da tela -->
    <div
      v-if="!store.saved"
      class="sticky bottom-0 z-20 -mx-4 mt-3 flex items-center justify-between gap-3 border-t border-stone-200 bg-stone-50/95 px-4 py-2.5 backdrop-blur-sm sm:mx-0 sm:px-0"
    >
      <UiButton
        type="button"
        variant="outline"
        size="md"
        :disabled="store.saving"
        @click="router.push(store.destino)"
      >
        Cancelar
      </UiButton>
      <div class="flex items-center gap-2 sm:gap-3">
        <span class="hidden text-xs text-stone-500 sm:inline">
          Etapa {{ currentStep + 1 }} de {{ FORM_STEP_COUNT }}
        </span>
        <UiButton
          v-if="currentStep > 0"
          type="button"
          variant="outline"
          size="md"
          :disabled="store.saving"
          aria-label="Voltar"
          @click="showStep(currentStep - 1)"
        >
          <Icon icon="mdi:arrow-left" class="w-4 h-4" />
          <span class="hidden sm:inline">Voltar</span>
        </UiButton>
        <UiButton
          v-if="!isLastStep"
          type="button"
          :variant="store.editando ? 'outline' : 'secondary'"
          size="md"
          :disabled="store.saving"
          @click="showStep(currentStep + 1)"
        >
          Próximo
          <Icon icon="mdi:arrow-right" class="w-4 h-4" />
        </UiButton>
        <UiButton
          v-if="isLastStep || store.editando"
          variant="primary"
          type="submit"
          size="md"
          :loading="store.saving"
          :disabled="store.noSupplier || store.locked"
        >
          <Icon
            v-if="!store.saving"
            icon="mdi:content-save-outline"
            class="w-4 h-4"
          />
          {{ store.editando ? "Salvar alterações" : "Salvar produto" }}
        </UiButton>
      </div>
    </div>
  </form>
</template>
