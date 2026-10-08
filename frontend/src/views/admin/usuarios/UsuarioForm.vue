<script setup lang="ts">
import {
  UserRole,
  type IUser,
  type UserCreateInput,
  type UserUpdateInput,
} from "@/types";
import { Icon } from "@iconify/vue";
import { computed, reactive, ref, watch } from "vue";

interface Props {
  initialData?: Partial<IUser>;
  isEditing?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
  hideRole?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  initialData: () => ({
    fullName: "",
    email: "",
    role: UserRole.Cliente,
    phone: "",
    city: "",
  }),
  isEditing: false,
  loading: false,
  errorMessage: null,
  hideRole: false,
});

const emit = defineEmits<{
  (e: "submit", data: UserCreateInput | UserUpdateInput): void;
  (e: "cancel"): void;
}>();

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const showPassword = ref(false);
const showConfirmPassword = ref(false);

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

// Requisitos de Senha Segura
const passwordCriteria = computed(() => {
  const p = form.password || "";
  return [
    { id: "length", label: "Mínimo de 8 caracteres", met: p.length >= 8 },
    {
      id: "uppercase",
      label: "Pelo menos uma letra maiúscula (A-Z)",
      met: /[A-Z]/.test(p),
    },
    {
      id: "lowercase",
      label: "Pelo menos uma letra minúscula (a-z)",
      met: /[a-z]/.test(p),
    },
    {
      id: "number",
      label: "Pelo menos um número (0-9)",
      met: /[0-9]/.test(p),
    },
    {
      id: "special",
      label: "Pelo menos um caractere especial (!@#$%...)",
      met: /[^A-Za-z0-9]/.test(p),
    },
  ];
});

const passwordStrengthScore = computed(() => {
  if (!form.password) return 0;
  return passwordCriteria.value.filter((c) => c.met).length;
});

const isPasswordSecure = computed(() => {
  return passwordCriteria.value.every((c) => c.met);
});

const passwordStrengthFeedback = computed(() => {
  const score = passwordStrengthScore.value;
  if (score === 0) {
    return {
      label: "",
      colorClass: "text-stone-400",
      barColor: "bg-stone-200",
    };
  }
  if (score <= 2) {
    return {
      label: "Senha Fraca",
      colorClass: "text-rose-600",
      barColor: "bg-rose-500",
    };
  }
  if (score <= 4) {
    return {
      label: "Senha Razoável",
      colorClass: "text-amber-600",
      barColor: "bg-amber-500",
    };
  }
  return {
    label: "Senha Forte e Segura",
    colorClass: "text-emerald-600",
    barColor: "bg-emerald-500",
  };
});

watch(
  () => props.initialData,
  (newData) => {
    if (newData) {
      form.fullName = newData.fullName || "";
      form.email = newData.email || "";
      form.role = (newData.role as number) || (UserRole.Cliente as number);
      form.phone = newData.phone ? formatPhone(newData.phone) : "";
      form.city = newData.city || "";
      form.password = "";
      form.confirmPassword = "";
      showPassword.value = false;
      showConfirmPassword.value = false;
    }
  },
  { deep: true },
);

function handlePhoneInput(e: Event) {
  const target = e.target as HTMLInputElement;
  form.phone = formatPhone(target.value);
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
    formErrors.email = "Informe um endereço de e-mail válido (ex.: usuario@dominio.com).";
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
  if (formErrors.password && isPasswordSecure.value) {
    formErrors.password = "";
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
    } else if (!isPasswordSecure.value) {
      formErrors.password =
        "A senha deve cumprir todos os requisitos de segurança abaixo.";
      valid = false;
    } else if (form.password !== form.confirmPassword) {
      formErrors.confirmPassword = "A confirmação da senha não coincide.";
      valid = false;
    }
  } else {
    // Na edição, a senha é opcional: valida apenas se digitada
    if (form.password) {
      if (!isPasswordSecure.value) {
        formErrors.password =
          "A nova senha deve cumprir todos os requisitos de segurança abaixo.";
        valid = false;
      } else if (form.password !== form.confirmPassword) {
        formErrors.confirmPassword = "A confirmação da senha não coincide.";
        valid = false;
      }
    }
  }

  const phoneDigits = form.phone.replace(/\D/g, "");
  if (phoneDigits.length > 0 && phoneDigits.length < 10) {
    formErrors.phone = "Informe o telefone completo com DDD (10 ou 11 dígitos).";
    valid = false;
  }

  return valid;
}

