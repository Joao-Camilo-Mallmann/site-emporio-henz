<script setup lang="ts">
import { usuariosApi } from "@/api";
import { useAppStore } from "@/stores/app";
import { useAuthStore } from "@/stores/auth";
import {
  UserRole,
  type IUser,
  type UserFilterParams,
} from "@/types";
import { Icon } from "@iconify/vue";
import { onMounted, ref } from "vue";
import { RouterLink } from "vue-router";

const appStore = useAppStore();
const authStore = useAuthStore();

// Estado da Listagem
const users = ref<IUser[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// Paginação e Filtros
const currentPage = ref(1);
const totalPages = ref(1);
const totalUsers = ref(0);
const pageSize = ref(10);
const searchTerm = ref("");
const selectedRole = ref<number | undefined>(undefined);

// Modal de Exclusão Lógica
const isDeleteModalOpen = ref(false);
const userToDelete = ref<IUser | null>(null);
const actionLoading = ref(false);

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

async function carregarUsuarios(page = 1) {
  loading.value = true;
  error.value = null;
  currentPage.value = page;

  try {
    const params: UserFilterParams = {
      page,
      limit: pageSize.value,
      search: searchTerm.value.trim() || undefined,
      role: selectedRole.value,
    };

    const response = await usuariosApi.listar(params);
    users.value = response.data;
    currentPage.value = response.pagination.page;
    totalPages.value = response.pagination.totalPages || 1;
    totalUsers.value = response.pagination.total;
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    error.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Falha ao carregar a listagem de usuários.";
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  carregarUsuarios(1);
}

function handleRoleChange() {
  carregarUsuarios(1);
}

function abrirModalExclusao(user: IUser) {
  if (user.id === authStore.user?.id) {
    appStore.showAlert(
      "Você não pode desativar a sua própria conta de administrador.",
      "warning",
    );
    return;
  }
  userToDelete.value = user;
  isDeleteModalOpen.value = true;
}

function fecharModalExclusao() {
  isDeleteModalOpen.value = false;
  userToDelete.value = null;
}

async function confirmarExclusao() {
  if (!userToDelete.value) return;

  actionLoading.value = true;
  try {
    await usuariosApi.deletar(userToDelete.value.id);
    appStore.showAlert("Usuário desativado com sucesso.", "info");
    fecharModalExclusao();
    await carregarUsuarios(currentPage.value);
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    appStore.showAlert(
      errorObj.response?.data?.message ||
        errorObj.message ||
        "Erro ao desativar usuário.",
      "error",
    );
  } finally {
    actionLoading.value = false;
  }
}

function roleBadge(role: number) {
  switch (role) {
    case UserRole.Administrador:
      return {
        label: "Administrador",
        class: "bg-amber-50 text-amber-800",
      };
    case UserRole.Vendedor:
      return {
        label: "Vendedor",
        class: "bg-sky-50 text-secondary-hover",
      };
    default:
      return {
        label: "Cliente",
        class: "bg-stone-100 text-stone-700",
      };
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
  carregarUsuarios();
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
            Usuários & Clientes
          </h1>
          <p class="text-sm text-stone-500 mt-0.5">
            Controle de acessos, perfis e contas cadastradas na loja
          </p>
        </div>

        <RouterLink
          to="/admin/usuarios/novo"
          class="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary-hover text-white font-medium text-sm transition-colors shadow-xs shrink-0"
        >
          <Icon icon="mdi:account-plus" class="w-4 h-4" />
          <span>Novo Usuário</span>
        </RouterLink>
      </div>

      <!-- Barra de Filtros & Busca -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
              placeholder="Buscar por nome ou e-mail..."
              class="w-full pl-9 pr-3.5 py-2 rounded-lg border border-stone-200 bg-white text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-colors"
            />
          </div>

          <select
            v-model="selectedRole"
            @change="handleRoleChange"
            class="px-3 py-2 rounded-lg border border-stone-200 bg-white text-xs sm:text-sm text-neutral-dark focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-colors cursor-pointer"
          >
            <option :value="undefined">Todos os Perfis</option>
            <option :value="UserRole.Cliente">Clientes</option>
            <option :value="UserRole.Vendedor">Vendedores</option>
            <option :value="UserRole.Administrador">Administradores</option>
          </select>
        </div>

        <div class="text-xs text-stone-500">
          <span>{{ totalUsers }} cadastros encontrados</span>
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
        <span class="text-xs">Carregando usuários...</span>
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
          @click="carregarUsuarios(currentPage)"
          class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors shrink-0 cursor-pointer"
        >
          Tentar Novamente
        </button>
      </div>

      <!-- Estado Vazio -->
      <div
        v-else-if="users.length === 0"
        class="py-14 bg-white rounded-xl border border-stone-200 text-center px-4"
      >
        <div
          class="w-12 h-12 rounded-lg bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3"
        >
          <Icon icon="mdi:account-off" class="w-6 h-6" />
        </div>
        <h3 class="text-sm font-semibold text-neutral-dark">
          Nenhum usuário encontrado
        </h3>
        <p class="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          {{
            searchTerm || selectedRole
              ? "Nenhum usuário corresponde aos filtros aplicados."
              : "Ainda não há outros usuários cadastrados."
          }}
        </p>
        <RouterLink
          to="/admin/usuarios/novo"
          class="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-secondary text-white font-medium text-xs hover:bg-secondary-hover transition-colors"
        >
          <Icon icon="mdi:plus" class="w-3.5 h-3.5" />
          <span>Cadastrar Primeiro Usuário</span>
        </RouterLink>
      </div>

      <!-- Tabela Clean de Usuários -->
      <div v-else class="space-y-4">
        <div class="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                  <th class="py-3 px-4">Usuário</th>
                  <th class="py-3 px-4">Perfil</th>
                  <th class="py-3 px-4">Telefone</th>
                  <th class="py-3 px-4">Cidade</th>
                  <th class="py-3 px-4">Cadastrado em</th>
                  <th class="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-stone-100 text-sm">
                <tr
                  v-for="user in users"
                  :key="user.id"
                  class="hover:bg-stone-50/60 transition-colors"
                >
                  <td class="py-3 px-4 font-medium text-neutral-dark">
                    <div class="flex items-center gap-2.5">
                      <div
                        class="w-7 h-7 rounded-full bg-stone-100 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0"
                      >
                        {{ user.fullName ? user.fullName.charAt(0) : "U" }}
                      </div>
                      <div class="min-w-0">
                        <div class="text-neutral-dark font-medium truncate">
                          {{ user.fullName }}
                        </div>
                        <div class="text-xs text-stone-400 font-normal truncate">
                          {{ user.email }}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <span
                      class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      :class="roleBadge(user.role).class"
                    >
                      {{ roleBadge(user.role).label }}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-stone-600 text-xs">
                    {{ user.phone ? formatPhone(user.phone) : "—" }}
                  </td>
                  <td class="py-3 px-4 text-stone-600 text-xs">
                    {{ user.city || "—" }}
                  </td>
                  <td class="py-3 px-4 text-stone-500 text-xs">
                    {{ formatarData(user.createdAt) }}
                  </td>
                  <td class="py-3 px-4 text-right">
                    <div class="inline-flex items-center gap-1">
                      <RouterLink
                        :to="`/admin/usuarios/${user.id}/editar`"
                        class="p-1.5 rounded-md text-stone-400 hover:text-secondary hover:bg-sky-50 transition-colors"
                        title="Editar Usuário"
                      >
                        <Icon icon="mdi:pencil-outline" class="w-4 h-4" />
                      </RouterLink>
                      <button
                        v-if="user.id !== authStore.user?.id"
                        type="button"
                        @click="abrirModalExclusao(user)"
                        class="p-1.5 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Desativar Usuário"
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

        <!-- Controles Limpos de Paginação -->
        <div
          class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 px-1"
        >
          <span>
            Página {{ currentPage }} de {{ totalPages }} ({{ totalUsers }} registros)
          </span>

          <div class="flex items-center gap-2">
            <button
              type="button"
              :disabled="currentPage <= 1 || loading"
              @click="carregarUsuarios(currentPage - 1)"
              class="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1 cursor-pointer"
            >
              <Icon icon="mdi:chevron-left" class="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <button
              type="button"
              :disabled="currentPage >= totalPages || loading"
              @click="carregarUsuarios(currentPage + 1)"
              class="px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Próxima</span>
              <Icon icon="mdi:chevron-right" class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Limpo de Confirmação de Exclusão Lógica -->
    <div
      v-if="isDeleteModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
    >
      <div
        class="bg-white rounded-xl w-full max-w-sm p-6 border border-stone-200 shadow-xl space-y-4"
      >
        <div class="flex items-start gap-3">
          <div
            class="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"
          >
            <Icon icon="mdi:alert-outline" class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-semibold text-neutral-dark">
              Desativar Conta de Usuário
            </h3>
            <p class="text-xs text-stone-500 mt-1 leading-relaxed">
              Deseja desativar o usuário <strong class="text-neutral-dark">{{ userToDelete?.fullName }}</strong> ({{ userToDelete?.email }})? O registro passará por exclusão lógica e a conta não poderá mais efetuar login.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
          <button
            type="button"
            @click="fecharModalExclusao"
            class="px-3.5 py-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium text-xs transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            :disabled="actionLoading"
            @click="confirmarExclusao"
            class="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
          >
            <span
              v-if="actionLoading"
              class="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></span>
            <span>Confirmar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
