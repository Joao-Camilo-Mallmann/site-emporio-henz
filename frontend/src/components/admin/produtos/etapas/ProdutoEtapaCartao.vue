<script setup lang="ts">
// Cartão comum às etapas do formulário de produto: número, título e descrição.
// A etapa fica no DOM e é escondida com `v-show`, para o foco em campo com erro
// e o envio dos arquivos funcionarem com a etapa fechada.

withDefaults(
  defineProps<{
    /** Id da seção no DOM. */
    id: string;
    /** Número mostrado no selo (1 a 6). */
    numero: number;
    titulo: string;
    descricao: string;
    visible?: boolean;
  }>(),
  { visible: true },
);
</script>

<template>
  <section
    v-show="visible"
    :id="id"
    class="scroll-mt-32 rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs"
    :aria-labelledby="`${id}-title`"
  >
    <header class="mb-5">
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
