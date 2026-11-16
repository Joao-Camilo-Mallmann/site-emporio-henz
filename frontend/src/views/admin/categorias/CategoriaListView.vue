<script setup lang="ts">
import { categoriasApi } from "@/api";
import { useToast } from "@/composables/useToast";
import { useCategoriasStore } from "@/stores/categorias";
import type { Category } from "@/types";
import { Icon } from "@iconify/vue";
import { storeToRefs } from "pinia";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import SubcategoriaListModal from "./subcategorias/SubcategoriaListModal.vue";

const router = useRouter();
const toast = useToast();
const categoriasStore = useCategoriasStore();
const { todas, loading, error } = storeToRefs(categoriasStore);

// Paginação e Filtros locais sobre os dados da store
const currentPage = ref(1);
const pageSize = ref(10);
const searchTerm = ref("");
const statusFilter = ref<string>("todos");

const hasActiveFilters = computed(
  () => searchTerm.value.trim() !== "" || statusFilter.value !== "todos",
);

const filteredCategories = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  return todas.value.filter((cat) => {
    if (statusFilter.value === "ativos" && !cat.active) return false;
    if (statusFilter.value === "inativos" && cat.active) return false;
    if (term && !cat.name.toLowerCase().includes(term)) return false;
    return true;
  });
});

const totalCategories = computed(() => filteredCategories.value.length);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(totalCategories.value / pageSize.value)),
);
const paginatedCategories = computed(() => {
  const page = Math.min(currentPage.value, totalPages.value);
  const start = (page - 1) * pageSize.value;
  return filteredCategories.value.slice(start, start + pageSize.value);
});

watch([searchTerm, statusFilter], () => {
  currentPage.value = 1;
});

watch(totalPages, (pages) => {
  if (currentPage.value > pages) {
    currentPage.value = pages;
  }
});

// Modal de Exclusão de Categoria
const isDeleteCategoryModalOpen = ref(false);
const categoryToDelete = ref<Category | null>(null);
const actionLoading = ref(false);

// Modal Modular de Subtipos
const isSubtypesModalOpen = ref(false);
const selectedCategory = ref<Category | null>(null);

function handleSearch() {
  currentPage.value = 1;
}

// Exclusão Lógica de Categoria (Soft Delete)
function abrirModalExclusaoCategoria(category: Category) {
  categoryToDelete.value = category;
  isDeleteCategoryModalOpen.value = true;
}

function fecharModalExclusaoCategoria() {
  isDeleteCategoryModalOpen.value = false;
  categoryToDelete.value = null;
}

async function confirmarExclusaoCategoria() {
  if (!categoryToDelete.value) return;

  actionLoading.value = true;
  try {
    await categoriasApi.deletar(categoryToDelete.value.id);
    toast.info("Categoria desativada com sucesso.");
    fecharModalExclusaoCategoria();
    await categoriasStore.recarregar();
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    toast.error(
      errorObj.response?.data?.message ||
        errorObj.message ||
        "Erro ao desativar categoria.",
    );
  } finally {
    actionLoading.value = false;
  }
}

// Gestão de Subtipos via Modal Modular
function abrirModalSubtipos(category: Category) {
  selectedCategory.value = category;
  isSubtypesModalOpen.value = true;
}

function fecharModalSubtipos() {
  isSubtypesModalOpen.value = false;
  selectedCategory.value = null;
}

onMounted(() => {
  void categoriasStore.carregar();
});
</script>

