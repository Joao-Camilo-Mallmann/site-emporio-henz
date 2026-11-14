<script setup lang="ts">
import { fornecedoresApi } from "@/api";
import type { Supplier } from "@/types";
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import FornecedorForm from "./FornecedorForm.vue";

// Tela `/admin/fornecedores/:id/editar`: carrega o fornecedor e entrega ao
// formulário, que faz o `PUT`.

const route = useRoute();
const router = useRouter();

const supplierId = computed(() => {
  return typeof route.params.id === "string" ? route.params.id : "";
});

const supplier = ref<Supplier | null>(null);
const loading = ref(false);
const initialError = ref<string | null>(null);

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

function handleCancel() {
  router.push("/admin/fornecedores");
}

onMounted(() => {
  carregarFornecedor();
});
</script>

<template>
  <div
    class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-8 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-2xl mx-auto space-y-6">
      <UiPageHeader
        :breadcrumbs="[{ name: 'Painel', link: '/admin' }, { name: 'Fornecedores', link: '/admin/fornecedores' }, { name: 'Editar Fornecedor' }]"
        title="Editar Fornecedor"
        description="Atualize as informações cadastrais da marca ou fabricante parceiro"
      />

      <!-- Container do Formulário -->
      <div
        class="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-xs"
      >
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
            <Icon
              icon="mdi:alert-circle-outline"
              class="w-5 h-5 text-rose-500 shrink-0"
            />
            <span>{{ initialError }}</span>
          </div>
          <div class="flex items-center gap-2">
            <UiButton
              type="button"
              variant="danger"
              size="sm"
              @click="carregarFornecedor"
            >
              Tentar Novamente
            </UiButton>
            <UiButton
              variant="outline"
              size="sm"
              @click="$router.push('/admin/fornecedores')"
            >
              Voltar à Lista
            </UiButton>
          </div>
        </div>

        <FornecedorForm
          v-else-if="supplier"
          :supplier-id="supplierId"
          :initial-data="supplier"
          is-editing
          @cancel="handleCancel"
        />
      </div>
    </div>
  </div>
</template>
