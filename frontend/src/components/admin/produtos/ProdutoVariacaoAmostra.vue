<script setup lang="ts">
import type { VariationFormItem } from "@/types";
import {
  ACCEPTED_IMAGE_INPUT,
  formatFileSize,
  toApiAssetUrl,
  validateImageFile,
} from "@/utils/uploads";
import { Icon } from "@iconify/vue";
import { computed, ref } from "vue";
import {
  ERROR_TEXT_CLASS,
  HINT_CLASS,
  LABEL_CLASS,
  UPLOAD_STATE_META,
  variationFieldId,
} from "@/utils/admin/produtos/produtoFormConstantes";

// Amostra de textura de uma variação: arquivo novo (com estado de envio) ou
// amostra já publicada na edição.

const variation = defineModel<VariationFormItem>({ required: true });

withDefaults(
  defineProps<{
    /** Rótulo da variação, usado nos textos de acessibilidade. */
    title: string;
    /** Trava a edição (salvando ou produto já criado). */
    locked?: boolean;
    /** Produto criado: mostra o estado do envio da amostra. */
    uploadPhase?: boolean;
    /** Algum envio em andamento: bloqueia "Tentar de novo". */
    busy?: boolean;
  }>(),
  {
    locked: false,
    uploadPhase: false,
    busy: false,
  },
);

const emit = defineEmits<{
  (e: "retry-sample"): void;
  /** Edição: apaga na API a amostra já gravada desta variação. */
  (e: "remove-existing-sample"): void;
}>();

const sampleInput = ref<HTMLInputElement | null>(null);
const sampleFileError = ref("");

const sampleId = computed(() => variationFieldId.sample(variation.value.key));

const sampleSrc = computed(() => {
  const sample = variation.value.sample;
  if (!sample) return "";
  return sample.uploadedUrl ? toApiAssetUrl(sample.uploadedUrl) : sample.previewUrl;
});

const sampleState = computed(() =>
  variation.value.sample ? UPLOAD_STATE_META[variation.value.sample.uploadState] : null,
);

function openSamplePicker() {
  sampleInput.value?.click();
}

function onSampleSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  const error = validateImageFile(file);
  if (error) {
    sampleFileError.value = error;
    return;
  }

  sampleFileError.value = "";
  if (variation.value.sample) {
    URL.revokeObjectURL(variation.value.sample.previewUrl);
  }
  variation.value.sample = {
    file,
    previewUrl: URL.createObjectURL(file),
    uploadState: "pending",
    uploadedUrl: null,
  };
}

function removeSample() {
  if (variation.value.sample) {
    URL.revokeObjectURL(variation.value.sample.previewUrl);
  }
  variation.value.sample = null;
  sampleFileError.value = "";
}
</script>

<template>
  <div>
    <span :class="LABEL_CLASS">Amostra de textura</span>
    <input
      :id="sampleId"
      ref="sampleInput"
      type="file"
      class="sr-only"
      tabindex="-1"
      :accept="ACCEPTED_IMAGE_INPUT"
      :disabled="locked"
      :aria-label="`Arquivo da amostra de ${title}`"
      @change="onSampleSelected"
    />

    <div v-if="variation.sample" class="flex items-start gap-3">
      <img
        :src="sampleSrc"
        :alt="`Amostra da textura de ${title}`"
        class="w-20 h-20 shrink-0 rounded-lg border border-stone-200 object-cover bg-white"
      />
      <div class="min-w-0 flex-1 space-y-1.5">
        <p class="text-xs text-neutral-dark truncate" :title="variation.sample.file.name">
          {{ variation.sample.file.name }}
        </p>
        <p class="text-xs text-stone-500">
          {{ formatFileSize(variation.sample.file.size) }}
        </p>

        <span
          v-if="uploadPhase && sampleState"
          class="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
          :class="sampleState.classes"
        >
          <Icon
            :icon="sampleState.icon"
            class="w-3.5 h-3.5"
            :class="{ 'animate-spin': sampleState.spin }"
          />
          {{ sampleState.label }}
        </span>

        <div v-if="!locked" class="flex flex-wrap gap-2">
          <UiButton variant="outline" size="xs" @click="openSamplePicker">
            <Icon icon="mdi:swap-horizontal" class="w-4 h-4" />
            Trocar
          </UiButton>
          <UiButton
            variant="ghost"
            size="xs"
            class="text-stone-500 hover:text-rose-600"
            @click="removeSample"
          >
            <Icon icon="mdi:trash-can-outline" class="w-4 h-4" />
            Remover
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Amostra já gravada (edição): trocar envia arquivo novo ao salvar -->
    <div
      v-else-if="variation.existingSampleUrl"
      class="flex items-start gap-3"
    >
      <img
        :src="toApiAssetUrl(variation.existingSampleUrl)"
        :alt="`Amostra da textura de ${title}`"
        class="w-20 h-20 shrink-0 rounded-lg border border-stone-200 object-cover bg-white"
      />
      <div class="min-w-0 flex-1 space-y-1.5">
        <p class="text-xs text-neutral-dark">Amostra publicada</p>
        <p class="text-xs text-stone-500">
          Trocar envia o arquivo novo ao salvar. Remover é imediato.
        </p>

        <div v-if="!locked" class="flex flex-wrap gap-2">
          <UiButton variant="outline" size="xs" @click="openSamplePicker">
            <Icon icon="mdi:swap-horizontal" class="w-4 h-4" />
            Trocar
          </UiButton>
          <UiButton
            variant="ghost"
            size="xs"
            class="text-stone-500 hover:text-rose-600"
            :disabled="busy"
            @click="emit('remove-existing-sample')"
          >
            <Icon icon="mdi:trash-can-outline" class="w-4 h-4" />
            Remover
          </UiButton>
        </div>
      </div>
    </div>

    <UiButton
      v-else
      variant="outline"
      size="sm"
      :disabled="locked"
      @click="openSamplePicker"
    >
      <Icon icon="mdi:image-plus-outline" class="w-4 h-4" />
      Escolher amostra
    </UiButton>

    <p
      v-if="!variation.sample && !variation.existingSampleUrl"
      :class="HINT_CLASS"
    >
      Opcional. Foto aproximada do tecido, madeira ou acabamento, em JPEG, PNG ou
      WebP de até 2 MB.
    </p>
    <p v-if="sampleFileError" role="alert" :class="ERROR_TEXT_CLASS">
      {{ sampleFileError }}
    </p>

    <div
      v-if="uploadPhase && variation.sample?.uploadState === 'error'"
      class="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between"
    >
      <span>{{ variation.sample.uploadError || "Não foi possível enviar a amostra." }}</span>
      <UiButton
        variant="danger"
        size="xs"
        :disabled="busy"
        @click="emit('retry-sample')"
      >
        <Icon icon="mdi:refresh" class="w-4 h-4" />
        Tentar de novo
      </UiButton>
    </div>
  </div>
</template>
