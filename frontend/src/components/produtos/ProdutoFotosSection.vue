<script setup lang="ts">
import type { PhotoFormItem, ProductImageDto, VariationFormItem } from "@/types";
import {
  ACCEPTED_IMAGE_INPUT,
  formatFileSize,
  toApiAssetUrl,
  validateImageFile,
} from "@/utils/uploads";
import { Icon } from "@iconify/vue";
import { computed, ref } from "vue";
import {
  fieldClass,
  UPLOAD_STATE_META,
} from "@/utils/produtos/produtoFormConstantes";
import {
  coverPhotoKey,
  createPhotoItem,
  variationLabel,
} from "@/utils/produtos/produtoFormEstado";

// Fotos do produto: seleção múltipla com preview local (object URL, sem
// Base64), associação opcional a uma variação, ordem de envio, indicação da
// capa e estado do envio de cada arquivo.

const photos = defineModel<PhotoFormItem[]>({ required: true });

const props = withDefaults(
  defineProps<{
    variations: VariationFormItem[];
    locked?: boolean;
    uploadPhase?: boolean;
    busy?: boolean;
    /** Fotos já gravadas na API (só na edição). */
    existingImages?: ProductImageDto[];
  }>(),
  {
    locked: false,
    uploadPhase: false,
    busy: false,
    existingImages: () => [],
  },
);

const emit = defineEmits<{
  (e: "retry-photo", key: string): void;
  (e: "remove-image", imageId: string): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);
const rejections = ref<string[]>([]);
const dragging = ref(false);

// Com fotos já publicadas, a capa está entre elas: as novas entram no fim do
// carrossel e nenhuma foto local recebe o selo de capa.
const existingCoverId = computed(() => {
  const list = props.existingImages;
  if (list.length === 0) return null;
  return (list.find((image) => !image.variationId) ?? list[0]).id;
});

const coverKey = computed(() =>
  props.existingImages.length > 0 ? null : coverPhotoKey(photos.value),
);

const hasGeneralPhoto = computed(
  () =>
    photos.value.some((photo) => !photo.variationKey) ||
    props.existingImages.some((image) => !image.variationId),
);

const variationOptions = computed(() =>
  props.variations.map((variation, index) => ({
    key: variation.key,
    label: variationLabel(variation, index),
  })),
);

function photoSrc(photo: PhotoFormItem) {
  return photo.uploaded
    ? toApiAssetUrl(photo.uploaded.thumbnailUrl)
    : photo.previewUrl;
}

function photoVariationName(photo: PhotoFormItem) {
  if (!photo.variationKey) return "";
  return (
    variationOptions.value.find((option) => option.key === photo.variationKey)
      ?.label ?? ""
  );
}

function photoAlt(photo: PhotoFormItem, index: number) {
  const variationName = photoVariationName(photo);
  const base = `Foto ${index + 1} do produto (${photo.file.name})`;
  return variationName ? `${base}, variação ${variationName}` : base;
}

function openPicker() {
  fileInput.value?.click();
}

function addFiles(files: FileList | File[]) {
  const rejected: string[] = [];
  for (const file of Array.from(files)) {
    const error = validateImageFile(file);
    if (error) {
      rejected.push(error);
      continue;
    }
    photos.value.push(createPhotoItem(file, URL.createObjectURL(file)));
  }
  rejections.value = rejected;
}

function onFilesSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files) addFiles(input.files);
  input.value = "";
}

function onDragOver() {
  if (!props.locked) dragging.value = true;
}

function onDrop(event: DragEvent) {
  dragging.value = false;
  if (props.locked) return;
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) addFiles(files);
}

function movePhoto(index: number, delta: -1 | 1) {
  const target = index + delta;
  const list = photos.value;
  if (target < 0 || target >= list.length) return;
  const [item] = list.splice(index, 1);
  list.splice(target, 0, item);
}

function removePhoto(index: number) {
  const [removed] = photos.value.splice(index, 1);
  if (removed) URL.revokeObjectURL(removed.previewUrl);
}

function variationSelectId(photo: PhotoFormItem) {
  return `photo-${photo.key}-variation`;
}

/** Nome da variação de uma foto já publicada, pelo `id` real da variação. */
function existingImageVariationName(image: ProductImageDto) {
  if (!image.variationId) return "";
  const index = props.variations.findIndex(
    (variation) => variation.id === image.variationId,
  );
  return index === -1 ? "" : variationLabel(props.variations[index], index);
}

function existingImageAlt(image: ProductImageDto, index: number) {
  const variationName = existingImageVariationName(image);
  const base = `Foto ${index + 1} já publicada do produto`;
  return variationName ? `${base}, variação ${variationName}` : base;
}
</script>

