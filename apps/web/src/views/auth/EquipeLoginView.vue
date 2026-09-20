<script setup lang="ts">
import router from "@/router";
import { useAuthStore } from "@/stores/auth";
import { reactive, ref } from "vue";

const authStore = useAuthStore();

const form = reactive({
  email: "",
  password: "",
});

const showPassword = ref(false);
const formErrors = reactive({
  email: "",
  password: "",
});
const generalError = ref("");

function validate(): boolean {
  let valid = true;
  formErrors.email = "";
  formErrors.password = "";
  generalError.value = "";

  if (!form.email.trim()) {
    formErrors.email = "Informe seu e-mail institucional.";
    valid = false;
  }

  if (!form.password) {
    formErrors.password = "Informe sua credencial de acesso.";
    valid = false;
  }

  return valid;
}

async function handleSubmit() {
  if (!validate()) return;

  try {
    await authStore.login({
      email: form.email.trim(),
      password: form.password,
    });

    if (!authStore.isEquipe) {
      authStore.logout();
      generalError.value =
        "Acesso restrito. Esta credencial pertence a um cliente e não possui acesso ao portal da equipe.";
      return;
    }

    router.push("/");
  } catch (err: unknown) {
    const errorObj = err as Error;
    generalError.value =
      errorObj.message || "Credenciais corporativas inválidas.";
  }
}

function fillAccount(email: string, pass: string) {
  form.email = email;
  form.password = pass;
  formErrors.email = "";
  formErrors.password = "";
  generalError.value = "";
}
</script>

<template>
  <div
    class="min-h-[calc(100vh-14rem)] flex items-center justify-center py-10 px-4 sm:px-6"
  >
    <div
      class="w-full max-w-md bg-white rounded-2xl shadow-[0px_8px_30px_rgba(0,0,0,0.12)] border border-stone-200 p-8 sm:p-10"
    >
      <!-- Topo Institucional -->
      <div class="text-center mb-8">
        <div
          class="mx-auto w-12 h-12 rounded-xl bg-primary-dark text-amber-400 flex items-center justify-center mb-4 shadow-sm"
        >
          <!-- Ícone Cadeado -->
          <svg
            class="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <span
          class="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 mb-2"
        >
          Área Restrita
        </span>
        <h1 class="text-2xl font-bold text-stone-900 tracking-tight">
          Portal da Equipe
        </h1>
        <p class="text-xs text-stone-500 mt-1">
          Acesso exclusivo para Vendedores e Gestores Empório Henz
        </p>
      </div>

      <!-- Alerta Geral -->
      <div
        v-if="generalError"
        class="mb-6 rounded-lg bg-rose-50 border border-rose-200 p-4 text-xs text-rose-700 flex items-start gap-2.5"
      >
        <svg
          class="w-4 h-4 text-rose-500 shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{{ generalError }}</span>
      </div>

      <!-- Formulário -->
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <div>
          <label
            for="equipe-email"
            class="block text-xs font-bold text-stone-900 uppercase tracking-wider mb-2"
          >
            E-mail Corporativo
          </label>
          <input
            id="equipe-email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="colaborador@emporiohenz.com.br"
            :class="[
              'w-full px-4 py-2.5 rounded-lg border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-colors',
              formErrors.email
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                : 'border-stone-300 focus:border-primary-dark focus:ring-slate-100',
            ]"
          />
          <p v-if="formErrors.email" class="mt-1 text-xs text-rose-600">
            {{ formErrors.email }}
          </p>
        </div>

        <div>
          <label
            for="equipe-password"
            class="block text-xs font-bold text-stone-900 uppercase tracking-wider mb-2"
          >
            Senha de Acesso
          </label>
          <div class="relative">
            <input
              id="equipe-password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Digite sua senha"
              :class="[
                'w-full px-4 py-2.5 pr-12 rounded-lg border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-colors',
                formErrors.password
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                : 'border-stone-300 focus:border-primary-dark focus:ring-slate-100',
              ]"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none"
              tabindex="-1"
              @click="showPassword = !showPassword"
              aria-label="Alternar visibilidade da senha"
            >
              <svg
                v-if="!showPassword"
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <svg
                v-else
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                />
              </svg>
            </button>
          </div>
          <p v-if="formErrors.password" class="mt-1 text-xs text-rose-600">
            {{ formErrors.password }}
          </p>
        </div>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full py-3 px-6 rounded-lg bg-primary-dark hover:bg-primary text-white font-medium text-sm shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <span
            v-if="authStore.loading"
            class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
          ></span>
          <span>{{
            authStore.loading ? "Autenticando..." : "Entrar no Portal Interno"
          }}</span>
        </button>

        <div class="text-center pt-2">
          <RouterLink
            to="/"
            class="text-xs text-stone-500 hover:text-stone-800 transition-colors inline-flex items-center gap-1"
          >
            ← Voltar para o mostruário da loja
          </RouterLink>
        </div>
      </form>

      <!-- Acesso Rápido para Demonstração / Testes -->
      <div class="mt-8 pt-5 border-t border-stone-200 text-xs text-stone-500">
        <p class="font-semibold text-stone-700 mb-2">
          Perfis para testes rápidos:
        </p>
        <div class="grid grid-cols-2 gap-2">
          <button
            type="button"
            @click="fillAccount('admin@emporiohenz.com.br', 'admin123')"
            class="p-2 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 text-left transition-colors"
          >
            <div class="font-semibold text-[11px] text-primary-dark">
              Administrador
            </div>
            <div class="text-[10px] text-stone-500 truncate">João Henz</div>
          </button>
          <button
            type="button"
            @click="fillAccount('vendedor@emporiohenz.com.br', '12345678')"
            class="p-2 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 text-left transition-colors"
          >
            <div class="font-semibold text-[11px] text-amber-800">Vendedor</div>
            <div class="text-[10px] text-stone-500 truncate">Carlos Mendes</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
