<script setup lang="ts">
import type { FieldErrors, VariationDraft } from "@/types";
import { Icon } from "@iconify/vue";
import { nextTick } from "vue";
import ProdutoVariacaoCard from "./ProdutoVariacaoCard.vue";
import { createVariationDraft, variationFieldId } from "./produtoDraft";

// Lista de variações: incluir, mover e remover. A ordem da tela define o
// `sortOrder` enviado à API (começando em 0).

const variations = defineModel<VariationDraft[]>({ required: true });

withDefaults(
  defineProps<{
    errors?: FieldErrors;
    locked?: boolean;
    uploadPhase?: boolean;
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
  /** Variação removida: as fotos associadas voltam a ser gerais. */
  (e: "removed", key: string): void;
  (e: "retry-sample", key: string): void;
  /** Edição: apaga na API a amostra já gravada da variação. */
  (e: "remove-existing-sample", key: string): void;
}>();

function addVariation() {
  const variation = createVariationDraft();
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
  emit("removed", removed.key);
}
</script>

<template>
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

    <ProdutoVariacaoCard
      v-for="(variation, index) in variations"
      :key="variation.key"
      v-model="variations[index]"
      :index="index"
      :total="variations.length"
      :errors="errors"
      :locked="locked"
      :upload-phase="uploadPhase"
      :busy="busy"
      @move="(delta) => moveVariation(index, delta)"
      @remove="removeVariation(index)"
      @retry-sample="emit('retry-sample', variation.key)"
      @remove-existing-sample="emit('remove-existing-sample', variation.key)"
    />

    <UiButton variant="outline" size="sm" :disabled="locked" @click="addVariation">
      <Icon icon="mdi:plus" class="w-4 h-4" />
      Adicionar variação
    </UiButton>
  </div>
</template>
