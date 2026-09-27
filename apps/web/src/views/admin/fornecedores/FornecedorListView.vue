<script setup lang="ts">
import { fornecedoresApi } from "@/api";
import { useToast } from "@/composables/useToast";
import type { ISupplier } from "@/types";
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

const toast = useToast();

// Estado da Listagem
const suppliers = ref<ISupplier[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchTerm = ref("");

// Modal de Exclusão Lógica (Soft Delete)
const isDeleteModalOpen = ref(false);
const supplierToDelete = ref<ISupplier | null>(null);
const actionLoading = ref(false);

// Fornecedores Filtrados em Tempo Real
const filteredSuppliers = computed(() => {
  const term = searchTerm.value.trim().toLowerCase();
  if (!term) return suppliers.value;
  return suppliers.value.filter((s) => {
    const matchName = s.name.toLowerCase().includes(term);
    const matchContact = s.contact
      ? s.contact.toLowerCase().includes(term)
      : false;
    return matchName || matchContact;
  });
});

const totalActive = computed(
  () => suppliers.value.filter((s) => s.active).length,
);

async function carregarFornecedores() {
  loading.value = true;
  error.value = null;
  try {
    const data = await fornecedoresApi.listar();
    suppliers.value = data;
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    error.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Falha ao carregar lista de fornecedores.";
  } finally {
    loading.value = false;
  }
}

function abrirModalExclusao(supplier: ISupplier) {
  supplierToDelete.value = supplier;
  isDeleteModalOpen.value = true;
}

function fecharModalExclusao() {
  isDeleteModalOpen.value = false;
  supplierToDelete.value = null;
}

async function confirmarExclusao() {
  if (!supplierToDelete.value) return;

  actionLoading.value = true;
  try {
    await fornecedoresApi.deletar(supplierToDelete.value.id);
    const index = suppliers.value.findIndex(
      (s) => s.id === supplierToDelete.value?.id,
    );
    if (index !== -1) {
      suppliers.value[index].active = false;
    }
    toast.info("Fornecedor desativado com sucesso.");
    fecharModalExclusao();
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    toast.error(
      errorObj.response?.data?.message ||
        errorObj.message ||
        "Erro ao desativar fornecedor.",
    );
  } finally {
    actionLoading.value = false;
  }
}

function formatarData(dataStr?: string) {
  if (!dataStr) return "—";
  try {
    return new Date(dataStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return dataStr;
  }
}

onMounted(() => {
  carregarFornecedores();
});
</script>

<template>
  <div class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Navegação Superior & Cabeçalho Limpo -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <RouterLink
            to="/admin"
            class="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-neutral-dark transition-colors mb-2"
          >
            <Icon icon="mdi:arrow-left" class="w-3.5 h-3.5" />
            <span>Painel Administrativo</span>
          </RouterLink>
          <h1 class="text-2xl font-bold text-neutral-dark tracking-tight">
            Fornecedores
          </h1>
          <p class="text-sm text-stone-500 mt-0.5">
            Marcas parceiras, fábricas e fabricantes de móveis e decoração
          </p>
        </div>

        <RouterLink
          to="/admin/fornecedores/novo"
          class="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary-hover text-white font-medium text-sm transition-colors shadow-xs shrink-0"
        >
          <Icon icon="mdi:plus" class="w-4 h-4" />
          <span>Novo Fornecedor</span>
        </RouterLink>
      </div>

      <!-- Barra de Busca & Totais -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div class="relative flex-1 max-w-sm">
          <span
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400"
          >
            <Icon icon="mdi:magnify" class="w-4 h-4" />
          </span>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Buscar por nome ou contato..."
            class="w-full pl-9 pr-3.5 py-2 rounded-lg border border-stone-200 bg-white text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-colors"
          />
        </div>

        <div class="text-xs text-stone-500 flex items-center gap-2">
          <span>{{ suppliers.length }} fornecedores</span>
          <span>•</span>
          <span class="text-emerald-700 font-medium">{{ totalActive }} ativos</span>
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
        <span class="text-xs">Carregando fornecedores...</span>
      </div>

      <!-- Estado de Erro -->
      <div
        v-else-if="error"
        class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between gap-4"
      >
        <div class="flex items-center gap-2.5">
          <Icon icon="mdi:alert-circle-outline" class="w-5 h-5 text-rose-500 shrink-0" />
          <span>{{ error }}</span>
        </div>
        <button
          type="button"
          @click="carregarFornecedores"
          class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors shrink-0 cursor-pointer"
        >
          Tentar Novamente
        </button>
      </div>

      <!-- Estado Vazio -->
      <div
        v-else-if="filteredSuppliers.length === 0"
        class="py-14 bg-white rounded-xl border border-stone-200 text-center px-4"
      >
        <div
          class="w-12 h-12 rounded-lg bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3"
        >
          <Icon icon="mdi:domain-off" class="w-6 h-6" />
        </div>
        <h3 class="text-sm font-semibold text-neutral-dark">
          Nenhum fornecedor encontrado
        </h3>
        <p class="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          {{
            searchTerm
              ? "Nenhum resultado corresponde aos termos da pesquisa."
              : "Ainda não há fornecedores parceiros cadastrados."
          }}
        </p>
        <RouterLink
          v-if="!searchTerm"
          to="/admin/fornecedores/novo"
          class="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-secondary text-white font-medium text-xs hover:bg-secondary-hover transition-colors"
        >
          <Icon icon="mdi:plus" class="w-3.5 h-3.5" />
          <span>Cadastrar Primeiro Fornecedor</span>
        </RouterLink>
      </div>

      <!-- Tabela Clean de Fornecedores -->
      <div v-else class="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                <th class="py-3 px-4">Fornecedor</th>
                <th class="py-3 px-4">Contato</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Cadastrado em</th>
                <th class="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100 text-sm">
              <tr
                v-for="supplier in filteredSuppliers"
                :key="supplier.id"
                class="hover:bg-stone-50/60 transition-colors"
              >
                <td class="py-3 px-4 font-medium text-neutral-dark">
                  <div class="flex items-center gap-2.5">
                    <span
                      class="w-7 h-7 rounded-md bg-stone-100 text-primary flex items-center justify-center font-bold text-xs shrink-0"
                    >
                      {{ supplier.name.charAt(0).toUpperCase() }}
                    </span>
                    <span>{{ supplier.name }}</span>
                  </div>
                </td>
                <td class="py-3 px-4 text-stone-600 text-xs">
                  {{ supplier.contact || "—" }}
                </td>
                <td class="py-3 px-4">
                  <span
                    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                    :class="
                      supplier.active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-stone-100 text-stone-500'
                    "
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full"
                      :class="supplier.active ? 'bg-emerald-500' : 'bg-stone-400'"
                    ></span>
                    {{ supplier.active ? "Ativo" : "Inativo" }}
                  </span>
                </td>
                <td class="py-3 px-4 text-stone-500 text-xs">
                  {{ formatarData(supplier.createdAt) }}
                </td>
                <td class="py-3 px-4 text-right">
                  <div class="inline-flex items-center gap-1">
                    <RouterLink
                      :to="`/admin/fornecedores/${supplier.id}/editar`"
                      class="p-1.5 rounded-md text-stone-400 hover:text-secondary hover:bg-sky-50 transition-colors"
                      title="Editar Fornecedor"
                    >
                      <Icon icon="mdi:pencil-outline" class="w-4 h-4" />
                    </RouterLink>
                    <button
                      v-if="supplier.active"
                      type="button"
                      @click="abrirModalExclusao(supplier)"
                      class="p-1.5 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Desativar Fornecedor"
                    >
                      <Icon icon="mdi:trash-can-outline" class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Limpo de Confirmação de Exclusão Lógica -->
    <UiModal
      :open="isDeleteModalOpen"
      title="Desativar Fornecedor"
      variant="danger"
      :loading="actionLoading"
      @close="fecharModalExclusao"
      @confirm="confirmarExclusao"
    >
      Deseja desativar <strong class="text-neutral-dark">{{ supplierToDelete?.name }}</strong>? O histórico é mantido, mas o fornecedor não estará ativo para novos vínculos.
    </UiModal>
  </div>
</template>
