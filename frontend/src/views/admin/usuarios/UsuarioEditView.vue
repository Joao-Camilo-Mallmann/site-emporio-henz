<script setup lang="ts">
import { usuariosApi } from "@/api";
import { useToast } from "@/composables/useToast";
import {
  UserRole,
  type IAssignedSupplier,
  type IUser,
  type UserCreateInput,
  type UserUpdateInput,
} from "@/types";
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import UsuarioForm from "./UsuarioForm.vue";
import VendedorFornecedoresModal from "./VendedorFornecedoresModal.vue";

const route = useRoute();
const router = useRouter();
const toast = useToast();

const userId = computed(() => {
  return typeof route.params.id === "string" ? route.params.id : "";
});

const user = ref<IUser | null>(null);
const loading = ref(false);
const initialError = ref<string | null>(null);
const saving = ref(false);
const errorMessage = ref<string | null>(null);

// Gestão de Marcas / Fornecedores Vinculados (Vendedores)
const assignedSuppliers = ref<IAssignedSupplier[]>([]);
const loadingSuppliers = ref(false);
const suppliersError = ref<string | null>(null);
const isSuppliersModalOpen = ref(false);
const isVendedor = computed(
  () => Number(user.value?.role) === UserRole.Vendedor,
);

async function carregarFornecedoresVinculados() {
  if (!userId.value || Number(user.value?.role) !== UserRole.Vendedor) {
    assignedSuppliers.value = [];
    return;
  }
  loadingSuppliers.value = true;
  suppliersError.value = null;
  try {
    assignedSuppliers.value = await usuariosApi.listarTodosFornecedores(
      userId.value,
    );
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    suppliersError.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Não foi possível carregar as marcas vinculadas.";
  } finally {
    loadingSuppliers.value = false;
  }
}

async function carregarUsuario() {
  if (!userId.value) return;

  loading.value = true;
  initialError.value = null;

  try {
    user.value = await usuariosApi.buscarPorId(userId.value);
    // Carga secundária: não bloqueia nem derruba o formulário do usuário.
    void carregarFornecedoresVinculados();
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    initialError.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Não foi possível carregar os dados do usuário.";
  } finally {
    loading.value = false;
  }
}

async function handleUpdate(payload: UserCreateInput | UserUpdateInput) {
  if (!userId.value) return;

  saving.value = true;
  errorMessage.value = null;

  try {
    await usuariosApi.atualizar(userId.value, payload as UserUpdateInput);
    toast.success("Usuário atualizado com sucesso!");
    router.push("/admin/usuarios");
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    errorMessage.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Ocorreu um erro ao atualizar o usuário.";
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  router.push("/admin/usuarios");
}

onMounted(() => {
  carregarUsuario();
});
</script>

<template>
  <div
    class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-8 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- Breadcrumbs e Cabeçalho Limpo -->
      <div>
        <div class="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
          <RouterLink
            to="/admin"
            class="hover:text-neutral-dark transition-colors"
          >
            Painel
          </RouterLink>
          <span>/</span>
          <RouterLink
            to="/admin/usuarios"
            class="hover:text-neutral-dark transition-colors"
          >
            Usuários
          </RouterLink>
          <span>/</span>
          <span class="text-neutral-dark font-medium">Editar Usuário</span>
        </div>

        <h1 class="text-2xl font-bold text-neutral-dark tracking-tight">
          Editar Usuário
        </h1>
        <p class="text-sm text-stone-500 mt-0.5">
          Atualize as permissões de acesso ou redefina a senha da conta
        </p>
      </div>

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
          <span class="text-xs">Carregando dados do usuário...</span>
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
              @click="carregarUsuario"
            >
              Tentar Novamente
            </UiButton>
            <UiButton
              variant="outline"
              size="sm"
              @click="$router.push('/admin/usuarios')"
            >
              Voltar à Lista
            </UiButton>
          </div>
        </div>

        <UsuarioForm
          v-else-if="user"
          :initial-data="user"
          is-editing
          :loading="saving"
          :error-message="errorMessage"
          @submit="handleUpdate"
          @cancel="handleCancel"
        />
      </div>

      <!-- Seção de Marcas e Fornecedores Autorizados (Exclusivo Vendedores) -->
      <div
        v-if="isVendedor"
        class="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <div class="flex items-center gap-2">
              <Icon icon="mdi:domain" class="w-5 h-5 text-secondary" />
              <h2 class="text-base font-bold text-neutral-dark">
                Marcas e Fornecedores Autorizados
              </h2>
            </div>
            <p class="text-xs text-stone-500 mt-1">
              Empresas parceiras que este vendedor tem permissão para gerenciar
              e cadastrar produtos no catálogo
            </p>
          </div>

          <UiButton
            variant="outline"
            size="sm"
            class="shrink-0"
            @click="isSuppliersModalOpen = true"
          >
            <Icon icon="mdi:pencil-outline" class="w-4 h-4" />
            <span>Gerenciar Marcas</span>
          </UiButton>
        </div>

        <!-- Carregando marcas -->
        <div
          v-if="loadingSuppliers"
          class="py-4 text-xs text-stone-500 flex items-center gap-2"
        >
          <div
            class="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"
          ></div>
          <span>Carregando marcas autorizadas...</span>
        </div>

        <!-- Falha ao carregar marcas -->
        <div
          v-else-if="suppliersError"
          class="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3"
        >
          <span>{{ suppliersError }}</span>
          <UiButton
            variant="danger"
            size="xs"
            @click="carregarFornecedoresVinculados"
          >
            Tentar Novamente
          </UiButton>
        </div>

        <!-- Lista de Chips / Badges das Marcas Vinculadas -->
        <div v-else>
          <div
            v-if="assignedSuppliers.length > 0"
            class="flex flex-wrap items-center gap-2 pt-1"
          >
            <span
              v-for="s in assignedSuppliers"
              :key="s.id"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-secondary-hover border border-sky-100 text-xs font-medium"
            >
              <Icon
                icon="mdi:check-circle"
                class="w-3.5 h-3.5 text-secondary"
              />
              <span>{{ s.name }}</span>
            </span>

            <UiButton
              variant="outline"
              size="xs"
              class="border-dashed border-stone-300 text-stone-600 hover:text-secondary hover:border-secondary hover:bg-secondary/5 transition-colors"
              title="Vincular novas marcas ou alterar as atuais"
              @click="isSuppliersModalOpen = true"
            >
              <Icon icon="mdi:plus" class="w-4 h-4 text-secondary" />
              <span>Vincular mais</span>
            </UiButton>
          </div>

          <!-- Vendedor sem marcas vinculadas -->
          <div
            v-else
            class="p-4 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-800 flex items-start justify-between gap-3"
          >
            <div class="flex items-start gap-2">
              <Icon
                icon="mdi:alert-circle-outline"
                class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"
              />
              <span class="leading-relaxed">
                Nenhum fornecedor vinculado a este vendedor. Sem marcas
                autorizadas, o vendedor não poderá cadastrar produtos no
                catálogo (regra RF15).
              </span>
            </div>
            <UiButton
              variant="secondary"
              size="xs"
              class="shrink-0"
              @click="isSuppliersModalOpen = true"
            >
              Vincular Agora
            </UiButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de Gestão de Vínculos de Fornecedores -->
    <VendedorFornecedoresModal
      :open="isSuppliersModalOpen"
      :vendedor="user"
      @close="isSuppliersModalOpen = false"
      @saved="carregarFornecedoresVinculados"
    />
  </div>
</template>
