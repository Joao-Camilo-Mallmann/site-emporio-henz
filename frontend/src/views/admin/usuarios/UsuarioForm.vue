<script setup lang="ts">
import { authApi, usuariosApi } from "@/api";
import { useToast } from "@/composables/useToast";
import {
  UserRole,
  type User,
  type UserCreateInput,
  type UserProfile,
  type UserUpdateInput,
} from "@/types";
import { formatPhone } from "@/utils/phone";
import { Icon } from "@iconify/vue";
import { reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import UsuarioSenhaCampos from "./UsuarioSenhaCampos.vue";

// Formulário de usuário, dono da gravação. Três modos: cadastro (`POST
// /users`), edição pelo admin (`PUT /users/:id`, com `userId`) e "Meu Perfil"
// (`perfil`: `PUT /auth/me`, sem sair da tela). Mostra o toast e, no admin,
// volta para a lista. As telas só carregam os dados e renderizam.

interface Props {
  /** Id do usuário na edição pelo admin. */
  userId?: string;
  initialData?: Partial<User>;
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

function handlePhoneInput() {
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
    <UiInput
      id="fullName"
      v-model="form.fullName"
      label="Nome Completo *"
      type="text"
      placeholder="Ex: Carlos Eduardo Silveira"
      :error="formErrors.fullName"
    />

    <!-- E-mail -->
    <UiInput
      id="email"
      v-model="form.email"
      label="E-mail *"
      type="email"
      :disabled="isEditing"
      placeholder="Ex: usuario@emporiohenz.com.br"
      :error="formErrors.email"
      @input="handleEmailInput"
      :suffix-icon="isEditing ? 'mdi:lock-outline' : undefined"
      @blur="!isEditing && validateEmail(form.email)"
    >
      <template v-if="isEditing" #hint>
        <Icon
          icon="mdi:information-outline"
          class="inline w-3.5 h-3.5 text-stone-400"
        />
        O e-mail é a credencial única de acesso da conta e não pode ser
        modificado.
      </template>
    </UiInput>

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
      <UiInput
        id="phone"
        v-model="form.phone"
        label="Telefone / WhatsApp"
        type="tel"
        mask="phone"
        maxlength="15"
        placeholder="(51) 99999-9999"
        :error="formErrors.phone"
        hint="DDD + Celular (11 dígitos) ou Fixo (10 dígitos)"
        :suffix-icon="
          form.phone && !formErrors.phone ? 'mdi:phone-check-outline' : undefined
        "
        @input="handlePhoneInput"
      />

      <UiInput
        id="city"
        v-model="form.city"
        label="Cidade"
        type="text"
        placeholder="Ex: Cruzeiro do Sul, Lajeado..."
      />
    </div>

    <!-- Seção de Senha Segura -->
    <UsuarioSenhaCampos
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
