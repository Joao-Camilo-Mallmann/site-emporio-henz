<script setup lang="ts">
// Campos de senha do formulário de usuário: senha, confirmação (visível no
// cadastro ou quando a senha é digitada na edição) e painel de requisitos.
// Os valores e a validade ficam no pai por `v-model`. O mostrar/ocultar vem
// pronto do `UiInput` (type="password").

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
</script>

<template>
  <div class="pt-2 border-t border-stone-100">
    <!-- Input de Senha -->
    <UiInput
      id="password"
      v-model="password"
      type="password"
      :label="isEditing ? 'Redefinir Senha (opcional)' : 'Senha de Acesso *'"
      :hint="
        isEditing && !password
          ? 'Deixe em branco para manter a atual'
          : undefined
      "
      :error="errors.password"
      :placeholder="
        isEditing
          ? 'Digite apenas se desejar redefinir a senha'
          : 'Digite uma senha segura'
      "
      @input="emit('input')"
    />

    <!-- Confirmação de Senha (Visível na criação ou quando digitada na edição) -->
    <div v-if="!isEditing || password" class="mt-4">
      <UiInput
        id="confirmPassword"
        v-model="confirmPassword"
        type="password"
        :label="isEditing ? 'Confirmar Nova Senha *' : 'Confirmar Senha *'"
        placeholder="Digite a mesma senha para confirmação"
        :error="errors.confirmPassword"
        @input="emit('input')"
      />
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
