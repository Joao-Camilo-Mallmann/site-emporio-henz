<script setup lang="ts">
import { useProdutoFormStore } from "@/stores/produtoForm";
import type { VariationFormItem } from "@/types";
import { Icon } from "@iconify/vue";
import { storeToRefs } from "pinia";
import { computed, nextTick } from "vue";
import {
  createLocalKey,
  DEFAULT_VARIATION_COLOR,
  ERROR_TEXT_CLASS,
  fieldClass,
  isHexColor,
  LABEL_CLASS,
  normalizeHexColor,
  VARIATION_TYPE_OPTIONS,
  variationFieldId,
  variationLabel,
} from "@/utils/admin/produtos/produtoFormConstantes";

// Etapa 4 do formulário de produto.
// Lista de variações: incluir, mover e remover. A ordem da tela define o
// `sortOrder` enviado à API (começando em 0). Cada cartão tem cabeçalho,
// nome e tipo; cores, acabamento e estoque ficam em `ProdutoVariacaoAcabamento`
// e a amostra de textura em `ProdutoVariacaoAmostra`.

const store = useProdutoFormStore();
const {
  form,
  serverErrors: errors,
  locked,
  busy,
  saved: uploadPhase,
} = storeToRefs(store);
const variations = computed(() => form.value.variations);

function addVariation() {
  const variation: VariationFormItem = {
    key: createLocalKey(),
    id: null,
    name: "",
    variationType: "COLOR",
    colorsHex: [DEFAULT_VARIATION_COLOR],
    finishDetails: [],
    inStock: true,
    sample: null,
    existingSampleUrl: null,
  };
  variations.value.push(variation);
  nextTick(() =>
    document.getElementById(variationFieldId.name(variation.key))?.focus(),
  );
}

function moveVariation(index: number, delta: -1 | 1) {
  const target = index + delta;
  const list = variations.value;
  if (target < 0 || target >= list.length) return;
  const [item] = list.splice(index, 1);
  list.splice(target, 0, item);
}

function removeVariation(index: number) {
  const [removed] = variations.value.splice(index, 1);
  if (!removed) return;
  if (removed.sample) URL.revokeObjectURL(removed.sample.previewUrl);
  // As fotos da variação removida voltam a ser gerais.
  form.value.photos.forEach((photo) => {
    if (photo.variationKey === removed.key) photo.variationKey = null;
  });
}

// Círculo de pré-visualização das cores: sólido (1 cor), dividido ao meio (2)
// ou em fatias iguais (3+). As cores são dados do produto e entram por
// `:style`, não por classe (design D11).

function swatchStyle(valid: string[]): { background?: string } {
  if (valid.length === 0) return {};
  if (valid.length === 1) return { background: valid[0] };
  if (valid.length === 2) {
    return {
      background: `linear-gradient(90deg, ${valid[0]} 50%, ${valid[1]} 50%)`,
    };
  }
  const slice = 100 / valid.length;
  const stops = valid
    .map(
      (color, index) =>
        `${color} ${(index * slice).toFixed(3)}% ${((index + 1) * slice).toFixed(3)}%`,
    )
    .join(", ");
  return { background: `conic-gradient(${stops})` };
}

// Título e prévia de cada variação, calculados uma vez por mudança da lista
// (o template usa cada valor em vários atributos).
const resumos = computed(() =>
  variations.value.map((variation, index) => {
    const valid = variation.colorsHex.map(normalizeHexColor).filter(isHexColor);
    return {
      titulo: variationLabel(variation, index),
      semCor: valid.length === 0,
      swatchStyle: swatchStyle(valid),
      swatchLabel:
        valid.length > 0 ? `Cores: ${valid.join(", ")}` : "Nenhuma cor válida",
    };
  }),
);
</script>

