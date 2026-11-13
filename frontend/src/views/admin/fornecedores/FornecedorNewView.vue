<script setup lang="ts">
import { useRouter } from "vue-router";
import FornecedorForm from "./FornecedorForm.vue";

// Tela `/admin/fornecedores/novo`: só o cabeçalho e o formulário, que grava.

const router = useRouter();

function handleCancel() {
  router.push("/admin/fornecedores");
}
</script>

<template>
  <div class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto space-y-6">
      <UiPageHeader
        :breadcrumbs="[{ name: 'Painel', link: '/admin' }, { name: 'Fornecedores', link: '/admin/fornecedores' }, { name: 'Novo Fornecedor' }]"
        title="Novo Fornecedor"
        description="Cadastre uma nova fábrica ou marca parceira no acervo da loja"
      />

      <!-- Container do Formulário -->
      <div class="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <FornecedorForm @cancel="handleCancel" />
      </div>
    </div>
  </div>
</template>
