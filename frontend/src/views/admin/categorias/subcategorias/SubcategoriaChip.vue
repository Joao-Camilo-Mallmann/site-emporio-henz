<script setup lang="ts">
import type { ISubtype, SubtypeDraftItem } from "@/types";
import { Icon } from "@iconify/vue";
import { ref } from "vue";
import SubcategoriaDeleteConfirm from "./SubcategoriaDeleteConfirm.vue";
import SubcategoriaEditPopover from "./SubcategoriaEditPopover.vue";

interface Props {
  subtype: SubtypeDraftItem | ISubtype;
  isDraft?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isDraft: false,
  loading: false,
});

const emit = defineEmits<{
  (e: "update", data: { name: string; slug: string; active: boolean }): void;
  (e: "remove"): void;
}>();

const isEditing = ref(false);
const isConfirmingDelete = ref(false);

function handleOpenEdit() {
  if (props.loading) return;
  isConfirmingDelete.value = false;
  isEditing.value = true;
}

function handleCloseEdit() {
  isEditing.value = false;
}

function handleSaveEdit(data: { name: string; slug: string; active: boolean }) {
  emit("update", data);
  isEditing.value = false;
}

function handleOpenDelete() {
  if (props.loading) return;
  isEditing.value = false;
  if (props.isDraft) {
    emit("remove");
  } else {
    isConfirmingDelete.value = true;
  }
}

function handleCloseDelete() {
  isConfirmingDelete.value = false;
}

function handleConfirmDelete() {
  emit("remove");
  isConfirmingDelete.value = false;
}
</script>

<template>
  <div class="relative inline-flex">
    <!-- O Chip Visual -->
    <div
      class="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg text-xs border transition-all duration-150 select-none shadow-2xs"
      :class="[
        subtype.active
          ? 'bg-white border-stone-200 text-neutral-dark hover:border-stone-300 hover:shadow-xs'
          : 'bg-stone-50 border-dashed border-stone-200 text-stone-400',
        loading ? 'opacity-60 pointer-events-none' : '',
        isEditing ? 'ring-2 ring-secondary/30 border-secondary' : '',
      ]"
    >
      <!-- Indicador de Status -->
      <span
        class="w-1.5 h-1.5 rounded-full shrink-0"
        :class="subtype.active ? 'bg-emerald-500' : 'bg-stone-300'"
        :title="subtype.active ? 'Subtipo ativo' : 'Subtipo inativo'"
      ></span>

      <!-- Nome com clique para editar -->
      <button
        type="button"
        class="font-medium hover:text-secondary text-left truncate max-w-[180px] cursor-pointer transition-colors"
        :class="{ 'line-through text-stone-400': !subtype.active }"
        title="Clique para editar detalhes (nome, slug ou status)"
        @click="handleOpenEdit"
      >
        {{ subtype.name }}
      </button>

      <!-- Slug Compacto -->
      <span
        class="text-[10px] font-mono text-stone-400 bg-stone-100 px-1 py-0.5 rounded leading-none"
      >
        {{ subtype.slug }}
      </span>

      <!-- Botão de Remover / Desativar -->
      <button
        type="button"
        class="text-stone-400 hover:text-rose-600 hover:bg-rose-50 p-0.5 rounded transition-colors cursor-pointer"
        :title="isDraft ? 'Remover subtipo' : 'Desativar subtipo'"
        @click.stop="handleOpenDelete"
      >
        <Icon icon="mdi:close" class="w-3.5 h-3.5" />
      </button>
    </div>

    <!-- Popover de Edição Rápida -->
    <SubcategoriaEditPopover
      v-if="isEditing"
      :name="subtype.name"
      :slug="subtype.slug"
      :active="subtype.active"
      :loading="loading"
      @save="handleSaveEdit"
      @cancel="handleCloseEdit"
    />

    <!-- Popover de Confirmação de Exclusão (modo live) -->
    <SubcategoriaDeleteConfirm
      v-if="isConfirmingDelete"
      :name="subtype.name"
      :loading="loading"
      @confirm="handleConfirmDelete"
      @cancel="handleCloseDelete"
    />
  </div>
</template>
