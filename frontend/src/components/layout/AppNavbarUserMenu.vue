<script setup lang="ts">
import { useAuthStore } from "@/stores/auth";
import { useListasStore } from "@/stores/listas";
import { Icon } from "@iconify/vue";
import { onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";

defineProps<{
  accountPath: string;
}>();

const emit = defineEmits<{
  (e: "logout"): void;
}>();

const router = useRouter();
const authStore = useAuthStore();
const listasStore = useListasStore();
const container = ref<HTMLElement | null>(null);
const isOpen = ref(false);

function toggle() {
  isOpen.value = !isOpen.value;
}

function close() {
  isOpen.value = false;
}

function navigateTo(path: string) {
  close();
  router.push(path);
}

function openSavedLists() {
  close();
  listasStore.openManageModal();
}

function logout() {
  close();
  emit("logout");
}

function handleClickOutside(event: MouseEvent) {
  if (!container.value?.contains(event.target as Node)) close();
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && isOpen.value) close();
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("keydown", handleKeydown);
});
</script>

<template>
  <!-- Menu de Usuário Desktop -->
  <div id="user-menu-container" ref="container" class="relative">
    <!-- Usuário Autenticado -->
    <button
      v-if="authStore.isAuthenticated && authStore.user"
      @click="toggle"
      class="flex flex-col sm:flex-row items-center gap-1.5 p-1.5 rounded-lg hover:bg-white/10 transition-all focus:outline-none cursor-pointer group"
      aria-label="Abrir menu do usuário"
    >
      <div
        class="w-7 h-7 rounded-full flex items-center border-white justify-center text-white font-bold text-xs uppercase transition-colors border"
      >
        {{ authStore.user.name.charAt(0) }}
      </div>
      <div class="hidden sm:block text-left">
        <div
          class="font-bold text-xs leading-tight text-white truncate max-w-[100px]"
        >
          {{ authStore.user.name.split(" ")[0] }}
        </div>
        <div class="text-[10px] text-amber-300 capitalize leading-none">
          {{
            authStore.user.roleName ||
            (authStore.isAdmin
              ? "Admin"
              : authStore.isVendedor
                ? "Vendedor"
                : "Cliente")
          }}
        </div>
      </div>
      <Icon
        :icon="isOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'"
        class="w-4 h-4 text-white/80 transition-transform duration-200"
      />
    </button>

    <!-- Dropdown do Usuário Autenticado -->
    <div
      v-if="isOpen && authStore.isAuthenticated && authStore.user"
      class="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-stone-200 py-2 text-stone-800 z-50 text-sm animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div
        class="px-4 py-3 border-b border-stone-100 bg-stone-50/50 rounded-t-xl"
      >
        <p class="font-bold text-stone-900 truncate">
          {{ authStore.user.name }}
        </p>
        <p class="text-xs text-stone-500 truncate">
          {{ authStore.user.email }}
        </p>
        <span
          class="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
          :class="
            authStore.isAdmin
              ? 'bg-purple-100 text-purple-800'
              : authStore.isVendedor
                ? 'bg-blue-100 text-blue-800'
                : 'bg-emerald-100 text-emerald-800'
          "
        >
          Perfil
          {{
            authStore.user.roleName ||
            (authStore.isAdmin
              ? "Administrador"
              : authStore.isVendedor
                ? "Vendedor"
                : "Cliente")
          }}
        </span>
      </div>

      <div class="py-1">
        <UiButton
          variant="custom"
          size="none"
          block
          @click="navigateTo(accountPath)"
          class="w-full flex items-center justify-start gap-2.5 px-4 py-2 hover:bg-stone-50 text-stone-700 transition-colors text-left font-normal rounded-none cursor-pointer"
        >
          <Icon
            icon="mdi:account-edit-outline"
            class="w-4 h-4 text-stone-400 shrink-0"
          />
          <span>{{ authStore.isAdmin ? "Editar Usuário" : "Meu Perfil" }}</span>
        </UiButton>

        <UiButton
          variant="ghost"
          size="none"
          block
          @click="openSavedLists"
          class="w-full flex items-center justify-start gap-2.5 px-4 py-2 hover:bg-stone-50 text-stone-700 transition-colors text-left border-none bg-transparent cursor-pointer font-normal rounded-none"
        >
          <div class="flex items-center gap-2.5">
            <Icon
              icon="mdi:heart-outline"
              class="w-4 h-4 text-stone-400 shrink-0"
            />
            <span>Móveis Salvos</span>
          </div>
          <span
            v-if="listasStore.totalSavedCount > 0"
            class="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full font-semibold"
          >
            {{ listasStore.totalSavedCount }}
          </span>
        </UiButton>

        <UiButton
          v-if="authStore.isEquipe"
          variant="custom"
          size="none"
          block
          @click="navigateTo('/admin')"
          class="w-full flex items-center justify-start gap-2.5 px-4 py-2 hover:bg-amber-50 text-amber-900 transition-colors font-medium text-left rounded-none cursor-pointer"
        >
          <Icon
            icon="mdi:shield-account"
            class="w-4 h-4 text-amber-700 shrink-0"
          />
          <span>Painel Admin</span>
        </UiButton>
      </div>

      <div class="border-t border-stone-100 pt-1">
        <UiButton
          variant="custom"
          size="none"
          block
          @click="logout"
          class="w-full flex items-center justify-start gap-2.5 px-4 py-2 text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer font-normal rounded-none"
        >
          <Icon icon="mdi:logout" class="w-4 h-4 text-rose-600 shrink-0" />
          <span>Sair da conta</span>
        </UiButton>
      </div>
    </div>

    <!-- Visitante Não Autenticado Desktop -->
    <RouterLink
      v-if="!authStore.isAuthenticated"
      to="/login"
      class="flex flex-col items-center justify-center gap-1 text-white hover:text-sky-200 hover:bg-white/10 px-3 py-1.5 rounded-xl transition-all duration-200 group cursor-pointer"
    >
      <svg
        class="w-5 h-5 text-white transition-all duration-200 group-hover:scale-110 group-hover:text-sky-200"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="1.8"
      >
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="10" r="3" />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M6.168 18.849A4 4 0 0110 16h4a4 4 0 013.832 2.849"
        />
      </svg>
      <span class="text-xs font-semibold leading-tight tracking-tight"
        >Minha conta</span
      >
    </RouterLink>
  </div>
</template>
