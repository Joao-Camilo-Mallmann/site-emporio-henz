<script setup lang="ts">
import { authApi } from "@/api";
import { useAuthStore } from "@/stores/auth";
import type { IUser, UserProfile } from "@/types";
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import UsuarioForm from "@/views/admin/usuarios/UsuarioForm.vue";

// Tela "Meu Perfil": carrega o perfil e reutiliza o `UsuarioForm` no modo
// `perfil`, que grava em `PUT /auth/me` e permanece na tela.

const router = useRouter();
const authStore = useAuthStore();

const userProfile = ref<UserProfile | null>(null);
const loading = ref(false);
const initialError = ref<string | null>(null);

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

/** Perfil gravado pelo formulário: atualiza a tela e o usuário logado. */
async function handleSaved(profile: UserProfile | null) {
  if (profile) userProfile.value = profile;
  try {
    await authStore.fetchCurrentUser();
  } catch {
    // O perfil já foi salvo; o cabeçalho atualiza no próximo carregamento.
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
      <UiPageHeader
        :breadcrumbs="[{ name: 'Início', link: '/' }, { name: 'Meu Perfil' }]"
        title="Meu Perfil"
        description="Gerencie seus dados de contato e credenciais de acesso"
      />

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

        <!-- Formulário no modo perfil, sem seletor de papel -->
        <UsuarioForm
          v-else-if="userProfile"
          :initial-data="initialUserData"
          is-editing
          hide-role
          perfil
          @saved="handleSaved"
          @cancel="handleCancel"
        />
      </div>
    </div>
  </div>
</template>