function handleSubmit() {
  if (!validate()) return;

  if (props.isEditing) {
    const payload: UserUpdateInput = {
      fullName: form.fullName.trim(),
      role: Number(form.role),
      phone: form.phone.trim() || undefined,
      city: form.city.trim() || undefined,
      password: form.password ? form.password : undefined,
    };
    emit("submit", payload);
  } else {
    const payload: UserCreateInput = {
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: Number(form.role),
      phone: form.phone.trim() || undefined,
      city: form.city.trim() || undefined,
    };
    emit("submit", payload);
  }
}

function resetPasswordFields() {
  form.password = "";
  form.confirmPassword = "";
  showPassword.value = false;
  showConfirmPassword.value = false;
  formErrors.password = "";
  formErrors.confirmPassword = "";
}

defineExpose({
  resetPasswordFields,
});
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
      <p v-if="formErrors.email" class="mt-1 text-xs text-rose-600 flex items-center gap-1">
        <Icon icon="mdi:alert-circle-outline" class="w-3.5 h-3.5" />
        <span>{{ formErrors.email }}</span>
      </p>
      <span v-if="isEditing" class="text-xs text-stone-500 mt-1 flex items-center gap-1">
        <Icon icon="mdi:information-outline" class="w-3.5 h-3.5 text-stone-400" />
        O e-mail é a credencial única de acesso da conta e não pode ser modificado.
      </span>
    </div>

    <!-- Nível de Acesso (Perfil) -->
    <div v-if="!hideRole">
      <label
        for="role"
        class="block text-xs font-semibold text-neutral-dark mb-1.5"
      >
        Perfil de Acesso *
      </label>
      <select
        id="role"
        v-model="form.role"
        class="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-neutral-dark bg-white focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-colors cursor-pointer"
      >
        <option :value="UserRole.Cliente">
          Cliente (Acesso ao catálogo e favoritos)
        </option>
        <option :value="UserRole.Vendedor">
          Vendedor (Acesso comercial e consulta de listas)
        </option>
        <option :value="UserRole.Administrador">
          Administrador (Acesso total ao sistema)
        </option>
      </select>
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
        <p v-if="formErrors.phone" class="mt-1 text-xs text-rose-600 flex items-center gap-1">
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
    <div class="pt-2 border-t border-stone-100">
      <div class="flex items-center justify-between mb-1.5">
        <label
          for="password"
          class="block text-xs font-semibold text-neutral-dark"
        >
          {{ isEditing ? "Redefinir Senha (opcional)" : "Senha de Acesso *" }}
        </label>
        <span
          v-if="isEditing && !form.password"
          class="text-[11px] text-stone-400 font-normal"
        >
          Deixe em branco para manter a atual
        </span>
      </div>

      <!-- Input de Senha -->
      <div class="relative">
        <input
          id="password"
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          @input="handlePasswordInput"
          :placeholder="
            isEditing
              ? 'Digite apenas se desejar redefinir a senha'
              : 'Digite uma senha segura'
          "
          class="w-full px-3.5 py-2.5 pr-11 rounded-lg border text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:ring-1 transition-colors"
          :class="
            formErrors.password
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
              : 'border-stone-300 focus:border-secondary focus:ring-secondary/20'
          "
        />
        <button
          type="button"
          tabindex="-1"
          @click="showPassword = !showPassword"
          class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition-colors focus:outline-none cursor-pointer"
          :title="showPassword ? 'Ocultar senha' : 'Exibir senha'"
        >
          <Icon
            :icon="showPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'"
            class="w-4 h-4"
          />
        </button>
      </div>

      <p v-if="formErrors.password" class="mt-1 text-xs text-rose-600 flex items-center gap-1">
        <Icon icon="mdi:alert-circle-outline" class="w-3.5 h-3.5 shrink-0" />
        <span>{{ formErrors.password }}</span>
      </p>

      <!-- Painel de Requisitos e Força da Senha (Exibido na criação ou quando digitada na edição) -->
      <div
        v-if="!isEditing || form.password"
        class="mt-3 p-3.5 rounded-lg bg-stone-50 border border-stone-200/80 space-y-3"
      >
        <!-- Barra de Força da Senha -->
        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-medium text-stone-600 flex items-center gap-1.5">
              <Icon icon="mdi:shield-check-outline" class="w-3.5 h-3.5 text-stone-500" />
              Nível de Segurança:
            </span>
            <span
              class="font-semibold"
              :class="passwordStrengthFeedback.colorClass"
            >
              {{ passwordStrengthFeedback.label || "Não definida" }}
            </span>
          </div>

          <!-- Medidor visual de 5 blocos -->
          <div class="grid grid-cols-5 gap-1.5 h-1.5 w-full">
            <div
              v-for="index in 5"
              :key="index"
              class="rounded-full transition-all duration-300"
              :class="
                index <= passwordStrengthScore
                  ? passwordStrengthFeedback.barColor
                  : 'bg-stone-200'
              "
            ></div>
          </div>
        </div>

        <!-- Checklist de Critérios de Senha Segura -->
        <div>
          <span class="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block mb-2">
            Requisitos para uma Senha Segura:
          </span>
          <ul class="space-y-1.5">
            <li
              v-for="criteria in passwordCriteria"
              :key="criteria.id"
              class="flex items-center gap-2 text-xs transition-colors duration-200"
              :class="criteria.met ? 'text-emerald-700 font-medium' : 'text-stone-500'"
            >
              <Icon
                :icon="
                  criteria.met
                    ? 'mdi:check-circle'
                    : 'mdi:checkbox-blank-circle-outline'
                "
                class="w-3.5 h-3.5 shrink-0 transition-transform duration-200"
                :class="criteria.met ? 'text-emerald-600 scale-110' : 'text-stone-400'"
              />
              <span>{{ criteria.label }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Confirmação de Senha (Visível na criação ou quando digitada na edição) -->
      <div v-if="!isEditing || form.password" class="mt-4">
        <label
          for="confirmPassword"
          class="block text-xs font-semibold text-neutral-dark mb-1.5"
        >
          {{ isEditing ? "Confirmar Nova Senha *" : "Confirmar Senha *" }}
        </label>
        <div class="relative">
          <input
            id="confirmPassword"
            v-model="form.confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            @input="handlePasswordInput"
            placeholder="Digite a mesma senha para confirmação"
            class="w-full px-3.5 py-2.5 pr-11 rounded-lg border text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:ring-1 transition-colors"
            :class="
              formErrors.confirmPassword
                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
                : 'border-stone-300 focus:border-secondary focus:ring-secondary/20'
            "
          />
          <button
            type="button"
            tabindex="-1"
            @click="showConfirmPassword = !showConfirmPassword"
            class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 transition-colors focus:outline-none cursor-pointer"
            :title="showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'"
          >
            <Icon
              :icon="
                showConfirmPassword
                  ? 'mdi:eye-off-outline'
                  : 'mdi:eye-outline'
              "
              class="w-4 h-4"
            />
          </button>
        </div>
        <p
          v-if="formErrors.confirmPassword"
          class="mt-1 text-xs text-rose-600 flex items-center gap-1"
        >
          <Icon icon="mdi:alert-circle-outline" class="w-3.5 h-3.5 shrink-0" />
          <span>{{ formErrors.confirmPassword }}</span>
        </p>
      </div>
    </div>

    <!-- Barra de Ações com UiButton -->
    <div
      class="pt-5 border-t border-stone-100 flex items-center justify-end gap-3"
    >
      <UiButton
        variant="outline"
        type="button"
        size="md"
        @click="emit('cancel')"
      >
        Cancelar
      </UiButton>

      <UiButton
        variant="primary"
        type="submit"
        size="md"
        :loading="loading"
        :disabled="loading"
      >
        {{ isEditing ? "Salvar Alterações" : "Cadastrar Usuário" }}
      </UiButton>
    </div>
  </form>
</template>
