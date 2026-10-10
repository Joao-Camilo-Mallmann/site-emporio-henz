<script setup lang="ts">
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
  SubtypeDraftItem,
} from "@/types";
import { Icon } from "@iconify/vue";
import { reactive, ref, watch } from "vue";
import SubcategoriaTagManager from "./subcategorias/SubcategoriaTagManager.vue";

interface Props {
  categoryId?: string;
  initialData?: {
    id?: string;
    name?: string;
    slug?: string;
    active?: boolean;
  };
  isEditing?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  categoryId: "",
  initialData: () => ({
    name: "",
    slug: "",
    active: true,
  }),
  isEditing: false,
  loading: false,
  errorMessage: null,
});

const emit = defineEmits<{
  (
    e: "submit",
    data: CategoryCreateInput | CategoryUpdateInput,
    draftSubtypes?: SubtypeDraftItem[],
  ): void;
  (e: "cancel"): void;
}>();

const form = reactive({
  name: props.initialData?.name || "",
  slug: props.initialData?.slug || "",
  active: props.initialData?.active ?? true,
});

const draftSubtypes = ref<SubtypeDraftItem[]>([]);

const formErrors = reactive({
  name: "",
  slug: "",
});

watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      form.name = newData.name || "";
      form.slug = newData.slug || "";
      form.active = newData.active ?? true;
    }
  },
  { deep: true },
);

function validate(): boolean {
  let valid = true;
  formErrors.name = "";
  formErrors.slug = "";

  if (!form.name.trim()) {
    formErrors.name = "O nome da categoria é obrigatório.";
    valid = false;
  } else if (form.name.trim().length < 2) {
    formErrors.name = "O nome da categoria deve ter no mínimo 2 caracteres.";
    valid = false;
  }

  return valid;
}

function handleSubmit() {
  if (!validate()) return;

  const payload: CategoryCreateInput | CategoryUpdateInput = {
    name: form.name.trim(),
    slug: form.slug.trim() || undefined,
    active: form.active,
  };

  emit("submit", payload, draftSubtypes.value);
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Alerta de Erro Geral -->
    <div
      v-if="errorMessage"
      class="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5"
    >
      <Icon icon="mdi:alert-circle" class="w-4 h-4 shrink-0 text-rose-500" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Nome da Categoria / Ambiente -->
    <div>
      <label
        for="category-name"
        class="block text-xs font-semibold text-neutral-dark mb-1.5"
      >
        Nome da Categoria / Ambiente *
      </label>
      <input
        id="category-name"
        v-model="form.name"
        type="text"
        placeholder="Ex.: Sala de Estar, Dormitório, Espaço Gourmet..."
        class="w-full px-3.5 py-2.5 rounded-lg border text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:ring-1 transition-colors"
        :class="
          formErrors.name
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
            : 'border-stone-300 focus:border-secondary focus:ring-secondary/20'
        "
      />
      <p v-if="formErrors.name" class="mt-1 text-xs text-rose-600">
        {{ formErrors.name }}
      </p>
    </div>

    <!-- Slug no Catálogo (URL amigável) -->
    <div>
      <label
        for="category-slug"
        class="block text-xs font-semibold text-neutral-dark mb-1.5"
      >
        Slug no Catálogo (Identificador de URL)
      </label>
      <input
        id="category-slug"
        v-model="form.slug"
        type="text"
        placeholder="Ex.: sala-de-estar (opcional, gerado automaticamente se vazio)"
        class="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-neutral-dark font-mono text-xs placeholder:text-stone-400 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-colors"
      />
      <span class="text-xs text-stone-400 mt-1 block">
        Utilizado na rota e filtros do catálogo. Deixe em branco para derivar automaticamente do nome.
      </span>
    </div>

    <!-- Status Ativo -->
    <div>
      <label class="flex items-start gap-3 cursor-pointer select-none">
        <input
          v-model="form.active"
          type="checkbox"
          class="mt-0.5 w-4 h-4 rounded border-stone-300 text-secondary focus:ring-secondary cursor-pointer"
        />
        <div>
          <span class="text-sm font-medium text-neutral-dark block">
            Categoria Ativa
          </span>
          <span class="text-xs text-stone-500 block mt-0.5">
            Categorias inativas não aparecem nos menus e filtros públicos do catálogo.
          </span>
        </div>
      </label>
    </div>

    <!-- Bloco Integrado de Subtipos / Subcategorias (Tags/Chips) -->
    <div class="pt-3 border-t border-stone-100">
      <SubcategoriaTagManager
        v-if="isEditing && (categoryId || initialData?.id)"
        :category-id="categoryId || initialData?.id || ''"
        mode="live"
      />
      <SubcategoriaTagManager
        v-else
        v-model="draftSubtypes"
        mode="draft"
      />
    </div>

    <!-- Barra de Ações com UiButton -->
    <div
      class="pt-5 border-t border-stone-100 flex items-center justify-end gap-3"
    >
      <UiButton
        variant="outline"
        type="button"
        size="md"
        @click="emit('cancel')"
      >
        Cancelar
      </UiButton>

      <UiButton
        variant="primary"
        type="submit"
        size="md"
        :loading="loading"
        :disabled="loading"
      >
        {{ isEditing ? "Salvar Alterações" : "Cadastrar Categoria" }}
      </UiButton>
    </div>
  </form>
</template>
