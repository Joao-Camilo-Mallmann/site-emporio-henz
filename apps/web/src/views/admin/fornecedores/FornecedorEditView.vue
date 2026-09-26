<script setup lang="ts">
import { fornecedoresApi } from "@/api";
import { useAppStore } from "@/stores/app";
import type { ISupplier, SupplierCreateInput, SupplierUpdateInput } from "@/types";
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter, RouterLink } from "vue-router";
import FornecedorForm from "./FornecedorForm.vue";

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();

const supplierId = computed(() => {
  return typeof route.params.id === "string" ? route.params.id : "";
});

const supplier = ref<ISupplier | null>(null);
const loading = ref(false);
const initialError = ref<string | null>(null);
const saving = ref(false);
const errorMessage = ref<string | null>(null);

async function carregarFornecedor() {
  if (!supplierId.value) return;

  loading.value = true;
  initialError.value = null;

  try {
    supplier.value = await fornecedoresApi.buscarPorId(supplierId.value);
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    initialError.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Não foi possível carregar os dados do fornecedor.";
  } finally {
    loading.value = false;
  }
}

async function handleUpdate(payload: SupplierCreateInput | SupplierUpdateInput) {
  if (!supplierId.value) return;

  saving.value = true;
  errorMessage.value = null;

  try {
    await fornecedoresApi.atualizar(supplierId.value, payload as SupplierUpdateInput);
    appStore.showAlert("Fornecedor atualizado com sucesso!", "success");
    router.push("/admin/fornecedores");
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    errorMessage.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Ocorreu um erro ao atualizar o fornecedor.";
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  router.push("/admin/fornecedores");
}

onMounted(() => {
  carregarFornecedor();
});
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
          <span class="text-neutral-dark font-medium">Editar Fornecedor</span>
        </div>

        <h1 class="text-2xl font-bold text-neutral-dark tracking-tight">
          Editar Fornecedor
        </h1>
        <p class="text-sm text-stone-500 mt-0.5">
          Atualize as informações cadastrais da marca ou fabricante parceiro
        </p>
      </div>

      <!-- Container do Formulário -->
      <div class="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <!-- Estado de Carregamento Inicial -->
        <div
          v-if="loading"
          class="py-12 flex flex-col items-center justify-center text-stone-500 gap-2.5"
        >
          <div
            class="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"
          ></div>
          <span class="text-xs">Carregando dados do fornecedor...</span>
        </div>

        <!-- Estado de Erro Inicial -->
        <div
          v-else-if="initialError"
          class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between gap-4"
        >
          <div class="flex items-center gap-2.5">
            <Icon icon="mdi:alert-circle-outline" class="w-5 h-5 text-rose-500 shrink-0" />
            <span>{{ initialError }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="carregarFornecedor"
              class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              Tentar Novamente
            </button>
            <RouterLink
              to="/admin/fornecedores"
              class="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-xs transition-colors"
            >
              Voltar à Lista
            </RouterLink>
          </div>
        </div>

        <FornecedorForm
          v-else-if="supplier"
          :initial-data="supplier"
          is-editing
          :loading="saving"
          :error-message="errorMessage"
          @submit="handleUpdate"
          @cancel="handleCancel"
        />
      </div>
    </div>
  </div>
</template>
