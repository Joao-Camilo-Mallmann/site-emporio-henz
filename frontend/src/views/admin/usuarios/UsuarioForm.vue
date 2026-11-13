<script setup lang="ts">
import { authApi, usuariosApi } from "@/api";
import { useToast } from "@/composables/useToast";
import {
  UserRole,
  type IUser,
  type UserCreateInput,
  type UserProfile,
  type UserUpdateInput,
} from "@/types";
import { formatPhone, maskPhoneInput } from "@/utils/phone";
import { Icon } from "@iconify/vue";
import { reactive, ref, useTemplateRef, watch } from "vue";
import { useRouter } from "vue-router";
import UsuarioSenhaCampos from "./UsuarioSenhaCampos.vue";

// Formulário de usuário, dono da gravação. Três modos: cadastro (`POST
// /users`), edição pelo admin (`PUT /users/:id`, com `userId`) e "Meu Perfil"
// (`perfil`: `PUT /auth/me`, sem sair da tela). Mostra o toast e, no admin,
// volta para a lista. As telas só carregam os dados e renderizam.

interface Props {
  /** Id do usuário na edição pelo admin. */
  userId?: string;
  initialData?: Partial<IUser>;
  isEditing?: boolean;
  hideRole?: boolean;
  /** Tela "Meu Perfil": grava o próprio perfil e permanece na tela. */
  perfil?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  userId: "",
  initialData: () => ({
    fullName: "",
    email: "",
    role: UserRole.Cliente,
    phone: "",
    city: "",
  }),
  isEditing: false,
  hideRole: false,
  perfil: false,
});

const emit = defineEmits<{
  /** Gravado. No modo perfil traz o perfil devolvido pela API. */
  (e: "saved", profile: UserProfile | null): void;
  (e: "cancel"): void;
}>();

const LISTA_URL = "/admin/usuarios";

const router = useRouter();
const toast = useToast();

const saving = ref(false);
const errorMessage = ref<string | null>(null);
const senha = useTemplateRef<{ reset: () => void }>("senha");

const form = reactive({
  fullName: props.initialData?.fullName || "",
  email: props.initialData?.email || "",
  password: "",
  confirmPassword: "",
  role: (props.initialData?.role as number) || (UserRole.Cliente as number),
  phone: props.initialData?.phone ? formatPhone(props.initialData.phone) : "",
  city: props.initialData?.city || "",
});

const formErrors = reactive({
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  role: "",
});

// Preenchido pelo PasswordStrengthPanel via v-model:valid
const isPasswordSecure = ref(false);

watch(isPasswordSecure, (secure) => {
  if (!secure) return;
  formErrors.password = "";
  formErrors.confirmPassword = "";
});

function resetPasswordFields() {
  form.password = "";
  form.confirmPassword = "";
  senha.value?.reset();
  formErrors.password = "";
  formErrors.confirmPassword = "";
}

watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      form.fullName = newData.fullName || "";
      form.email = newData.email || "";
      form.role = (newData.role as number) || (UserRole.Cliente as number);
      form.phone = newData.phone ? formatPhone(newData.phone) : "";
      form.city = newData.city || "";
      resetPasswordFields();
    }
  },
  { deep: true },
);

function handlePhoneInput(e: Event) {
  form.phone = maskPhoneInput(e);
  if (formErrors.phone) {
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length === 0 || digits.length === 10 || digits.length === 11) {
      formErrors.phone = "";
    }
  }
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function validateEmail(value: string): boolean {
  if (!value.trim()) {
    formErrors.email = "O e-mail é obrigatório.";
    return false;
  }
  if (!EMAIL_REGEX.test(value.trim().toLowerCase())) {
    formErrors.email =
      "Informe um endereço de e-mail válido (ex.: usuario@dominio.com).";
    return false;
  }
  formErrors.email = "";
  return true;
}

function handleEmailInput() {
  if (formErrors.email) {
    validateEmail(form.email);
  }
}

function handlePasswordInput() {
  // Na edição, apagar a nova senha descarta a redefinição
  if (props.isEditing && !form.password) {
    form.confirmPassword = "";
    formErrors.password = "";
    formErrors.confirmPassword = "";
    return;
  }
  if (formErrors.confirmPassword && form.password === form.confirmPassword) {
    formErrors.confirmPassword = "";
  }
}