<template>
  <ProdutoEtapaCartao
    id="secao-variacoes"
    :numero="4"
    titulo="Variações de acabamento"
    descricao="Opcional. A ordem da lista é a ordem de exibição no catálogo."
  >
    <div class="space-y-4">
      <div
        v-if="variations.length === 0"
        class="rounded-xl border border-dashed border-stone-300 bg-stone-50/60 px-4 py-8 text-center"
      >
        <Icon icon="mdi:palette-swatch-outline" class="mx-auto w-8 h-8 text-stone-400" />
        <p class="mt-2 text-sm text-stone-600">Nenhuma variação de acabamento.</p>
        <p class="text-xs text-stone-500">
          Adicione as cores, tecidos, madeiras ou acabamentos em que o móvel é
          oferecido.
        </p>
      </div>

      <article
        v-for="(variation, index) in variations"
        :key="variation.key"
        class="rounded-xl border border-stone-200 bg-stone-50/60 p-4 sm:p-5 space-y-5"
        :aria-label="`Variação ${index + 1}`"
      >
        <!-- Cabeçalho: pré-visualização, título e ações -->
        <header class="flex items-center gap-3">
          <span
            role="img"
            :aria-label="resumos[index].swatchLabel"
            :title="resumos[index].swatchLabel"
            class="inline-block shrink-0 rounded-full border shadow-2xs w-12 h-12"
            :class="
              resumos[index].semCor
                ? 'border-dashed border-stone-300 bg-stone-50'
                : 'border-black/10'
            "
            :style="resumos[index].swatchStyle"
          />
          <div class="min-w-0 flex-1">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Variação {{ index + 1 }} de {{ variations.length }}
            </p>
            <h3 class="text-sm font-semibold text-neutral-dark truncate">
              {{ resumos[index].titulo }}
            </h3>
          </div>
          <div class="flex items-center gap-1">
            <UiButton
              variant="ghost"
              size="icon"
              :disabled="locked || index === 0"
              title="Mover para cima"
              :aria-label="`Mover ${resumos[index].titulo} para cima`"
              @click="moveVariation(index, -1)"
            >
              <Icon icon="mdi:arrow-up" class="w-4 h-4" />
            </UiButton>
            <UiButton
              variant="ghost"
              size="icon"
              :disabled="locked || index === variations.length - 1"
              title="Mover para baixo"
              :aria-label="`Mover ${resumos[index].titulo} para baixo`"
              @click="moveVariation(index, 1)"
            >
              <Icon icon="mdi:arrow-down" class="w-4 h-4" />
            </UiButton>
            <UiButton
              variant="ghost"
              size="icon"
              class="text-stone-500 hover:text-rose-600"
              :disabled="locked"
              title="Remover variação"
              :aria-label="`Remover ${resumos[index].titulo}`"
              @click="removeVariation(index)"
            >
              <Icon icon="mdi:trash-can-outline" class="w-4 h-4" />
            </UiButton>
          </div>
        </header>

        <!-- Nome e tipo -->
        <div class="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4">
          <div>
            <label :for="variationFieldId.name(variation.key)" :class="LABEL_CLASS">
              Nome da variação *
            </label>
            <input
              :id="variationFieldId.name(variation.key)"
              v-model="variation.name"
              type="text"
              maxlength="255"
              placeholder="Ex.: Carvalho Mel / Off White"
              :disabled="locked"
              :aria-invalid="errors[variationFieldId.name(variation.key)] ? 'true' : undefined"
              :aria-describedby="
                errors[variationFieldId.name(variation.key)]
                  ? `${variationFieldId.name(variation.key)}-error`
                  : undefined
              "
              :class="fieldClass(!!errors[variationFieldId.name(variation.key)])"
            />
            <p
              v-if="errors[variationFieldId.name(variation.key)]"
              :id="`${variationFieldId.name(variation.key)}-error`"
              :class="ERROR_TEXT_CLASS"
            >
              {{ errors[variationFieldId.name(variation.key)] }}
            </p>
          </div>
          <div>
            <UiSelect
              :id="variationFieldId.type(variation.key)"
              v-model="variation.variationType"
              label="Tipo"
              required
              :options="VARIATION_TYPE_OPTIONS"
              :disabled="locked"
            />
          </div>
        </div>

        <ProdutoVariacaoAcabamento
          v-model="variations[index]"
          :errors="errors"
          :locked="locked"
        />

        <ProdutoVariacaoAmostra
          v-model="variations[index]"
          :title="resumos[index].titulo"
          :locked="locked"
          :upload-phase="uploadPhase"
          :busy="busy"
          @retry-sample="store.enviarArquivos(variation.key)"
          @remove-existing-sample="
            store.pendingRemoval = {
              kind: 'sample',
              variationKey: variation.key,
            }
          "
        />
      </article>

      <UiButton variant="outline" size="sm" :disabled="locked" @click="addVariation">
        <Icon icon="mdi:plus" class="w-4 h-4" />
        Adicionar variação
      </UiButton>
    </div>
  </ProdutoEtapaCartao>
</template>
