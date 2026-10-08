<script setup lang="ts">
import { authApi } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
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

    const redirect =
      typeof route.query.redirect === "string" &&
      route.query.redirect.startsWith("/")
        ? route.query.redirect
        : "";

    router.push(redirect || "/");
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
        <Icon
          icon="mdi:alert-outline"
          class="w-5 h-5 text-rose-500 shrink-0 mt-0.5"
        />
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
              <Icon
                :icon="showPassword ? 'mdi:eye-off' : 'mdi:eye'"
                class="w-5 h-5"
              />
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
              <Icon
                :icon="showConfirmPassword ? 'mdi:eye-off' : 'mdi:eye'"
                class="w-5 h-5"
              />
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
          <UiButton
            type="submit"
            variant="primary"
            size="lg"
            block
            :disabled="loading"
          >
            <span
              v-if="loading"
              class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
            ></span>
            <span>{{
              loading ? "Criando conta..." : "Criar minha conta"
            }}</span>
          </UiButton>
        </div>

        <!-- Link para Voltar ao Login -->
        <div class="text-center pt-2 text-sm text-stone-600 flex items-center justify-center gap-1.5">
          <span>Já possui conta?</span>
          <UiButton
            variant="link"
            size="none"
            class="ml-1"
            @click="$router.push('/login')"
          >
            Fazer login
          </UiButton>
        </div>
      </form>
    </div>
  </div>
</template>
