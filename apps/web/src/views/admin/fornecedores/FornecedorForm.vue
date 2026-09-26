<script setup lang="ts">
import type {
  SupplierCreateInput,
  SupplierUpdateInput,
} from "@/types";
import { Icon } from "@iconify/vue";
import { reactive, watch } from "vue";

interface Props {
  initialData?: {
    name?: string;
    contact?: string | null;
    active?: boolean;
  };
  isEditing?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => ({
    name: "",
    contact: "",
    active: true,
  }),
  isEditing: false,
  loading: false,
  errorMessage: null,
});

const emit = defineEmits<{
  (e: "submit", data: SupplierCreateInput | SupplierUpdateInput): void;
  (e: "cancel"): void;
}>();

const form = reactive({
  name: props.initialData?.name || "",
  contact: props.initialData?.contact || "",
  active: props.initialData?.active ?? true,
});

const formErrors = reactive({
  name: "",
  contact: "",
});

watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      form.name = newData.name || "";
      form.contact = newData.contact || "";
      form.active = newData.active ?? true;
    }
  },
  { deep: true },
);

function validate(): boolean {
  let valid = true;
  formErrors.name = "";
  formErrors.contact = "";

  if (!form.name.trim()) {
    formErrors.name = "O nome do fornecedor é obrigatório.";
    valid = false;
  } else if (form.name.trim().length < 2) {
    formErrors.name = "O nome do fornecedor deve ter no mínimo 2 caracteres.";
    valid = false;
  }

  return valid;
}

function handleSubmit() {
  if (!validate()) return;

  const payload: SupplierCreateInput | SupplierUpdateInput = {
    name: form.name.trim(),
    contact: form.contact.trim() || undefined,
    active: form.active,
  };

  emit("submit", payload);
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
    <!-- Alerta de Erro Geral -->
    <div
      v-if="errorMessage"
      class="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5"
    >
      <Icon icon="mdi:alert-circle" class="w-4 h-4 shrink-0 text-rose-500" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Nome do Fornecedor -->
    <div>
      <label
        for="supplier-name"
        class="block text-xs font-semibold text-neutral-dark mb-1.5"
      >
        Nome do Fornecedor / Fabricante *
      </label>
      <input
        id="supplier-name"
        v-model="form.name"
        type="text"
        placeholder="Ex: Herval Móveis, Estofados Nobres..."
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

    <!-- Contato -->
    <div>
      <label
        for="supplier-contact"
        class="block text-xs font-semibold text-neutral-dark mb-1.5"
      >
        Contato / Representante
      </label>
      <input
        id="supplier-contact"
        v-model="form.contact"
        type="text"
        placeholder="Ex: contato@herval.com.br ou (51) 99999-9999"
        class="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-colors"
      />
      <span class="text-xs text-stone-400 mt-1 block">
        E-mail, telefone ou nome do representante comercial.
      </span>
    </div>

    <!-- Status Ativo (Clean, sem card pesado) -->
    <div class="pt-2">
      <label class="flex items-start gap-3 cursor-pointer select-none">
        <input
          v-model="form.active"
          type="checkbox"
          class="mt-0.5 w-4 h-4 rounded border-stone-300 text-secondary focus:ring-secondary cursor-pointer"
        />
        <div>
          <span class="text-sm font-medium text-neutral-dark block">
            Fornecedor Ativo
          </span>
          <span class="text-xs text-stone-500 block mt-0.5">
            Fornecedores inativos não poderão ser vinculados a novos produtos do catálogo.
          </span>
        </div>
      </label>
    </div>

    <!-- Barra de Ações -->
    <div
      class="pt-5 border-t border-stone-100 flex items-center justify-end gap-3"
    >
      <button
        type="button"
        @click="emit('cancel')"
        class="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-sm transition-colors cursor-pointer"
      >
        Cancelar
      </button>

      <button
        type="submit"
        :disabled="loading"
        class="px-5 py-2 rounded-lg bg-secondary hover:bg-secondary-hover text-white font-medium text-sm shadow-xs transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
      >
        <span
          v-if="loading"
          class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
        ></span>
        <span>
          {{ isEditing ? "Salvar Alterações" : "Cadastrar Fornecedor" }}
        </span>
      </button>
    </div>
  </form>
</template>
