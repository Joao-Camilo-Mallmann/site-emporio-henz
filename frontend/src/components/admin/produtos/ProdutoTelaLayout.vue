<script setup lang="ts">
import { useProdutoFormStore } from "@/stores/produtoForm";
import { Icon } from "@iconify/vue";
import { computed, nextTick, useTemplateRef, watch } from "vue";

// Moldura das telas de cadastro e edição de produto, lida da store
// `produtoForm`: cabeçalho (`UiPageHeader` com a trilha, o título e, na
// edição, status e "Desativar"), o carregando, o slot do formulário, o painel
// de progresso do envio dos arquivos e a confirmação das exclusões imediatas.

const store = useProdutoFormStore();

const comFalha = computed(() => !store.uploading && store.failedFiles > 0);

// Produto gravado: traz o painel de progresso à vista.
const painelEl = useTemplateRef<HTMLElement>("painel");
watch(
  () => store.saved,
  (saved) => {
    if (!saved || store.totalFiles === 0) return;
    nextTick(() =>
      painelEl.value?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  },
);
</script>

<template>
  <div
    class="min-h-[calc(100vh-14rem)] bg-stone-50/70 px-4 pt-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-5xl mx-auto space-y-3">
      <!-- Cabeçalho -->
      <UiPageHeader
        :breadcrumbs="[
          { name: 'Painel', link: '/admin' },
          { name: 'Produtos', link: '/admin/produtos' },
          { name: store.editando ? 'Editar' : 'Novo Produto' },
        ]"
        :title="
          store.editando
            ? store.product?.name || 'Editar Produto'
            : 'Novo Produto'
        "
      >
        <template v-if="store.editando && store.product" #actions>
          <span
            class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
            :class="
              store.product.active
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-stone-100 text-stone-500'
            "
          >
            <span
              class="w-1.5 h-1.5 rounded-full"
              :class="store.product.active ? 'bg-emerald-500' : 'bg-stone-400'"
            ></span>
            {{ store.product.active ? "Ativo" : "Inativo" }}
          </span>

          <UiButton
            v-if="store.product.active"
            variant="outline"
            size="sm"
            class="text-rose-600 border-rose-200 hover:bg-rose-50"
            :disabled="store.locked || store.busy"
            @click="store.pendingRemoval = { kind: 'product' }"
          >
            <Icon icon="mdi:trash-can-outline" class="w-4 h-4" />
            Desativar
          </UiButton>
        </template>
      </UiPageHeader>

      <!-- Carregando -->
      <div
        v-if="store.loading"
        class="bg-white rounded-xl border border-stone-200 py-12 flex flex-col items-center justify-center text-stone-500 gap-2.5"
      >
        <div
          class="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"
        ></div>
        <span class="text-xs">Carregando...</span>
      </div>

      <template v-else>
        <!-- Formulário -->
        <slot />

        <!-- Painel de envio dos arquivos (depois de gravar o produto) -->
        <div
          v-if="store.saved"
          ref="painel"
          class="rounded-xl border bg-white p-5 sm:p-6 shadow-xs space-y-4"
          :class="comFalha ? 'border-amber-300' : 'border-stone-200'"
          aria-live="polite"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              :class="
                comFalha
                  ? 'bg-amber-50 text-amber-600'
                  : 'bg-emerald-50 text-emerald-600'
              "
            >
              <Icon
                :icon="
                  comFalha
                    ? 'mdi:alert-circle-outline'
                    : 'mdi:check-circle-outline'
                "
                class="w-5 h-5"
              />
            </div>
            <div class="min-w-0 flex-1">
              <h2 class="text-sm font-semibold text-neutral-dark">
                {{
                  store.editando
                    ? `Alterações de "${store.product?.name}" salvas`
                    : `Produto "${store.product?.name}" cadastrado`
                }}
              </h2>
              <p v-if="store.uploading" class="text-xs text-stone-500 mt-0.5">
                Enviando arquivos: {{ store.doneFiles }} de
                {{ store.totalFiles }}. Não feche esta página até o envio
                terminar.
              </p>
              <p
                v-else-if="store.failedFiles > 0"
                class="text-xs text-stone-600 mt-0.5"
              >
                {{
                  store.failedFiles === 1
                    ? "1 arquivo não foi enviado."
                    : `${store.failedFiles} arquivos não foram enviados.`
                }}
                Use "Tentar de novo" no arquivo com erro ou conclua assim mesmo
                e
                {{
                  store.editando
                    ? "complete as fotos em outra edição."
                    : "complete as fotos depois, na edição do produto."
                }}
              </p>
              <p v-else class="text-xs text-stone-500 mt-0.5">
                Todos os arquivos foram enviados.
              </p>
            </div>
          </div>

          <div
            v-if="store.totalFiles > 0"
            class="h-2 w-full overflow-hidden rounded-full bg-stone-100"
            role="progressbar"
            :aria-valuenow="store.doneFiles"
            aria-valuemin="0"
            :aria-valuemax="store.totalFiles"
            :aria-label="`Arquivos enviados: ${store.doneFiles} de ${store.totalFiles}`"
          >
            <div
              class="h-full rounded-full bg-secondary transition-all duration-300"
              :style="{
                width: `${(store.doneFiles / store.totalFiles) * 100}%`,
              }"
            ></div>
          </div>

          <div v-if="comFalha" class="flex justify-end">
            <UiButton
              variant="primary"
              size="md"
              @click="store.concluirAssimMesmo()"
            >
              Concluir assim mesmo
            </UiButton>
          </div>
        </div>
      </template>
    </div>

    <!-- Confirmação das exclusões imediatas (foto, amostra ou produto) -->
    <UiModal
      :open="store.pendingRemoval !== null"
      :title="
        {
          image: 'Excluir foto',
          sample: 'Remover amostra',
          product: 'Desativar produto',
        }[store.pendingRemoval?.kind ?? 'product']
      "
      variant="danger"
      :loading="store.removing"
      @close="store.removing || (store.pendingRemoval = null)"
      @confirm="store.confirmarRemocao()"
    >
      <template v-if="store.pendingRemoval?.kind === 'image'">
        A foto sai do carrossel do produto assim que você confirmar, sem esperar
        o botão de salvar. Para repor, envie o arquivo de novo.
      </template>
      <template v-else-if="store.pendingRemoval?.kind === 'sample'">
        A amostra de textura desta variação será apagada agora, sem esperar o
        botão de salvar. Para repor, escolha um arquivo novo.
      </template>
      <template v-else>
        Deseja desativar
        <strong class="text-neutral-dark">{{ store.product?.name }}</strong
        >? O produto sai do catálogo e continua guardado no painel, com as
        variações e fotos.
      </template>
    </UiModal>
  </div>
</template>
