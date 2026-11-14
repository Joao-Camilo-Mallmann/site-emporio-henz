<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { ref } from "vue";

// Campos de senha do formulário de usuário: senha, confirmação (visível no
// cadastro ou quando a senha é digitada na edição) e painel de requisitos.
// Os valores e a validade ficam no pai por `v-model`; só o mostrar/ocultar é
// estado local.

const password = defineModel<string>("password", { required: true });
const confirmPassword = defineModel<string>("confirmPassword", {
  required: true,
});
const valid = defineModel<boolean>("valid", { default: false });

defineProps<{
  isEditing: boolean;
  errors: { password: string; confirmPassword: string };
}>();

const emit = defineEmits<{
  /** Digitação em qualquer dos dois campos; o pai limpa os erros. */
  (e: "input"): void;
}>();

const showPassword = ref(false);
const showConfirmPassword = ref(false);

/** Volta a esconder as senhas; o pai chama ao limpar os campos. */
function reset() {
  showPassword.value = false;
  showConfirmPassword.value = false;
}

defineExpose({ reset });
</script>

<template>
  <div class="pt-2 border-t border-stone-100">
    <div class="flex items-center justify-between mb-1.5">
      <label
        for="password"
        class="block text-xs font-semibold text-neutral-dark"
      >
        {{ isEditing ? "Redefinir Senha (opcional)" : "Senha de Acesso *" }}
      </label>
      <span
        v-if="isEditing && !password"
        class="text-[11px] text-stone-400 font-normal"
      >
        Deixe em branco para manter a atual
      </span>
    </div>

    <!-- Input de Senha -->
    <div class="relative">
      <input
        id="password"
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        @input="emit('input')"
        :placeholder="
          isEditing
            ? 'Digite apenas se desejar redefinir a senha'
            : 'Digite uma senha segura'
        "
        class="w-full px-3.5 py-2.5 pr-11 rounded-lg border text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:ring-1 transition-colors"
        :class="
          errors.password
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

    <p
      v-if="errors.password"
      class="mt-1 text-xs text-rose-600 flex items-center gap-1"
    >
      <Icon icon="mdi:alert-circle-outline" class="w-3.5 h-3.5 shrink-0" />
      <span>{{ errors.password }}</span>
    </p>

    <!-- Confirmação de Senha (Visível na criação ou quando digitada na edição) -->
    <div v-if="!isEditing || password" class="mt-4">
      <label
        for="confirmPassword"
        class="block text-xs font-semibold text-neutral-dark mb-1.5"
      >
        {{ isEditing ? "Confirmar Nova Senha *" : "Confirmar Senha *" }}
      </label>
      <div class="relative">
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          @input="emit('input')"
          placeholder="Digite a mesma senha para confirmação"
          class="w-full px-3.5 py-2.5 pr-11 rounded-lg border text-sm text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:ring-1 transition-colors"
          :class="
            errors.confirmPassword
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
              showConfirmPassword ? 'mdi:eye-off-outline' : 'mdi:eye-outline'
            "
            class="w-4 h-4"
          />
        </button>
      </div>
      <p
        v-if="errors.confirmPassword"
        class="mt-1 text-xs text-rose-600 flex items-center gap-1"
      >
        <Icon icon="mdi:alert-circle-outline" class="w-3.5 h-3.5 shrink-0" />
        <span>{{ errors.confirmPassword }}</span>
      </p>
    </div>

    <!-- Painel de Requisitos e Força da Senha (Exibido na criação ou quando digitada na edição) -->
    <PasswordStrengthPanel
      v-if="!isEditing || password"
      v-model:valid="valid"
      :password="password"
      :confirm-password="confirmPassword"
      class="mt-3"
    />
  </div>
</template>
