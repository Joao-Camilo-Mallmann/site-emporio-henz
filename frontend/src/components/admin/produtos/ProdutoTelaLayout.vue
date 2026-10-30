<script setup lang="ts">
import type { ProductDto } from "@/types";
import { Icon } from "@iconify/vue";
import { computed, useTemplateRef } from "vue";
import { useRouter } from "vue-router";

// Moldura das telas de cadastro e edição de produto. Reúne o cabeçalho
// (breadcrumb, título e, na edição, status e "Desativar"), os estados que
// antecedem o formulário (carregando, produto inexistente e erro de carga), o
// slot do formulário e o painel de progresso do envio dos arquivos, que fica
// logo abaixo dele. O estado vem da tela e do `useProdutoEnvioArquivos`.

const props = withDefaults(
  defineProps<{
    /** `novo` é o cadastro; `editar` mostra o nome, o status e "Desativar". */
    modo: "novo" | "editar";
    /** Produto carregado (edição); `null` enquanto carrega ou se não existir. */
    produto?: ProductDto | null;
    /** Rota da lista de produtos (destino do breadcrumb na edição). */
    listaUrl?: string;
    /** Trava "Desativar" durante gravação, envio ou exclusão. */
    bloqueado?: boolean;

    loading: boolean;
    /** Texto ao lado do spinner. */
    loadingLabel: string;
    notFound?: boolean;
    /** Mensagem do erro de carga; `null` quando não há erro. */
    error: string | null;
    /** Texto do botão que abandona a tela. */
    voltarLabel: string;

    /** Mostra o painel de envio (depois que o produto foi gravado). */
    envioVisivel?: boolean;
    /** Título do painel, ex.: `Produto "Mesa" cadastrado`. */
    envioTitulo?: string;
    /** Fecho da orientação de falha, depois de "conclua assim mesmo e". */
    envioOrientacaoFalha?: string;
    /** Há envio em andamento. */
    uploading?: boolean;
    totalFiles?: number;
    doneFiles?: number;
    failedFiles?: number;
    progressPercent?: number;
  }>(),
  {
    produto: null,
    listaUrl: "/admin/produtos",
    bloqueado: false,
    notFound: false,
    envioVisivel: false,
    envioTitulo: "",
    envioOrientacaoFalha: "",
    uploading: false,
    totalFiles: 0,
    doneFiles: 0,
    failedFiles: 0,
    progressPercent: 0,
  },
);

const emit = defineEmits<{
  /** "Tentar de novo" no erro de carga. */
  retry: [];
  /** Abandona a tela (botão dos estados de carga). */
  voltar: [];
  /** "Desativar" da edição: a confirmação fica na tela. */
  desativar: [];
  /** "Concluir assim mesmo": segue com arquivos pendentes. */
  concluir: [];
}>();

const router = useRouter();

const comFalha = computed(() => !props.uploading && props.failedFiles > 0);

// A tela põe `ref="painelEnvio"` na moldura, e o composable de envio chama
// `mostrarPainelEnvio` para trazer o painel de progresso à vista.
const painelEl = useTemplateRef<HTMLElement>("painel");

function mostrarPainelEnvio() {
  painelEl.value?.scrollIntoView({ behavior: "smooth", block: "center" });
}

defineExpose({ mostrarPainelEnvio });
</script>

