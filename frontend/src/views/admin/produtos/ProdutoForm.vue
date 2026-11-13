<script setup lang="ts">
import { useProdutoFormStore } from "@/stores/produtoForm";
import {
  FIELD_IDS,
  fieldStep,
  FORM_STEP_COUNT,
} from "@/utils/admin/produtos/produtoFormConstantes";
import { Icon } from "@iconify/vue";
import { computed, nextTick, ref, watch } from "vue";
import { useRouter } from "vue-router";

// Formulário em etapas (uma seção visível por vez). Este componente é o dono
// da navegação entre etapas; os dados ficam na store `produtoForm` e cada
// etapa é um componente de `components/admin/produtos/etapas/`. A validação
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
    class="scroll-mt-28"
    :class="
      store.saved
        ? ''
        : 'lg:grid lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-8 lg:items-start'
    "
    @submit.prevent="handleSubmit"
    @input="onFieldInteraction"
    @change="onFieldInteraction"
  >
    <ProdutoFormNavegacao
      v-if="!store.saved"
      parte="indicador"
      :current-step="currentStep"
      :max-step="maxStep"
      :steps-unlocked="store.editando"
      :error-steps="errorSteps"
      @select="goToStep"
    />

    <div class="min-w-0 space-y-6">
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

      <ProdutoFormNavegacao
        v-if="!store.saved"
        parte="rodape"
        :current-step="currentStep"
        :steps-unlocked="store.editando"
        :saving="store.saving"
        :no-supplier="store.noSupplier"
        :locked="store.locked"
        :submit-label="store.editando ? 'Salvar alterações' : 'Salvar produto'"
        @cancel="router.push(store.destino)"
        @back="showStep(currentStep - 1)"
        @next="showStep(currentStep + 1)"
      />
    </div>
  </form>
</template>