<template>
  <div
    class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-8 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-5xl mx-auto space-y-6">
      <UiPageHeader
        :breadcrumbs="[{ name: 'Painel', link: '/admin' }, { name: 'Categorias' }]"
        title="Categorias & Subtipos"
        description="Ambientes e tipologias de móveis vinculadas ao catálogo da loja"
        :new-action="{ name: 'Nova Categoria', link: '/admin/categorias/nova' }"
      />

      <!-- Barra de Filtros & Busca -->
      <div
        class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
      >
        <div class="flex flex-1 items-center gap-2 max-w-lg">
          <div class="relative flex-1">
            <span
              class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400"
            >
              <Icon icon="mdi:magnify" class="w-4 h-4" />
            </span>
            <input
              v-model="searchTerm"
              type="text"
              @keyup.enter="handleSearch"
              placeholder="Buscar por nome da categoria..."
              class="w-full pl-9 pr-3.5 py-2 rounded-lg border border-stone-200 bg-white text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-colors"
            />
          </div>

          <UiSelect
            v-model="statusFilter"
            size="sm"
            :block="false"
            aria-label="Filtrar por status"
            :options="[
              { value: 'todos', label: 'Todos os status' },
              { value: 'ativos', label: 'Apenas ativos' },
              { value: 'inativos', label: 'Apenas inativos' },
            ]"
            @change="handleSearch"
          />

          <UiButton
            variant="outline"
            size="sm"
            @click="handleSearch"
            class="shrink-0 text-xs"
          >
            Buscar
          </UiButton>
        </div>

        <div class="text-xs text-stone-500">
          <span>{{ totalCategories }} categorias cadastradas</span>
        </div>
      </div>

      <!-- Estado de Carregamento -->
      <div
        v-if="loading"
        class="py-16 bg-white rounded-xl border border-stone-200 flex flex-col items-center justify-center text-stone-500 gap-2.5"
      >
        <div
          class="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"
        ></div>
        <span class="text-xs">Carregando categorias...</span>
      </div>

      <!-- Estado de Erro -->
      <div
        v-else-if="error"
        class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-2.5">
          <Icon
            icon="mdi:alert-circle-outline"
            class="w-5 h-5 text-rose-500 shrink-0"
          />
          <span>{{ error }}</span>
        </div>
        <UiButton
          variant="danger"
          size="sm"
          class="shrink-0"
          @click="categoriasStore.recarregar()"
        >
          Tentar Novamente
        </UiButton>
      </div>

      <!-- Estado Vazio -->
      <div
        v-else-if="paginatedCategories.length === 0"
        class="py-14 bg-white rounded-xl border border-stone-200 text-center px-4"
      >
        <div
          class="w-12 h-12 rounded-lg bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3"
        >
          <Icon icon="mdi:shape-outline" class="w-6 h-6" />
        </div>
        <h3 class="text-sm font-semibold text-neutral-dark">
          Nenhuma categoria encontrada
        </h3>
        <p class="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          {{
            hasActiveFilters
              ? "Nenhum resultado corresponde aos filtros aplicados."
              : "Ainda não há categorias cadastradas no mostruário."
          }}
        </p>
        <UiButton
          v-if="!hasActiveFilters"
          variant="secondary"
          size="sm"
          class="mt-3.5"
          @click="router.push('/admin/categorias/nova')"
        >
          <Icon icon="mdi:plus" class="w-3.5 h-3.5" />
          <span>Cadastrar Primeira Categoria</span>
        </UiButton>
      </div>

      <!-- Tabela de Categorias -->
      <div v-else class="space-y-4">
        <div
          class="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr
                  class="border-b border-stone-100 bg-stone-50/50 text-xs font-semibold text-stone-500 uppercase tracking-wider"
                >
                  <th class="py-3 px-4">Ambiente / Categoria</th>
                  <th class="py-3 px-4">Slug</th>
                  <th class="py-3 px-4">Subtipos</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100 text-sm">
                <tr
                  v-for="cat in paginatedCategories"
                  :key="cat.id"
                  class="hover:bg-stone-50/60 transition-colors"
                >
                  <td class="py-3 px-4 font-medium text-neutral-dark">
                    <div class="flex items-center gap-2.5">
                      <span
                        class="w-7 h-7 rounded-md bg-stone-100 text-primary flex items-center justify-center font-bold text-xs shrink-0"
                      >
                        {{ cat.name.charAt(0).toUpperCase() }}
                      </span>
                      <span>{{ cat.name }}</span>
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <span
                      class="px-2 py-0.5 rounded text-xs font-mono bg-stone-100 text-stone-600"
                    >
                      {{ cat.slug }}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <UiButton
                      variant="ghost"
                      size="sm"
                      class="gap-1.5 text-xs text-secondary hover:text-secondary-hover px-2"
                      title="Gerenciar subtipos desta categoria"
                      @click="abrirModalSubtipos(cat)"
                    >
                      <Icon
                        icon="mdi:format-list-bulleted"
                        class="w-3.5 h-3.5"
                      />
                      <span>{{ cat.subtypes?.length ?? 0 }} subtipo(s)</span>
                    </UiButton>
                  </td>
                  <td class="py-3 px-4">
                    <span
                      class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="
                        cat.active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-stone-100 text-stone-500'
                      "
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full"
                        :class="cat.active ? 'bg-emerald-500' : 'bg-stone-400'"
                      ></span>
                      {{ cat.active ? "Ativo" : "Inativo" }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="inline-flex items-center gap-1">
                      <UiButton
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8 text-stone-400 hover:text-secondary hover:bg-sky-50"
                        title="Gerenciar Subtipos"
                        aria-label="Gerenciar Subtipos"
                        @click="abrirModalSubtipos(cat)"
                      >
                        <Icon icon="mdi:format-list-bulleted" class="w-4 h-4" />
                      </UiButton>
                      <UiButton
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8 text-stone-400 hover:text-secondary hover:bg-sky-50"
                        title="Editar Categoria"
                        aria-label="Editar Categoria"
                        @click="
                          router.push(`/admin/categorias/${cat.id}/editar`)
                        "
                      >
                        <Icon icon="mdi:pencil-outline" class="w-4 h-4" />
                      </UiButton>
                      <UiButton
                        v-if="cat.active"
                        variant="ghost"
                        size="icon"
                        class="h-8 w-8 text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Desativar Categoria"
                        aria-label="Desativar Categoria"
                        @click="abrirModalExclusaoCategoria(cat)"
                      >
                        <Icon icon="mdi:trash-can-outline" class="w-4 h-4" />
                      </UiButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <UiPagination
          :page="currentPage"
          :total-pages="totalPages"
          :total="totalCategories"
          item-label="categorias"
          :disabled="loading"
          @update:page="currentPage = $event"
        />
      </div>
    </div>

    <!-- Modal Modular de Subtipos -->
    <SubcategoriaListModal
      :open="isSubtypesModalOpen"
      :category="selectedCategory"
      @close="fecharModalSubtipos"
    />

    <!-- Modal de Confirmação de Exclusão de Categoria -->
    <UiModal
      :open="isDeleteCategoryModalOpen"
      title="Desativar Categoria"
      variant="danger"
      :loading="actionLoading"
      @close="fecharModalExclusaoCategoria"
      @confirm="confirmarExclusaoCategoria"
    >
      Deseja desativar a categoria
      <strong class="text-neutral-dark">{{ categoryToDelete?.name }}</strong
      >?
      <span class="block mt-1 text-stone-500 text-xs">
        Ela deixará de ser exibida nas opções ativas do mostruário e seus
        subtipos vinculados serão preservados no histórico (soft delete).
      </span>
    </UiModal>
  </div>
</template>