<template>
  <div class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-5xl mx-auto space-y-6">
      <!-- Breadcrumbs e cabeçalho -->
      <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div class="min-w-0">
          <div class="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
            <UiButton
              variant="custom"
              size="none"
              class="font-normal hover:text-neutral-dark transition-colors"
              @click="router.push('/admin')"
            >
              Painel
            </UiButton>
            <span>/</span>
            <UiButton
              v-if="modo === 'editar'"
              variant="custom"
              size="none"
              class="font-normal hover:text-neutral-dark transition-colors"
              @click="router.push(listaUrl)"
            >
              Produtos
            </UiButton>
            <span v-else>Produtos</span>
            <span>/</span>
            <span class="text-neutral-dark font-medium">
              {{ modo === "editar" ? "Editar" : "Novo Produto" }}
            </span>
          </div>

          <h1
            class="text-2xl font-bold text-neutral-dark tracking-tight truncate"
          >
            {{
              modo === "editar"
                ? produto?.name || "Editar Produto"
                : "Novo Produto"
            }}
          </h1>
          <p class="text-sm text-stone-500 mt-0.5">
            {{
              modo === "editar"
                ? "Altere os dados do móvel, as variações, as fotos e a ficha técnica"
                : "Cadastre o móvel com variações de acabamento, fotos e ficha técnica"
            }}
          </p>
        </div>

        <div
          v-if="modo === 'editar' && produto"
          class="flex items-center gap-2 shrink-0"
        >
          <span
            class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
            :class="
              produto.active
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-stone-100 text-stone-500'
            "
          >
            <span
              class="w-1.5 h-1.5 rounded-full"
              :class="produto.active ? 'bg-emerald-500' : 'bg-stone-400'"
            ></span>
            {{ produto.active ? "Ativo" : "Inativo" }}
          </span>

          <UiButton
            v-if="produto.active"
            variant="outline"
            size="sm"
            class="text-rose-600 border-rose-200 hover:bg-rose-50"
            :disabled="bloqueado"
            @click="emit('desativar')"
          >
            <Icon icon="mdi:trash-can-outline" class="w-4 h-4" />
            Desativar
          </UiButton>
        </div>
      </div>

      <!-- Carregando -->
      <div
        v-if="loading"
        class="bg-white rounded-xl border border-stone-200 py-12 flex flex-col items-center justify-center text-stone-500 gap-2.5"
      >
        <div
          class="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"
        ></div>
        <span class="text-xs">{{ loadingLabel }}</span>
      </div>

      <!-- Produto inexistente -->
      <div
        v-else-if="notFound"
        class="py-14 bg-white rounded-xl border border-stone-200 text-center px-4"
      >
        <div
          class="w-12 h-12 rounded-lg bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3"
        >
          <Icon icon="mdi:package-variant-closed-remove" class="w-6 h-6" />
        </div>
        <h2 class="text-sm font-semibold text-neutral-dark">
          Produto não encontrado
        </h2>
        <p class="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          O produto pode ter sido desativado ou pertencer a outro fornecedor.
        </p>
        <UiButton
          variant="secondary"
          size="sm"
          class="mt-3.5"
          @click="emit('voltar')"
        >
          {{ voltarLabel }}
        </UiButton>
      </div>

      <!-- Erro de carga -->
      <div
        v-else-if="error"
        role="alert"
        class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div class="flex items-center gap-2.5">
          <Icon
            icon="mdi:alert-circle-outline"
            class="w-5 h-5 text-rose-500 shrink-0"
          />
          <span>{{ error }}</span>
        </div>
        <div class="flex items-center gap-2">
          <UiButton variant="danger" size="sm" @click="emit('retry')">
            Tentar de novo
          </UiButton>
          <UiButton variant="outline" size="sm" @click="emit('voltar')">
            {{ voltarLabel }}
          </UiButton>
        </div>
      </div>

      <template v-else>
        <!-- Formulário -->
        <slot />

        <!-- Painel de envio dos arquivos (depois de gravar o produto) -->
        <div
          v-if="envioVisivel"
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
                {{ envioTitulo }}
              </h2>
              <p v-if="uploading" class="text-xs text-stone-500 mt-0.5">
                Enviando arquivos: {{ doneFiles }} de {{ totalFiles }}. Não
                feche esta página até o envio terminar.
              </p>
              <p
                v-else-if="failedFiles > 0"
                class="text-xs text-stone-600 mt-0.5"
              >
                {{
                  failedFiles === 1
                    ? "1 arquivo não foi enviado."
                    : `${failedFiles} arquivos não foram enviados.`
                }}
                Use "Tentar de novo" no arquivo com erro ou conclua assim mesmo
                e
                {{ envioOrientacaoFalha }}
              </p>
              <p v-else class="text-xs text-stone-500 mt-0.5">
                Todos os arquivos foram enviados.
              </p>
            </div>
          </div>

          <div
            v-if="totalFiles > 0"
            class="h-2 w-full overflow-hidden rounded-full bg-stone-100"
            role="progressbar"
            :aria-valuenow="doneFiles"
            aria-valuemin="0"
            :aria-valuemax="totalFiles"
            :aria-label="`Arquivos enviados: ${doneFiles} de ${totalFiles}`"
          >
            <div
              class="h-full rounded-full bg-secondary transition-all duration-300"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>

          <div v-if="comFalha" class="flex justify-end">
            <UiButton variant="primary" size="md" @click="emit('concluir')">
              Concluir assim mesmo
            </UiButton>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
