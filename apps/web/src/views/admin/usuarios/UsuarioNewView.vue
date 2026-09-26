<script setup lang="ts">
import { usuariosApi } from "@/api";
import { useAppStore } from "@/stores/app";
import type { UserCreateInput, UserUpdateInput } from "@/types";
import { ref } from "vue";
import { useRouter, RouterLink } from "vue-router";
import UsuarioForm from "./UsuarioForm.vue";

const router = useRouter();
const appStore = useAppStore();

const saving = ref(false);
const errorMessage = ref<string | null>(null);

async function handleCreate(payload: UserCreateInput | UserUpdateInput) {
  saving.value = true;
  errorMessage.value = null;

  try {
    await usuariosApi.criar(payload as UserCreateInput);
    appStore.showAlert("Novo usuário cadastrado com sucesso!", "success");
    router.push("/admin/usuarios");
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    errorMessage.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Ocorreu um erro ao cadastrar o usuário.";
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  router.push("/admin/usuarios");
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
          <RouterLink to="/admin/usuarios" class="hover:text-neutral-dark transition-colors">
            Usuários
          </RouterLink>
          <span>/</span>
          <span class="text-neutral-dark font-medium">Novo Usuário</span>
        </div>

        <h1 class="text-2xl font-bold text-neutral-dark tracking-tight">
          Novo Usuário
        </h1>
        <p class="text-sm text-stone-500 mt-0.5">
          Cadastre novos clientes, vendedores ou administradores
        </p>
      </div>

      <!-- Container do Formulário -->
      <div class="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <UsuarioForm
          :loading="saving"
          :error-message="errorMessage"
          @submit="handleCreate"
          @cancel="handleCancel"
        />
      </div>
    </div>
  </div>
</template>