function validate(): boolean {
  let valid = true;
  formErrors.fullName = "";
  formErrors.email = "";
  formErrors.phone = "";
  formErrors.password = "";
  formErrors.confirmPassword = "";
  formErrors.role = "";

  if (!form.fullName.trim()) {
    formErrors.fullName = "O nome completo é obrigatório.";
    valid = false;
  } else if (form.fullName.trim().length < 2) {
    formErrors.fullName = "O nome deve conter ao menos 2 caracteres.";
    valid = false;
  }

  if (!props.isEditing) {
    if (!validateEmail(form.email)) {
      valid = false;
    }

    if (!form.password) {
      formErrors.password = "A senha de acesso é obrigatória.";
      valid = false;
    } else if (form.password !== form.confirmPassword) {
      formErrors.confirmPassword = "A confirmação da senha não coincide.";
      valid = false;
    } else if (!isPasswordSecure.value) {
      formErrors.password =
        "A senha deve cumprir todos os requisitos de segurança abaixo.";
      valid = false;
    }
  } else {
    // Na edição, a senha é opcional: valida apenas se digitada
    if (form.password) {
      if (form.password !== form.confirmPassword) {
        formErrors.confirmPassword = "A confirmação da senha não coincide.";
        valid = false;
      } else if (!isPasswordSecure.value) {
        formErrors.password =
          "A nova senha deve cumprir todos os requisitos de segurança abaixo.";
        valid = false;
      }
    }
  }

  const phoneDigits = form.phone.replace(/\D/g, "");
  if (phoneDigits.length > 0 && phoneDigits.length < 10) {
    formErrors.phone =
      "Informe o telefone completo com DDD (10 ou 11 dígitos).";
    valid = false;
  }

  return valid;
}

function mensagemDeFalha(): string {
  if (props.perfil) return "Ocorreu um erro ao atualizar o seu perfil.";
  return props.isEditing
    ? "Ocorreu um erro ao atualizar o usuário."
    : "Ocorreu um erro ao cadastrar o usuário.";
}

/** Grava conforme o modo e devolve o perfil, quando a API o retorna. */
async function gravar(): Promise<UserProfile | null> {
  const fullName = form.fullName.trim();
  const phone = form.phone.trim() || undefined;
  const city = form.city.trim() || undefined;
  const password = form.password || undefined;

  if (props.perfil) {
    const updated = await authApi.atualizarPerfil({
      fullName,
      phone,
      city,
      password,
    });
    resetPasswordFields();
    toast.success("Perfil atualizado com sucesso!");
    return updated;
  }

  if (props.isEditing) {
    const payload: UserUpdateInput = {
      fullName,
      role: Number(form.role),
      phone,
      city,
      password,
    };
    await usuariosApi.atualizar(props.userId, payload);
    toast.success("Usuário atualizado com sucesso!");
  } else {
    const payload: UserCreateInput = {
      fullName,
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: Number(form.role),
      phone,
      city,
    };
    await usuariosApi.criar(payload);
    toast.success("Novo usuário cadastrado com sucesso!");
  }
  return null;
}

