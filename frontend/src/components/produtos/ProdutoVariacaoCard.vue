<script setup lang="ts">
import type { FieldErrors, VariationFormItem } from "@/types";
import {
  ACCEPTED_IMAGE_INPUT,
  formatFileSize,
  toApiAssetUrl,
  validateImageFile,
} from "@/utils/uploads";
import { Icon } from "@iconify/vue";
import { computed, ref } from "vue";
import {
  DEFAULT_VARIATION_COLOR,
  ERROR_TEXT_CLASS,
  fieldClass,
  HINT_CLASS,
  LABEL_CLASS,
  UPLOAD_STATE_META,
  VARIATION_TYPE_OPTIONS,
  variationFieldId,
} from "@/utils/produtos/produtoFormConstantes";
import {
  isHexColor,
  normalizeHexColor,
  variationLabel,
} from "@/utils/produtos/produtoFormEstado";

const variation = defineModel<VariationFormItem>({ required: true });

const props = withDefaults(
  defineProps<{
    index: number;
    total: number;
    errors?: FieldErrors;
    /** Trava a edição (salvando ou produto já criado). */
    locked?: boolean;
    /** Produto criado: mostra o estado do envio da amostra. */
    uploadPhase?: boolean;
    /** Algum envio em andamento: bloqueia "Tentar de novo". */
    busy?: boolean;
  }>(),
  {
    errors: () => ({}),
    locked: false,
    uploadPhase: false,
    busy: false,
  },
);

const emit = defineEmits<{
  (e: "move", delta: -1 | 1): void;
  (e: "remove"): void;
  (e: "retry-sample"): void;
  /** Edição: apaga na API a amostra já gravada desta variação. */
  (e: "remove-existing-sample"): void;
}>();

const sampleInput = ref<HTMLInputElement | null>(null);
const sampleFileError = ref("");

const ids = computed(() => {
  const key = variation.value.key;
  return {
    name: variationFieldId.name(key),
    type: variationFieldId.type(key),
    details: variationFieldId.details(key),
    inStock: variationFieldId.inStock(key),
    sample: variationFieldId.sample(key),
  };
});

const title = computed(() => variationLabel(variation.value, props.index));

const sampleSrc = computed(() => {
  const sample = variation.value.sample;
  if (!sample) return "";
  return sample.uploadedUrl ? toApiAssetUrl(sample.uploadedUrl) : sample.previewUrl;
});

const sampleState = computed(() =>
  variation.value.sample ? UPLOAD_STATE_META[variation.value.sample.uploadState] : null,
);

function colorId(index: number) {
  return variationFieldId.color(variation.value.key, index);
}

function addColor() {
  const colors = variation.value.colorsHex;
  const last = colors[colors.length - 1];
  colors.push(last && isHexColor(last) ? last : DEFAULT_VARIATION_COLOR);
}

function removeColor(index: number) {
  variation.value.colorsHex.splice(index, 1);
}

function setColor(index: number, value: string) {
  variation.value.colorsHex[index] = normalizeHexColor(value);
}

