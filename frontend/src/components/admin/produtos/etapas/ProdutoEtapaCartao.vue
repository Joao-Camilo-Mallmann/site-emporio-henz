<script setup lang="ts">
// Cartão comum às etapas do formulário de produto: número, título e descrição.
// O `ProdutoForm` esconde a etapa fechada com `v-show`: ela fica no DOM para o
// foco em campo com erro e o envio dos arquivos funcionarem.

defineProps<{
  /** Id da seção no DOM. */
  id: string;
  /** Número mostrado no selo (1 a 6). */
  numero: number;
  titulo: string;
  descricao: string;
}>();
</script>

<template>
  <section
    :id="id"
    class="scroll-mt-40 rounded-xl border border-stone-200 bg-white p-4 shadow-xs sm:p-5"
    :aria-labelledby="`${id}-title`"
  >
    <header class="mb-3">
      <h2
        :id="`${id}-title`"
        class="flex items-center gap-2.5 text-base font-semibold text-neutral-dark"
      >
        <span
          class="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary"
          >{{ numero }}</span
        >
        {{ titulo }}
      </h2>
      <p class="mt-1 text-xs text-stone-500">{{ descricao }}</p>
    </header>

    <slot />
  </section>
</template>
