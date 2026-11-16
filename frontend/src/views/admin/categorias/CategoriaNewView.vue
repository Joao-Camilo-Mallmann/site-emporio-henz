<script setup lang="ts">
import { useRouter } from "vue-router";
import CategoriaForm from "./CategoriaForm.vue";

// Tela `/admin/categorias/novo`: só o cabeçalho e o formulário, que grava.

const router = useRouter();

function handleCancel() {
  router.push("/admin/categorias");
}
</script>

<template>
  <div class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto space-y-6">
      <UiPageHeader
        :breadcrumbs="[{ name: 'Painel', link: '/admin' }, { name: 'Categorias', link: '/admin/categorias' }, { name: 'Nova Categoria' }]"
        title="Nova Categoria"
        description="Cadastre uma nova categoria de ambiente no acervo da loja e vincule suas subcategorias"
      />

      <!-- Container do Formulário -->
      <div class="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <CategoriaForm @cancel="handleCancel" />
      </div>
    </div>
  </div>
</template>
