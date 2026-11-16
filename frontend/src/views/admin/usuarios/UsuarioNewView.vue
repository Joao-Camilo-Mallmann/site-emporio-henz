<script setup lang="ts">
import { useRouter } from "vue-router";
import UsuarioForm from "./UsuarioForm.vue";

// Tela `/admin/usuarios/novo`: só o cabeçalho e o formulário, que grava.

const router = useRouter();

function handleCancel() {
  router.push("/admin/usuarios");
}
</script>

<template>
  <div class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto space-y-6">
      <UiPageHeader
        :breadcrumbs="[{ name: 'Painel', link: '/admin' }, { name: 'Usuários', link: '/admin/usuarios' }, { name: 'Novo Usuário' }]"
        title="Novo Usuário"
        description="Cadastre novos clientes, vendedores ou administradores"
      />

      <!-- Container do Formulário -->
      <div class="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <UsuarioForm @cancel="handleCancel" />
      </div>
    </div>
  </div>
</template>
