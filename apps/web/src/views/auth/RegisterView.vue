<script setup lang="ts">
import { authApi } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
});

const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);
const generalError = ref("");

const formErrors = reactive({
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
});

// Máscara dinâmica para WhatsApp / Telefone: (99) 99999-9999
function handlePhoneInput(event: Event) {
  const target = event.target as HTMLInputElement;
  let digits = target.value.replace(/\D/g, "");

  if (digits.length > 11) {
    digits = digits.substring(0, 11);
  }

  if (digits.length <= 2) {
    form.phone = digits.length ? `(${digits}` : "";
  } else if (digits.length <= 6) {
    form.phone = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  } else if (digits.length <= 10) {
    form.phone = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  } else {
    form.phone = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }
}

function validate(): boolean {
  let valid = true;
  formErrors.name = "";
  formErrors.email = "";
  formErrors.phone = "";
  formErrors.password = "";
  formErrors.confirmPassword = "";
  generalError.value = "";

  if (!form.name.trim() || form.name.trim().length < 3) {
    formErrors.name = "Informe seu nome completo (mínimo 3 caracteres).";
    valid = false;
  }

  if (!form.email.trim()) {
    formErrors.email = "Informe seu endereço de e-mail.";
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    formErrors.email = "Informe um e-mail válido.";
    valid = false;
  }

  const phoneDigits = form.phone.replace(/\D/g, "");
  if (phoneDigits.length < 10) {
    formErrors.phone = "Informe um telefone/WhatsApp válido com DDD.";
    valid = false;
  }

  if (!form.password) {
    formErrors.password = "Crie uma senha.";
    valid = false;
  } else if (form.password.length < 8) {
    formErrors.password = "A senha deve conter no mínimo 8 caracteres.";
    valid = false;
  }

  if (!form.confirmPassword) {
    formErrors.confirmPassword = "Confirme sua senha.";
    valid = false;
  } else if (form.password !== form.confirmPassword) {
    formErrors.confirmPassword = "As senhas não coincidem.";
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
      fullName: form.name.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
    };

    const response = await authApi.register(body);

    authStore.setAuth(response);

    router.push("/");
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    generalError.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Falha ao realizar cadastro.";
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
      <!-- Cabeçalho -->
      <div class="text-center mb-8">
        <h1
          class="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight"
        >
          Crie sua conta
        </h1>
        <p class="text-sm text-stone-500 mt-2">
          Cadastre-se na Empório Henz para salvar listas, personalizar
          acabamentos e solicitar orçamentos
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
      <form @submit.prevent="handleSubmit" class="space-y-5">
        <!-- Nome Completo -->
        <div>
          <label for="name" class="block text-sm font-bold text-stone-900 mb-2">
            Nome Completo
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            autocomplete="name"
            placeholder="Ex.: Maria Silveira"
            :class="[
              'w-full px-4 py-3 rounded-lg border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-colors',
              formErrors.name
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                : 'border-stone-300 focus:border-secondary-hover focus:ring-sky-100',
            ]"
          />
          <p v-if="formErrors.name" class="mt-1 text-xs text-rose-600">
            {{ formErrors.name }}
          </p>
        </div>

        <!-- E-mail -->
        <div>
          <label
            for="email"
            class="block text-sm font-bold text-stone-900 mb-2"
          >
            E-mail
          </label>
          <input
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="seuemail@exemplo.com.br"
            :class="[
              'w-full px-4 py-3 rounded-lg border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-colors',
              formErrors.email
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                : 'border-stone-300 focus:border-secondary-hover focus:ring-sky-100',
            ]"
          />
          <p v-if="formErrors.email" class="mt-1 text-xs text-rose-600">
            {{ formErrors.email }}
          </p>
        </div>

        <!-- Telefone / WhatsApp -->
        <div>
          <label
            for="phone"
            class="block text-sm font-bold text-stone-900 mb-2"
          >
            WhatsApp / Telefone
          </label>
          <input
            id="phone"
            :value="form.phone"
            type="tel"
            placeholder="(51) 99999-9999"
            @input="handlePhoneInput"
            :class="[
              'w-full px-4 py-3 rounded-lg border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-colors',
              formErrors.phone
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                : 'border-stone-300 focus:border-secondary-hover focus:ring-sky-100',
            ]"
          />
          <p v-if="formErrors.phone" class="mt-1 text-xs text-rose-600">
            {{ formErrors.phone }}
          </p>
        </div>

        <!-- Senha -->
        <div>
          <label
            for="password"
            class="block text-sm font-bold text-stone-900 mb-2"
          >
            Senha (mínimo 8 caracteres)
          </label>
          <div class="relative">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Crie sua senha segura"
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

        <!-- Confirmação de Senha -->
        <div>
          <label
            for="confirmPassword"
            class="block text-sm font-bold text-stone-900 mb-2"
          >
            Confirme sua Senha
          </label>
          <div class="relative">
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="Digite a senha novamente"
              :class="[
                'w-full px-4 py-3 pr-12 rounded-lg border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-colors',
                formErrors.confirmPassword
                  ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-stone-300 focus:border-secondary-hover focus:ring-sky-100',
              ]"
            />
            <button
              type="button"
              class="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 focus:outline-none"
              tabindex="-1"
              @click="showConfirmPassword = !showConfirmPassword"
              aria-label="Alternar visibilidade da confirmação"
            >
              <svg
                v-if="!showConfirmPassword"
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
          <p
            v-if="formErrors.confirmPassword"
            class="mt-1 text-xs text-rose-600"
          >
            {{ formErrors.confirmPassword }}
          </p>
        </div>

        <!-- Botão Criar Conta -->
        <div class="pt-4">
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3.5 px-6 rounded-[10px] bg-secondary-hover hover:bg-primary text-white font-medium text-base shadow-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span
              v-if="loading"
              class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></span>
            <span>{{
              loading ? "Criando conta..." : "Criar minha conta"
            }}</span>
          </button>
        </div>

        <!-- Link para Voltar ao Login -->
        <div class="text-center pt-2 text-sm text-stone-600">
          Já possui conta?
          <RouterLink
            to="/login"
            class="font-bold text-stone-900 hover:text-secondary-hover transition-colors ml-1"
          >
            Entrar
          </RouterLink>
        </div>
      </form>
    </div>
  </div>
</template>
