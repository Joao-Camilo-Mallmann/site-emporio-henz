<script setup lang="ts">
import { categoriasApi } from "@/api";
import { useToast } from "@/composables/useToast";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
  ICategory,
} from "@/types";
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import CategoriaForm from "./CategoriaForm.vue";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const categoryId = computed(() => {
  return typeof route.params.id === "string" ? route.params.id : "";
});

const category = ref<ICategory | null>(null);
const loading = ref(false);
const initialError = ref<string | null>(null);
const saving = ref(false);
const errorMessage = ref<string | null>(null);

async function carregarCategoria() {
  if (!categoryId.value) return;

  loading.value = true;
  initialError.value = null;

  try {
    category.value = await categoriasApi.buscarPorId(categoryId.value);
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    initialError.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Não foi possível carregar os dados da categoria.";
  } finally {
    loading.value = false;
  }
}

async function handleUpdate(
  payload: CategoryCreateInput | CategoryUpdateInput,
) {
  if (!categoryId.value) return;

  saving.value = true;
  errorMessage.value = null;

  try {
    await categoriasApi.atualizar(
      categoryId.value,
      payload as CategoryUpdateInput,
    );
    toast.success("Categoria atualizada com sucesso!");
    router.push("/admin/categorias");
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    errorMessage.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Ocorreu um erro ao atualizar a categoria.";
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  router.push("/admin/categorias");
}

onMounted(() => {
  carregarCategoria();
});
</script>

<template>
  <div class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-3xl mx-auto space-y-6">
      <!-- Breadcrumbs e Cabeçalho Limpo -->
      <div>
        <div class="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
          <RouterLink to="/admin" class="hover:text-neutral-dark transition-colors">
            Painel
          </RouterLink>
          <span>/</span>
          <RouterLink to="/admin/categorias" class="hover:text-neutral-dark transition-colors">
            Categorias
          </RouterLink>
          <span>/</span>
          <span class="text-neutral-dark font-medium">Editar Categoria</span>
        </div>

        <h1 class="text-2xl font-bold text-neutral-dark tracking-tight">
          Editar Categoria
        </h1>
        <p class="text-sm text-stone-500 mt-0.5">
          Atualize as informações cadastrais do ambiente e gerencie seus subtipos
        </p>
      </div>

      <!-- Estado de Carregamento Inicial -->
      <div
        v-if="loading"
        class="py-12 bg-white rounded-xl border border-stone-200 flex flex-col items-center justify-center text-stone-500 gap-2.5"
      >
        <div
          class="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"
        ></div>
        <span class="text-xs">Carregando dados da categoria...</span>
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
            @click="carregarCategoria"
          >
            Tentar Novamente
          </UiButton>
          <UiButton
            variant="outline"
            size="sm"
            @click="$router.push('/admin/categorias')"
          >
            Voltar à Lista
          </UiButton>
        </div>
      </div>

      <div v-else-if="category" class="space-y-6">
        <!-- Formulário da Categoria com Bloco Integrado de Subtipos -->
        <div class="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-xs">
          <CategoriaForm
            :category-id="categoryId"
            :initial-data="category"
            is-editing
            :loading="saving"
            :error-message="errorMessage"
            @submit="handleUpdate"
            @cancel="handleCancel"
          />
        </div>
      </div>
    </div>
  </div>
</template>