function pickerValue(color: string) {
  const normalized = normalizeHexColor(color);
  return isHexColor(normalized) ? normalized.toLowerCase() : "#000000";
}

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
  <article
    class="rounded-xl border border-stone-200 bg-stone-50/60 p-4 sm:p-5 space-y-5"
    :aria-label="`Variação ${index + 1}`"
  >
    <!-- Cabeçalho: pré-visualização, título e ações -->
    <header class="flex items-center gap-3">
      <ColorSwatch :colors="variation.colorsHex" size="lg" />
      <div class="min-w-0 flex-1">
        <p class="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
          Variação {{ index + 1 }} de {{ total }}
        </p>
        <h3 class="text-sm font-semibold text-neutral-dark truncate">
          {{ title }}
        </h3>
      </div>
      <div class="flex items-center gap-1">
        <UiButton
          variant="ghost"
          size="icon"
          :disabled="locked || index === 0"
          title="Mover para cima"
          :aria-label="`Mover ${title} para cima`"
          @click="emit('move', -1)"
        >
          <Icon icon="mdi:arrow-up" class="w-4 h-4" />
        </UiButton>
        <UiButton
          variant="ghost"
          size="icon"
          :disabled="locked || index === total - 1"
          title="Mover para baixo"
          :aria-label="`Mover ${title} para baixo`"
          @click="emit('move', 1)"
        >
          <Icon icon="mdi:arrow-down" class="w-4 h-4" />
        </UiButton>
        <UiButton
          variant="ghost"
          size="icon"
          class="text-stone-500 hover:text-rose-600"
          :disabled="locked"
          title="Remover variação"
          :aria-label="`Remover ${title}`"
          @click="emit('remove')"
        >
          <Icon icon="mdi:trash-can-outline" class="w-4 h-4" />
        </UiButton>
      </div>
    </header>

    <!-- Nome e tipo -->
    <div class="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
      <div>
        <label :for="ids.name" :class="LABEL_CLASS">Nome da variação *</label>
        <input
          :id="ids.name"
          v-model="variation.name"
          type="text"
          maxlength="255"
          placeholder="Ex.: Carvalho Mel / Off White"
          :disabled="locked"
          :aria-invalid="errors[ids.name] ? 'true' : undefined"
          :aria-describedby="errors[ids.name] ? `${ids.name}-error` : undefined"
          :class="fieldClass(!!errors[ids.name])"
        />
        <p v-if="errors[ids.name]" :id="`${ids.name}-error`" :class="ERROR_TEXT_CLASS">
          {{ errors[ids.name] }}
        </p>
      </div>
      <div>
        <label :for="ids.type" :class="LABEL_CLASS">Tipo *</label>
        <select
          :id="ids.type"
          v-model="variation.variationType"
          :disabled="locked"
          :class="fieldClass(false)"
        >
          <option
            v-for="option in VARIATION_TYPE_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Cores -->
    <fieldset class="min-w-0">
      <legend :class="LABEL_CLASS">Cores</legend>
      <p class="text-xs text-stone-500 mb-3">
        Uma cor mostra um círculo sólido; duas, um círculo dividido ao meio; três
        ou mais, fatias iguais.
      </p>
      <div class="space-y-2">
        <div v-for="(color, colorIndex) in variation.colorsHex" :key="colorIndex">
          <div class="flex items-center gap-2">
            <input
              type="color"
              :value="pickerValue(color)"
              :disabled="locked"
              :aria-label="`Escolher a cor ${colorIndex + 1}`"
              class="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-stone-300 bg-white p-1 disabled:cursor-not-allowed disabled:opacity-60"
              @input="setColor(colorIndex, ($event.target as HTMLInputElement).value)"
            />
            <label :for="colorId(colorIndex)" class="sr-only">
              Código da cor {{ colorIndex + 1 }} (#RRGGBB)
            </label>
            <input
              :id="colorId(colorIndex)"
              v-model="variation.colorsHex[colorIndex]"
              type="text"
              maxlength="7"
              placeholder="#RRGGBB"
              spellcheck="false"
              autocomplete="off"
              :disabled="locked"
              :aria-invalid="errors[colorId(colorIndex)] ? 'true' : undefined"
              :aria-describedby="
                errors[colorId(colorIndex)] ? `${colorId(colorIndex)}-error` : undefined
              "
              :class="[fieldClass(!!errors[colorId(colorIndex)]), 'font-mono uppercase max-w-40']"
              @change="setColor(colorIndex, ($event.target as HTMLInputElement).value)"
            />
            <UiButton
              variant="ghost"
              size="icon"
              class="text-stone-500 hover:text-rose-600"
              :disabled="locked"
              :title="`Remover a cor ${colorIndex + 1}`"
              :aria-label="`Remover a cor ${colorIndex + 1}`"
              @click="removeColor(colorIndex)"
            >
              <Icon icon="mdi:close" class="w-4 h-4" />
            </UiButton>
          </div>
          <p
            v-if="errors[colorId(colorIndex)]"
            :id="`${colorId(colorIndex)}-error`"
            :class="ERROR_TEXT_CLASS"
          >
            {{ errors[colorId(colorIndex)] }}
          </p>
        </div>
        <p v-if="variation.colorsHex.length === 0" class="text-xs text-stone-500">
          Nenhuma cor definida.
        </p>
      </div>
      <UiButton
        variant="outline"
        size="xs"
        class="mt-3"
        :disabled="locked"
        @click="addColor"
      >
        <Icon icon="mdi:palette-outline" class="w-4 h-4" />
        Adicionar cor
      </UiButton>
    </fieldset>

    <!-- Detalhes de acabamento -->
    <fieldset class="min-w-0">
      <legend :class="LABEL_CLASS">Detalhes de acabamento</legend>
      <p class="text-xs text-stone-500 mb-3">
        Materiais por parte do móvel, como corpo, portas e puxadores.
      </p>
      <KeyValueEditor
        v-model="variation.finishDetails"
        :id-prefix="ids.details"
        :errors="errors"
        :disabled="locked"
        key-label="Parte"
        value-label="Acabamento"
        key-placeholder="Ex.: Portas"
        value-placeholder="Ex.: Off White"
        add-label="Adicionar detalhe"
        empty-text="Nenhum detalhe de acabamento."
      />
    </fieldset>

    <!-- Estoque -->
    <label :for="ids.inStock" class="flex items-start gap-3 cursor-pointer select-none">
      <input
        :id="ids.inStock"
        v-model="variation.inStock"
        type="checkbox"
        :disabled="locked"
        class="mt-0.5 w-4 h-4 rounded border-stone-300 text-secondary focus:ring-secondary cursor-pointer disabled:cursor-not-allowed"
      />
      <span>
        <span class="text-sm font-medium text-neutral-dark block">Em estoque</span>
        <span class="text-xs text-stone-500 block mt-0.5">
          Desmarque se este acabamento está indisponível no momento.
        </span>
      </span>
    </label>

    <!-- Amostra de textura -->
    <div>
      <span :class="LABEL_CLASS">Amostra de textura</span>
      <input
        :id="ids.sample"
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
  </article>
</template>
