<script setup lang="ts">
import { slugify } from "@/utils/slug";
import { Icon } from "@iconify/vue";
import { onMounted, onUnmounted, reactive, ref } from "vue";

interface Props {
  name: string;
  slug: string;
  active: boolean;
  loading?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "save", data: { name: string; slug: string; active: boolean }): void;
  (e: "cancel"): void;
}>();

const popoverRef = ref<HTMLElement | null>(null);

const form = reactive({
  name: props.name,
  slug: props.slug,
  active: props.active,
});

const error = ref("");

function regenerateSlug() {
  if (form.name.trim()) {
    form.slug = slugify(form.name.trim());
  }
}

function handleSave() {
  if (!form.name.trim()) {
    error.value = "O nome é obrigatório.";
    return;
  }
  error.value = "";
  emit("save", {
    name: form.name.trim(),
    slug: form.slug.trim() ? slugify(form.slug.trim()) : slugify(form.name.trim()),
    active: form.active,
  });
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    emit("cancel");
  } else if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleSave();
  }
}

function handleClickOutside(event: MouseEvent) {
  if (popoverRef.value && !popoverRef.value.contains(event.target as Node)) {
    emit("cancel");
  }
}

onMounted(() => {
  setTimeout(() => {
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeydown);
  }, 10);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <div
    ref="popoverRef"
    class="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-40 w-72 p-3.5 bg-white rounded-xl border border-stone-200 shadow-xl text-left animate-in fade-in zoom-in-95 duration-150"
    role="dialog"
    aria-label="Editar subtipo"
  >
    <!-- Seta do popover -->
    <div
      class="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t border-l border-stone-200 rotate-45"
    ></div>

    <div class="relative z-10 space-y-3">
      <div class="flex items-center justify-between pb-1.5 border-b border-stone-100">
        <span class="text-xs font-semibold text-neutral-dark">
          Editar Subtipo
        </span>
        <button
          type="button"
          class="text-stone-400 hover:text-neutral-dark p-0.5 rounded transition-colors"
          title="Fechar"
          @click="emit('cancel')"
        >
          <Icon icon="mdi:close" class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Campo Nome -->
      <div>
        <label class="block text-[11px] font-medium text-stone-600 mb-1">
          Nome do Subtipo *
        </label>
        <input
          v-model="form.name"
          type="text"
          placeholder="Ex.: Sofás de Canto"
          class="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs text-neutral-dark focus:outline-none focus:border-secondary transition-colors"
          :class="{ 'border-rose-300': !!error }"
          @input="error = ''"
        />
        <p v-if="error" class="text-[10px] text-rose-600 mt-0.5">
          {{ error }}
        </p>
      </div>

      <!-- Campo Slug -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="block text-[11px] font-medium text-stone-600">
            Slug (URL amigável)
          </label>
          <button
            type="button"
            class="text-[10px] text-secondary hover:underline flex items-center gap-0.5"
            title="Recalcular slug a partir do nome"
            @click="regenerateSlug"
          >
            <Icon icon="mdi:refresh" class="w-3 h-3" />
            <span>Sugerir</span>
          </button>
        </div>
        <input
          v-model="form.slug"
          type="text"
          placeholder="sofas-de-canto"
          class="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-mono text-neutral-dark focus:outline-none focus:border-secondary transition-colors"
        />
      </div>

      <!-- Status Ativo -->
      <label class="flex items-center gap-2 cursor-pointer select-none pt-0.5">
        <input
          v-model="form.active"
          type="checkbox"
          class="w-3.5 h-3.5 rounded border-stone-300 text-secondary focus:ring-secondary/30 cursor-pointer"
        />
        <span class="text-xs text-stone-600">
          Subtipo ativo no catálogo
        </span>
      </label>

      <!-- Ações -->
      <div class="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
        <UiButton
          type="button"
          variant="outline"
          size="xs"
          :disabled="loading"
          @click="emit('cancel')"
        >
          Cancelar
        </UiButton>
        <UiButton
          type="button"
          variant="secondary"
          size="xs"
          :loading="loading"
          @click="handleSave"
        >
          Salvar
        </UiButton>
      </div>
    </div>
  </div>
</template>
