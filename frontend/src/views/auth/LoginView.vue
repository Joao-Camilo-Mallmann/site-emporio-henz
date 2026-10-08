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

    const redirect =
      typeof route.query.redirect === "string" &&
      route.query.redirect.startsWith("/")
        ? route.query.redirect
        : "";

    if (authStore.isCliente) {
      router.push(redirect || "/");
    } else {
      router.push(redirect || "/admin");
    }
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
              aria-label="Alternar visibilidade da senha"
            >
              <!-- Ícone Olho / Ocultar -->
              <Icon
                @click="showPassword = !showPassword"
                :icon="showPassword ? 'mdi:eye' : 'mdi:eye-off'"
                class="w-5 h-5"
              />
            </button>
          </div>
          <p v-if="formErrors.password" class="mt-1 text-xs text-rose-600">
            {{ formErrors.password }}
          </p>
        </div>

        <!-- Botão Entrar -->
        <div class="pt-2">
          <UiButton
            type="submit"
            size="lg"
            variant="primary"
            block
            :loading="loading"
          >
            {{ loading ? "Entrando..." : "Entrar" }}
          </UiButton>
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
        <div
          class="text-center pt-2 text-sm text-stone-600 flex items-center justify-center gap-1.5"
        >
          <span>Não tem cadastro?</span>
          <UiButton
            variant="link"
            size="none"
            class="ml-1"
            @click="$router.push('/cadastro')"
          >
            Criar conta
          </UiButton>
        </div>
      </form>
    </div>
  </div>
</template>