async function handleSubmit() {
  if (saving.value || !validate()) return;
  if (props.isEditing && !props.perfil && !props.userId) return;

  saving.value = true;
  errorMessage.value = null;

  try {
    const profile = await gravar();
    emit("saved", profile);
    if (!props.perfil) router.push(LISTA_URL);
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    errorMessage.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      mensagemDeFalha();
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <!-- Alerta de Erro Geral -->
    <div
      v-if="errorMessage"
      class="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-2.5"
    >
      <Icon icon="mdi:alert-circle" class="w-4 h-4 shrink-0 text-rose-500" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Nome Completo -->
    <div>
      <label
        for="fullName"
        class="block text-xs font-semibold text-neutral-dark mb-1.5"
      >
        Nome Completo *
      </label>
      <input
        id="fullName"
        v-model="form.fullName"
        type="text"
        placeholder="Ex: Carlos Eduardo Silveira"
        class="w-full px-3.5 py-2.5 rounded-lg border text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:ring-1 transition-colors"
        :class="
          formErrors.fullName
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
            : 'border-stone-300 focus:border-secondary focus:ring-secondary/20'
        "
      />
      <p v-if="formErrors.fullName" class="mt-1 text-xs text-rose-600">
        {{ formErrors.fullName }}
      </p>
    </div>

    <!-- E-mail -->
    <div>
      <label
        for="email"
        class="block text-xs font-semibold text-neutral-dark mb-1.5"
      >
        E-mail *
      </label>
      <div class="relative">
        <input
          id="email"
          v-model="form.email"
          type="email"
          :disabled="isEditing"
          @input="handleEmailInput"
          @blur="!isEditing && validateEmail(form.email)"
          placeholder="Ex: usuario@emporiohenz.com.br"
          class="w-full px-3.5 py-2.5 rounded-lg border text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:ring-1 transition-colors disabled:bg-stone-100 disabled:text-stone-500 disabled:cursor-not-allowed"
          :class="[
            formErrors.email
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
              : 'border-stone-300 focus:border-secondary focus:ring-secondary/20',
            isEditing ? 'pr-9' : '',
          ]"
        />
        <div
          v-if="isEditing"
          class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-stone-400"
          title="Identificador fixo"
        >
          <Icon icon="mdi:lock-outline" class="w-4 h-4" />
        </div>
      </div>
      <p
        v-if="formErrors.email"
        class="mt-1 text-xs text-rose-600 flex items-center gap-1"
      >
        <Icon icon="mdi:alert-circle-outline" class="w-3.5 h-3.5" />
        <span>{{ formErrors.email }}</span>
      </p>
      <span
        v-if="isEditing"
        class="text-xs text-stone-500 mt-1 flex items-center gap-1"
      >
        <Icon
          icon="mdi:information-outline"
          class="w-3.5 h-3.5 text-stone-400"
        />
        O e-mail é a credencial única de acesso da conta e não pode ser
        modificado.
      </span>
    </div>

    <!-- Nível de Acesso (Perfil) -->
    <div v-if="!hideRole">
      <UiSelect
        id="role"
        v-model="form.role"
        label="Perfil de Acesso"
        required
        :options="[
          {
            value: UserRole.Cliente,
            label: 'Cliente (Acesso ao catálogo e favoritos)',
          },
          {
            value: UserRole.Vendedor,
            label: 'Vendedor (Acesso comercial e consulta de listas)',
          },
          {
            value: UserRole.Administrador,
            label: 'Administrador (Acesso total ao sistema)',
          },
        ]"
      />
    </div>

    <!-- Telefone e Cidade -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label
          for="phone"
          class="block text-xs font-semibold text-neutral-dark mb-1.5"
        >
          Telefone / WhatsApp
        </label>
        <div class="relative">
          <input
            id="phone"
            :value="form.phone"
            @input="handlePhoneInput"
            type="tel"
            maxlength="15"
            placeholder="(51) 99999-9999"
            class="w-full px-3.5 py-2.5 rounded-lg border text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:ring-1 transition-colors"
            :class="
              formErrors.phone
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                : 'border-stone-300 focus:border-secondary focus:ring-secondary/20'
            "
          />
          <div
            v-if="form.phone && !formErrors.phone"
            class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-500"
          >
            <Icon icon="mdi:phone-check-outline" class="w-4 h-4" />
          </div>
        </div>
        <p
          v-if="formErrors.phone"
          class="mt-1 text-xs text-rose-600 flex items-center gap-1"
        >
          <Icon icon="mdi:alert-circle-outline" class="w-3.5 h-3.5" />
          <span>{{ formErrors.phone }}</span>
        </p>
        <span v-else class="text-[11px] text-stone-400 mt-1 block">
          DDD + Celular (11 dígitos) ou Fixo (10 dígitos)
        </span>
      </div>

      <div>
        <label
          for="city"
          class="block text-xs font-semibold text-neutral-dark mb-1.5"
        >
          Cidade
        </label>
        <input
          id="city"
          v-model="form.city"
          type="text"
          placeholder="Ex: Cruzeiro do Sul, Lajeado..."
          class="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-colors"
        />
      </div>
    </div>

    <!-- Seção de Senha Segura -->
    <UsuarioSenhaCampos
      ref="senha"
      v-model:password="form.password"
      v-model:confirm-password="form.confirmPassword"
      v-model:valid="isPasswordSecure"
      :is-editing="isEditing"
      :errors="formErrors"
      @input="handlePasswordInput"
    />

    <!-- Barra de Ações com UiButton -->
    <div
      class="pt-5 border-t border-stone-100 flex items-center justify-end gap-3"
    >
      <UiButton
        variant="outline"
        type="button"
        size="md"
        :disabled="saving"
        @click="emit('cancel')"
      >
        Cancelar
      </UiButton>

      <UiButton
        variant="primary"
        type="submit"
        size="md"
        :loading="saving"
        :disabled="saving"
      >
        {{ isEditing ? "Salvar Alterações" : "Cadastrar Usuário" }}
      </UiButton>
    </div>
  </form>
</template>
