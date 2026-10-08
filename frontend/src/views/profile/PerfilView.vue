<script setup lang="ts">
import { authApi } from "@/api";
import { useToast } from "@/composables/useToast";
import { useAuthStore } from "@/stores/auth";
import type { IUser, UserCreateInput, UserUpdateInput, UserProfile } from "@/types";
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import UsuarioForm from "@/views/admin/usuarios/UsuarioForm.vue";

const router = useRouter();
const toast = useToast();
const authStore = useAuthStore();

const userProfile = ref<UserProfile | null>(null);
const formRef = ref<InstanceType<typeof UsuarioForm> | null>(null);
const loading = ref(false);
const initialError = ref<string | null>(null);
const saving = ref(false);
const errorMessage = ref<string | null>(null);

const initialUserData = computed<Partial<IUser>>(() => {
  if (!userProfile.value) return {};
  return {
    id: userProfile.value.id,
    email: userProfile.value.email,
    role: userProfile.value.role,
    fullName: userProfile.value.fullName || userProfile.value.name || "",
    phone: userProfile.value.phone || null,
    city: userProfile.value.city || null,
  };
});

async function carregarPerfil() {
  loading.value = true;
  initialError.value = null;

  try {
    const profile = await authApi.me();
    userProfile.value = profile;
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    initialError.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Não foi possível carregar os dados do seu perfil.";
  } finally {
    loading.value = false;
  }
}

async function handleUpdate(payload: UserCreateInput | UserUpdateInput) {
  saving.value = true;
  errorMessage.value = null;

  try {
    const updateData = {
      fullName: payload.fullName || "",
      phone: payload.phone || undefined,
      city: payload.city || undefined,
      password: payload.password || undefined,
    };

    const updated = await authApi.atualizarPerfil(updateData);
    userProfile.value = updated;
    await authStore.fetchCurrentUser();
    formRef.value?.resetPasswordFields();
    toast.success("Perfil atualizado com sucesso!");
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    errorMessage.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Ocorreu um erro ao atualizar o seu perfil.";
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  router.push("/");
}

onMounted(() => {
  carregarPerfil();
});
</script>

<template>
  <div class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- Breadcrumbs e Cabeçalho -->
      <div>
        <div class="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
          <RouterLink to="/" class="hover:text-neutral-dark transition-colors">
            Início
          </RouterLink>
          <span>/</span>
          <span class="text-neutral-dark font-medium">Meu Perfil</span>
        </div>

        <h1 class="text-2xl font-bold text-neutral-dark tracking-tight">
          Meu Perfil
        </h1>
        <p class="text-sm text-stone-500 mt-0.5">
          Gerencie seus dados de contato e credenciais de acesso
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
          <span class="text-xs">Carregando dados do perfil...</span>
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
          <UiButton
            type="button"
            variant="danger"
            size="sm"
            @click="carregarPerfil"
          >
            Tentar Novamente
          </UiButton>
        </div>

        <!-- Formulário com hide-role ativado -->
        <UsuarioForm
          ref="formRef"
          v-else-if="userProfile"
          :initial-data="initialUserData"
          is-editing
          hide-role
          :loading="saving"
          :error-message="errorMessage"
          @submit="handleUpdate"
          @cancel="handleCancel"
        />
      </div>
    </div>
  </div>
</template>
