<script setup lang="ts">
import { authApi } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { reactive, ref, onMounted } from "vue";
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

// Preenchido pelo PasswordStrengthPanel via v-model:valid
const isPasswordSecure = ref(false);
const loading = ref(false);
const generalError = ref("");

const formErrors = reactive({
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
});

onMounted(() => {
  if (typeof navigator !== "undefined" && navigator.cookieEnabled === false) {
    generalError.value =
      "Os cookies estão desabilitados no seu navegador. Para criar uma conta, por favor habilite os cookies nas configurações.";
  }
});

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
  }

  if (!form.confirmPassword) {
    formErrors.confirmPassword = "Confirme sua senha.";
    valid = false;
  } else if (form.password !== form.confirmPassword) {
    formErrors.confirmPassword = "As senhas não coincidem.";
    valid = false;
  } else if (!isPasswordSecure.value) {
    formErrors.password =
      "A senha deve cumprir todos os requisitos de segurança abaixo.";
    valid = false;
  }

  return valid;
}

async function handleSubmit() {
  if (typeof navigator !== "undefined" && navigator.cookieEnabled === false) {
    generalError.value =
      "Os cookies estão desabilitados no seu navegador. Habilite os cookies para criar sua conta.";
    return;
  }

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
        <UiInput
          id="name"
          v-model="form.name"
          label="Nome Completo"
          type="text"
          autocomplete="name"
          placeholder="Ex.: Maria Silveira"
          :error="formErrors.name"
          size="lg"
        />

        <!-- E-mail -->
        <UiInput
          id="email"
          v-model="form.email"
          label="E-mail"
          type="email"
          autocomplete="email"
          placeholder="seuemail@exemplo.com.br"
          :error="formErrors.email"
          size="lg"
        />

        <!-- Telefone / WhatsApp -->
        <UiInput
          id="phone"
          v-model="form.phone"
          label="WhatsApp / Telefone"
          type="tel"
          mask="phone"
          placeholder="(51) 99999-9999"
          :error="formErrors.phone"
          size="lg"
        />

        <!-- Senha -->
        <div>
          <UiInput
            id="password"
            v-model="form.password"
            label="Senha"
            type="password"
            autocomplete="new-password"
            placeholder="Crie sua senha segura"
            :error="formErrors.password"
            size="lg"
          />
          <PasswordStrengthPanel
            v-model:valid="isPasswordSecure"
            :password="form.password"
            :confirm-password="form.confirmPassword"
            class="mt-3"
          />
        </div>

        <!-- Confirmação de Senha -->
        <UiInput
          id="confirmPassword"
          v-model="form.confirmPassword"
          label="Confirme sua Senha"
          type="password"
          autocomplete="new-password"
          placeholder="Digite a senha novamente"
          :error="formErrors.confirmPassword"
          size="lg"
        />

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
            @click="$router.push({ path: '/login', query: $route.query })"
          >
            Fazer login
          </UiButton>
        </div>
      </form>
    </div>
  </div>
</template>
