<script setup lang="ts">
import { authApi } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = reactive({
  email: "",
  password: "",
});

const showPassword = ref(false);
const loading = ref(false);
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
    formErrors.email = "Por favor, informe seu e-mail.";
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    formErrors.email = "Informe um endereço de e-mail válido.";
    valid = false;
  }

  if (!form.password) {
    formErrors.password = "Por favor, digite sua senha.";
    valid = false;
  }

  return valid;
}

async function handleSubmit() {
  if (!validate()) return;

  loading.value = true;
  generalError.value = "";

  try {
    const body = {
      email: form.email.trim(),
      password: form.password,
    };

    const response = await authApi.login(body);
    authStore.setAuth(response);

    const redirectPath =
      typeof route.query.redirect === "string" &&
      route.query.redirect.startsWith("/")
        ? route.query.redirect
        : "/admin";
    router.push(redirectPath);
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    generalError.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Falha ao realizar login.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div
    class="min-h-[calc(100vh-14rem)] flex items-center justify-center py-10 px-4 sm:px-6"
  >
    <div
      class="w-full max-w-xl bg-white rounded-2xl shadow-[0px_5px_20px_rgba(0,0,0,0.06)] border border-stone-200/80 p-8 sm:p-12"
    >
      <!-- Cabeçalho do Card -->
      <div class="text-center mb-8">
        <h1
          class="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight"
        >
          Acesse sua conta
        </h1>
        <p class="text-sm text-stone-500 mt-2">
          Acompanhe suas preferências e histórico de orçamentos na Empório Henz
        </p>
      </div>

      <!-- Erro Geral -->
      <div
        v-if="generalError"
        class="mb-6 rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 flex items-start gap-3"
      >
        <svg
          class="w-5 h-5 text-rose-500 shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>{{ generalError }}</span>
      </div>

      <!-- Formulário -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Campo E-mail -->
        <div>
          <label
            for="email"
            class="block text-sm font-bold text-stone-900 mb-2"
          >
            E-mail
          </label>
          <div class="relative">
            <input
              id="email"
              v-model="form.email"
              type="email"
              autocomplete="email"
              placeholder="Digite seu e-mail"
              :class="[
                'w-full px-4 py-3 rounded-lg border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-colors',
                formErrors.email
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-stone-300 focus:border-secondary-hover focus:ring-sky-100',
              ]"
            />
          </div>
          <p v-if="formErrors.email" class="mt-1 text-xs text-rose-600">
            {{ formErrors.email }}
          </p>
        </div>

        <!-- Campo Senha -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label
              for="password"
              class="block text-sm font-bold text-stone-900"
            >
              Digite sua senha
            </label>
            <a
              href="#"
              class="text-xs font-medium text-secondary hover:underline"
              @click.prevent="
                generalError =
                  'Para redefinir a senha em ambiente de testes, utilize as credenciais padrão de teste abaixo.'
              "
            >
              Esqueci minha senha
            </a>
          </div>
          <div class="relative">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Digite sua senha"
              :class="[
                'w-full px-4 py-3 pr-12 rounded-lg border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-colors',
                formErrors.password
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-stone-300 focus:border-secondary-hover focus:ring-sky-100',
              ]"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none"
              tabindex="-1"
              @click="showPassword = !showPassword"
              aria-label="Alternar visibilidade da senha"
            >
              <!-- Ícone Olho / Ocultar -->
              <svg
                v-if="!showPassword"
                class="w-5 h-5"
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
                class="w-5 h-5"
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

        <!-- Botão Entrar -->
        <div class="pt-2">
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3.5 px-6 rounded-[10px] bg-secondary-hover hover:bg-primary text-white font-medium text-base shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span
              v-if="loading"
              class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></span>
            <span>{{ loading ? "Entrando..." : "Entrar" }}</span>
          </button>
        </div>

        <!-- Divisor Social -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-stone-200"></div>
          </div>
          <div class="relative flex justify-center text-xs uppercase">
            <span
              class="bg-white px-4 text-stone-500 font-medium tracking-wider"
            >
              ou acesse com
            </span>
          </div>
        </div>

        <!-- Link para Cadastro -->
        <div class="text-center pt-2 text-sm text-stone-600">
          Não tem cadastro?
          <RouterLink
            to="/cadastro"
            class="font-bold text-stone-900 hover:text-secondary-hover transition-colors ml-1"
          >
            Cadastre-se
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>
