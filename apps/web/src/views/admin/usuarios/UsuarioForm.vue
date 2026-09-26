<script setup lang="ts">
import {
  UserRole,
  type IUser,
  type UserCreateInput,
  type UserUpdateInput,
} from "@/types";
import { Icon } from "@iconify/vue";
import { reactive, watch } from "vue";

interface Props {
  initialData?: Partial<IUser>;
  isEditing?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
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
});

const emit = defineEmits<{
  (e: "submit", data: UserCreateInput | UserUpdateInput): void;
  (e: "cancel"): void;
}>();

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const form = reactive({
  fullName: props.initialData?.fullName || "",
  email: props.initialData?.email || "",
  password: "",
  role: (props.initialData?.role as number) || (UserRole.Cliente as number),
  phone: props.initialData?.phone ? formatPhone(props.initialData.phone) : "",
  city: props.initialData?.city || "",
});

const formErrors = reactive({
  fullName: "",
  email: "",
  password: "",
  role: "",
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
    }
  },
  { deep: true },
);

function handlePhoneInput(e: Event) {
  const target = e.target as HTMLInputElement;
  form.phone = formatPhone(target.value);
}

function validate(): boolean {
  let valid = true;
  formErrors.fullName = "";
  formErrors.email = "";
  formErrors.password = "";
  formErrors.role = "";

  if (!form.fullName.trim()) {
    formErrors.fullName = "O nome completo é obrigatório.";
    valid = false;
  } else if (form.fullName.trim().length < 2) {
    formErrors.fullName = "O nome deve conter ao menos 2 caracteres.";
    valid = false;
  }

  if (!props.isEditing) {
    if (!form.email.trim()) {
      formErrors.email = "O e-mail é obrigatório.";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      formErrors.email = "Informe um endereço de e-mail válido.";
      valid = false;
    }

    if (!form.password) {
      formErrors.password = "A senha inicial é obrigatória.";
      valid = false;
    } else if (form.password.length < 6) {
      formErrors.password = "A senha deve ter no mínimo 6 caracteres.";
      valid = false;
    }
  } else {
    if (form.password && form.password.length < 6) {
      formErrors.password = "A nova senha deve ter no mínimo 6 caracteres.";
      valid = false;
    }
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
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-5">
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
      <input
        id="email"
        v-model="form.email"
        type="email"
        :disabled="isEditing"
        placeholder="Ex: usuario@emporiohenz.com.br"
        class="w-full px-3.5 py-2.5 rounded-lg border text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:ring-1 transition-colors disabled:bg-stone-100 disabled:text-stone-500"
        :class="
          formErrors.email
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
            : 'border-stone-300 focus:border-secondary focus:ring-secondary/20'
        "
      />
      <p v-if="formErrors.email" class="mt-1 text-xs text-rose-600">
        {{ formErrors.email }}
      </p>
      <span v-if="isEditing" class="text-xs text-stone-400 mt-1 block">
        O e-mail é a chave de acesso e não pode ser modificado.
      </span>
    </div>

    <!-- Nível de Acesso (Perfil) -->
    <div>
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
        <input
          id="phone"
          :value="form.phone"
          @input="handlePhoneInput"
          type="text"
          placeholder="(00) 00000-0000"
          class="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-colors"
        />
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

    <!-- Senha -->
    <div>
      <label
        for="password"
        class="block text-xs font-semibold text-neutral-dark mb-1.5"
      >
        {{ isEditing ? "Redefinir Senha (opcional)" : "Senha de Acesso *" }}
      </label>
      <input
        id="password"
        v-model="form.password"
        type="password"
        :placeholder="
          isEditing
            ? 'Deixe em branco para manter a senha atual'
            : 'Mínimo de 6 caracteres'
        "
        class="w-full px-3.5 py-2.5 rounded-lg border text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:ring-1 transition-colors"
        :class="
          formErrors.password
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-200'
            : 'border-stone-300 focus:border-secondary focus:ring-secondary/20'
        "
      />
      <p v-if="formErrors.password" class="mt-1 text-xs text-rose-600">
        {{ formErrors.password }}
      </p>
    </div>

    <!-- Barra de Ações -->
    <div
      class="pt-5 border-t border-stone-100 flex items-center justify-end gap-3"
    >
      <button
        type="button"
        @click="emit('cancel')"
        class="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium text-sm transition-colors cursor-pointer"
      >
        Cancelar
      </button>

      <button
        type="submit"
        :disabled="loading"
        class="px-5 py-2 rounded-lg bg-secondary hover:bg-secondary-hover text-white font-medium text-sm shadow-xs transition-colors flex items-center gap-2 disabled:opacity-60 cursor-pointer"
      >
        <span
          v-if="loading"
          class="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"
        ></span>
        <span>
          {{ isEditing ? "Salvar Alterações" : "Cadastrar Usuário" }}
        </span>
      </button>
    </div>
  </form>
</template>