<template>
  <div class="space-y-4">
    <!-- Fotos já publicadas (edição): removidas direto na API -->
    <div v-if="existingImages.length > 0" class="space-y-2.5">
      <div class="flex items-baseline justify-between gap-3">
        <h3 class="text-sm font-semibold text-neutral-dark">
          Fotos publicadas
        </h3>
        <span class="text-xs text-stone-500">
          {{
            existingImages.length === 1
              ? "1 foto no carrossel"
              : `${existingImages.length} fotos no carrossel`
          }}
        </span>
      </div>

      <ol
        class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        aria-label="Fotos já publicadas, na ordem do carrossel"
      >
        <li
          v-for="(image, index) in existingImages"
          :key="image.id"
          class="rounded-xl border bg-white overflow-hidden"
          :class="
            image.id === existingCoverId ? 'border-secondary/60' : 'border-stone-200'
          "
        >
          <div class="relative aspect-[4/3] bg-stone-100">
            <img
              :src="toApiAssetUrl(image.thumbnailUrl)"
              :alt="existingImageAlt(image, index)"
              class="absolute inset-0 w-full h-full object-cover"
            />
            <span
              class="absolute top-2 left-2 rounded-full bg-neutral-dark/80 px-2 py-0.5 text-[11px] font-semibold text-white"
            >
              {{ index + 1 }}
            </span>
            <span
              v-if="image.id === existingCoverId"
              class="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-white"
            >
              <Icon icon="mdi:star" class="w-3.5 h-3.5" />
              Capa
            </span>
          </div>

          <div class="p-2.5 flex items-center justify-between gap-2">
            <span class="text-[11px] text-stone-500 truncate">
              {{ existingImageVariationName(image) || "Foto geral" }}
            </span>
            <UiButton
              variant="ghost"
              size="icon"
              class="h-7 w-7 shrink-0 text-stone-500 hover:text-rose-600 hover:bg-rose-50"
              :disabled="locked || busy"
              title="Excluir foto publicada"
              :aria-label="`Excluir a foto ${index + 1} já publicada`"
              @click="emit('remove-image', image.id)"
            >
              <Icon icon="mdi:trash-can-outline" class="w-4 h-4" />
            </UiButton>
          </div>
        </li>
      </ol>

      <p class="text-xs text-stone-500">
        A exclusão de uma foto publicada é imediata e não espera o botão de
        salvar. As fotos novas entram no fim do carrossel.
      </p>
    </div>

    <!-- Área de seleção -->
    <div
      class="rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors"
      :class="
        dragging
          ? 'border-secondary bg-surface-tint/40'
          : 'border-stone-300 bg-stone-50/60'
      "
      @dragover.prevent="onDragOver"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
    >
      <Icon icon="mdi:image-multiple-outline" class="mx-auto w-8 h-8 text-stone-400" />
      <p class="mt-2 text-sm text-stone-600">
        Arraste as fotos para cá ou escolha os arquivos.
      </p>
      <p class="text-xs text-stone-500">
        JPEG, PNG ou WebP, até 2 MB cada. A imagem não é comprimida no navegador.
      </p>
      <input
        id="product-photos-input"
        ref="fileInput"
        type="file"
        multiple
        class="sr-only"
        tabindex="-1"
        :accept="ACCEPTED_IMAGE_INPUT"
        :disabled="locked"
        aria-label="Arquivos das fotos do produto"
        @change="onFilesSelected"
      />
      <UiButton
        variant="secondary"
        size="sm"
        class="mt-4"
        :disabled="locked"
        @click="openPicker"
      >
        <Icon icon="mdi:upload" class="w-4 h-4" />
        Selecionar fotos
      </UiButton>
    </div>

    <!-- Arquivos recusados na seleção -->
    <div
      v-if="rejections.length > 0"
      role="alert"
      class="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700"
    >
      <div class="flex items-start gap-2.5">
        <Icon icon="mdi:alert-circle" class="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
        <div class="min-w-0 flex-1">
          <p class="font-medium">
            {{ rejections.length === 1 ? "1 arquivo recusado" : `${rejections.length} arquivos recusados` }}
          </p>
          <ul class="mt-1 space-y-0.5 text-xs">
            <li v-for="(message, index) in rejections" :key="index">{{ message }}</li>
          </ul>
        </div>
        <UiButton
          variant="ghost"
          size="xs"
          class="text-rose-700 hover:bg-rose-100"
          aria-label="Fechar aviso de arquivos recusados"
          title="Fechar"
          @click="rejections = []"
        >
          <Icon icon="mdi:close" class="w-4 h-4" />
        </UiButton>
      </div>
    </div>

    <p v-if="photos.length > 0 && !hasGeneralPhoto" class="text-xs text-amber-700">
      Todas as fotos estão associadas a variações. Sem foto geral, a capa será a
      primeira foto da lista.
    </p>

    <!-- Grade de fotos -->
    <ol
      v-if="photos.length > 0"
      class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      aria-label="Fotos na ordem de envio"
    >
      <li
        v-for="(photo, index) in photos"
        :key="photo.key"
        class="rounded-xl border bg-white overflow-hidden flex flex-col"
        :class="photo.key === coverKey ? 'border-secondary/60' : 'border-stone-200'"
      >
        <div class="relative aspect-[4/3] bg-stone-100">
          <img
            :src="photoSrc(photo)"
            :alt="photoAlt(photo, index)"
            class="absolute inset-0 w-full h-full object-cover"
          />
          <span
            class="absolute top-2 left-2 rounded-full bg-neutral-dark/80 px-2 py-0.5 text-[11px] font-semibold text-white"
          >
            {{ index + 1 }}
          </span>
          <span
            v-if="photo.key === coverKey"
            class="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold text-white"
          >
            <Icon icon="mdi:star" class="w-3.5 h-3.5" />
            Capa
          </span>
          <span
            v-if="uploadPhase"
            class="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
            :class="UPLOAD_STATE_META[photo.uploadState].classes"
          >
            <Icon
              :icon="UPLOAD_STATE_META[photo.uploadState].icon"
              class="w-3.5 h-3.5"
              :class="{ 'animate-spin': UPLOAD_STATE_META[photo.uploadState].spin }"
            />
            {{ UPLOAD_STATE_META[photo.uploadState].label }}
          </span>
        </div>

        <div class="p-3 space-y-3 flex-1 flex flex-col">
          <div class="min-w-0">
            <p class="text-xs text-neutral-dark truncate" :title="photo.file.name">
              {{ photo.file.name }}
            </p>
            <p class="text-[11px] text-stone-500">{{ formatFileSize(photo.file.size) }}</p>
          </div>

          <div>
            <label
              :for="variationSelectId(photo)"
              class="block text-xs font-semibold text-neutral-dark mb-1"
            >
              Variação
            </label>
            <select
              :id="variationSelectId(photo)"
              v-model="photo.variationKey"
              :disabled="locked || variationOptions.length === 0"
              :class="[fieldClass(false), 'py-2']"
            >
              <option :value="null">Foto geral do produto</option>
              <option
                v-for="option in variationOptions"
                :key="option.key"
                :value="option.key"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <div
            v-if="uploadPhase && photo.uploadState === 'error'"
            class="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700 space-y-2"
          >
            <p>{{ photo.uploadError || "Não foi possível enviar a foto." }}</p>
            <p class="text-rose-600/80">A foto reenviada entra no fim do carrossel.</p>
            <UiButton
              variant="danger"
              size="xs"
              :disabled="busy"
              @click="emit('retry-photo', photo.key)"
            >
              <Icon icon="mdi:refresh" class="w-4 h-4" />
              Tentar de novo
            </UiButton>
          </div>

          <div
            v-if="!locked"
            class="mt-auto flex items-center justify-between gap-1 pt-1 border-t border-stone-100"
          >
            <div class="flex items-center gap-1">
              <UiButton
                variant="ghost"
                size="icon"
                :disabled="index === 0"
                title="Mover para antes"
                :aria-label="`Mover a foto ${index + 1} para antes`"
                @click="movePhoto(index, -1)"
              >
                <Icon icon="mdi:arrow-left" class="w-4 h-4" />
              </UiButton>
              <UiButton
                variant="ghost"
                size="icon"
                :disabled="index === photos.length - 1"
                title="Mover para depois"
                :aria-label="`Mover a foto ${index + 1} para depois`"
                @click="movePhoto(index, 1)"
              >
                <Icon icon="mdi:arrow-right" class="w-4 h-4" />
              </UiButton>
            </div>
            <UiButton
              variant="ghost"
              size="icon"
              class="text-stone-500 hover:text-rose-600"
              title="Remover foto"
              :aria-label="`Remover a foto ${index + 1}`"
              @click="removePhoto(index)"
            >
              <Icon icon="mdi:trash-can-outline" class="w-4 h-4" />
            </UiButton>
          </div>
        </div>
      </li>
    </ol>

    <p v-else-if="existingImages.length > 0" class="text-xs text-stone-500">
      Nenhuma foto nova selecionada.
    </p>

    <p v-else class="text-xs text-stone-500">
      Nenhuma foto selecionada. A primeira foto sem variação será a capa do produto
      no catálogo.
    </p>
  </div>
</template>
