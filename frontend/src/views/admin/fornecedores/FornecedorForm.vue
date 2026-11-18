<script setup lang="ts">
import { fornecedoresApi } from "@/api";
import { useToast } from "@/composables/useToast";
import type { SupplierCreateInput, SupplierUpdateInput } from "@/types";
import { Icon } from "@iconify/vue";
import { reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";

// Formulário de fornecedor, dono da gravação: valida, chama `POST` (cadastro)
// ou `PUT` (edição com `supplierId`), mostra o toast e volta para a lista.
// As telas só carregam os dados iniciais e renderizam este componente.

interface Props {
  /** Id do fornecedor na edição; sem ele o envio cadastra um novo. */
  supplierId?: string;
  initialData?: {
    name?: string;
    contact?: string | null;
    active?: boolean;
  };
  isEditing?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  supplierId: "",
  initialData: () => ({
    name: "",
    contact: "",
    active: true,
  }),
  isEditing: false,
});

const emit = defineEmits<{
  (e: "saved"): void;
  (e: "cancel"): void;
}>();

const LISTA_URL = "/admin/fornecedores";

const router = useRouter();
const toast = useToast();

const saving = ref(false);
const errorMessage = ref<string | null>(null);

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

async function handleSubmit() {
  if (saving.value || !validate()) return;
  if (props.isEditing && !props.supplierId) return;

  const payload: SupplierCreateInput | SupplierUpdateInput = {
    name: form.name.trim(),
    contact: form.contact.trim() || undefined,
    active: form.active,
  };

  saving.value = true;
  errorMessage.value = null;

  try {
    if (props.isEditing) {
      await fornecedoresApi.atualizar(
        props.supplierId,
        payload as SupplierUpdateInput,
      );
      toast.success("Fornecedor atualizado com sucesso!");
    } else {
      await fornecedoresApi.criar(payload as SupplierCreateInput);
      toast.success("Fornecedor cadastrado com sucesso!");
    }
    emit("saved");
    router.push(LISTA_URL);
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    errorMessage.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      (props.isEditing
        ? "Ocorreu um erro ao atualizar o fornecedor."
        : "Ocorreu um erro ao cadastrar o fornecedor.");
  } finally {
    saving.value = false;
  }
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
    <UiInput
      id="supplier-name"
      v-model="form.name"
      label="Nome do Fornecedor / Fabricante *"
      type="text"
      placeholder="Ex: Herval Móveis, Estofados Nobres..."
      :error="formErrors.name"
    />

    <!-- Contato -->
    <UiInput
      id="supplier-contact"
      v-model="form.contact"
      label="Contato / Representante"
      type="text"
      placeholder="Ex: contato@herval.com.br ou (51) 99999-9999"
      hint="E-mail, telefone ou nome do representante comercial."
    />

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
            Fornecedores inativos não poderão ser vinculados a novos produtos do
            catálogo.
          </span>
        </div>
      </label>
    </div>

    <!-- Barra de Ações com UiButton -->
    <div
      class="pt-5 border-t border-stone-100 flex items-center justify-end gap-3"
    >
      <UiButton
        variant="outline"
        type="button"
        size="md"
        :disabled="saving"
        @click="emit('cancel')"
      >
        Cancelar
      </UiButton>

      <UiButton
        variant="primary"
        type="submit"
        size="md"
        :loading="saving"
        :disabled="saving"
      >
        {{ isEditing ? "Salvar Alterações" : "Cadastrar Fornecedor" }}
      </UiButton>
    </div>
  </form>
</template>
