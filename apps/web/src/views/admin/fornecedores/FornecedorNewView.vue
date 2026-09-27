<script setup lang="ts">
import { fornecedoresApi } from "@/api";
import { useToast } from "@/composables/useToast";
import type { SupplierCreateInput, SupplierUpdateInput } from "@/types";
import { ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import FornecedorForm from "./FornecedorForm.vue";

const router = useRouter();
const toast = useToast();

const saving = ref(false);
const errorMessage = ref<string | null>(null);

async function handleCreate(payload: SupplierCreateInput | SupplierUpdateInput) {
  saving.value = true;
  errorMessage.value = null;

  try {
    await fornecedoresApi.criar(payload as SupplierCreateInput);
    toast.success("Fornecedor cadastrado com sucesso!");
    router.push("/admin/fornecedores");
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    errorMessage.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Ocorreu um erro ao cadastrar o fornecedor.";
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  router.push("/admin/fornecedores");
}
</script>

<template>
  <div class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- Breadcrumbs e Cabeçalho Limpo -->
      <div>
        <div class="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
          <RouterLink to="/admin" class="hover:text-neutral-dark transition-colors">
            Painel
          </RouterLink>
          <span>/</span>
          <RouterLink to="/admin/fornecedores" class="hover:text-neutral-dark transition-colors">
            Fornecedores
          </RouterLink>
          <span>/</span>
          <span class="text-neutral-dark font-medium">Novo Fornecedor</span>
        </div>

        <h1 class="text-2xl font-bold text-neutral-dark tracking-tight">
          Novo Fornecedor
        </h1>
        <p class="text-sm text-stone-500 mt-0.5">
          Cadastre uma nova fábrica ou marca parceira no acervo da loja
        </p>
      </div>

      <!-- Container do Formulário -->
      <div class="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <FornecedorForm
          :loading="saving"
          :error-message="errorMessage"
          @submit="handleCreate"
          @cancel="handleCancel"
        />
      </div>
    </div>
  </div>
</template>
