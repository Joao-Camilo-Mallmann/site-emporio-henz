<script setup lang="ts">
import { categoriasApi } from "@/api";
import { useToast } from "@/composables/useToast";
import type {
  ISubtype,
  SubtypeCreateInput,
  SubtypeDraftItem,
  SubtypeUpdateInput,
} from "@/types";
import { slugify } from "@/utils/slug";
import { Icon } from "@iconify/vue";
import { computed, onMounted, ref, watch } from "vue";
import SubcategoriaChip from "./SubcategoriaChip.vue";

interface Props {
  categoryId?: string;
  mode?: "draft" | "live";
  modelValue?: SubtypeDraftItem[];
}

const props = withDefaults(defineProps<Props>(), {
  categoryId: "",
  mode: "draft",
  modelValue: () => [],
});

const emit = defineEmits<{
  (e: "update:modelValue", value: SubtypeDraftItem[]): void;
  (e: "change"): void;
}>();

const toast = useToast();

const inputValue = ref("");
const loading = ref(false);
const actionItemLoadingId = ref<string | null>(null);

// Lista interna para modo live
const liveSubtypes = ref<ISubtype[]>([]);

// Lista unificada para exibição
const displaySubtypes = computed<Array<SubtypeDraftItem | ISubtype>>(() => {
  if (props.mode === "live") {
    return liveSubtypes.value;
  }
  return props.modelValue;
});

async function carregarSubtiposLive() {
  if (props.mode !== "live" || !props.categoryId) return;

  loading.value = true;
  try {
    const response = await categoriasApi.listarSubtipos({
      categoryId: props.categoryId,
      limit: 100,
    });
    liveSubtypes.value = response.data;
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    toast.error(
      errorObj.response?.data?.message ||
        errorObj.message ||
        "Não foi possível carregar os subtipos da categoria.",
    );
  } finally {
    loading.value = false;
  }
}

/**
 * Processa a inclusão de termos (suporta separação por vírgula, ponto-e-vírgula ou quebra de linha)
 */
async function processarInclusaoTermos(rawText: string) {
  const text = rawText.trim();
  if (!text) return;

  const termos = text
    .split(/[,;\n]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);

  if (termos.length === 0) {
    toast.warning("Cada subtipo deve ter no mínimo 2 caracteres.");
    return;
  }

  inputValue.value = "";

  if (props.mode === "draft") {
    // Modo Rascunho (Nova Categoria)
    const novasTags: SubtypeDraftItem[] = [...props.modelValue];

    for (const termo of termos) {
      const slug = slugify(termo);
      const existe = novasTags.some(
        (t) => t.name.toLowerCase() === termo.toLowerCase() || t.slug === slug,
      );

      if (!existe) {
        novasTags.push({
          name: termo,
          slug: slug || `subtipo-${Date.now()}`,
          active: true,
        });
      }
    }

    emit("update:modelValue", novasTags);
    emit("change");
  } else {
    // Modo Live (Edição de Categoria Existente)
    if (!props.categoryId) return;

    for (const termo of termos) {
      const slug = slugify(termo);
      const payload: SubtypeCreateInput = {
        categoryId: props.categoryId,
        name: termo,
        slug: slug || undefined,
        active: true,
      };

      try {
        await categoriasApi.criarSubtipo(payload);
      } catch (err: unknown) {
        const errorObj = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        toast.error(
          errorObj.response?.data?.message ||
            errorObj.message ||
            `Erro ao cadastrar "${termo}".`,
        );
      }
    }

    toast.success(
      termos.length === 1
        ? `Subtipo "${termos[0]}" cadastrado com sucesso.`
        : `${termos.length} subtipos cadastrados com sucesso.`,
    );

    await carregarSubtiposLive();
    emit("change");
  }
}

function handleInputKeydown(event: KeyboardEvent) {
  if (event.key === "Enter") {
    event.preventDefault();
    processarInclusaoTermos(inputValue.value);
  } else if (event.key === ",") {
    event.preventDefault();
    processarInclusaoTermos(inputValue.value);
  }
}

function handleInputPaste(event: ClipboardEvent) {
  const pasteData = event.clipboardData?.getData("text") || "";
  if (pasteData.includes(",") || pasteData.includes("\n") || pasteData.includes(";")) {
    event.preventDefault();
    processarInclusaoTermos(pasteData);
  }
}

async function handleUpdateSubtype(
  indexOrId: number | string,
  data: { name: string; slug: string; active: boolean },
) {
  if (props.mode === "draft") {
    const index = typeof indexOrId === "number" ? indexOrId : 0;
    const atualizados = [...props.modelValue];
    if (atualizados[index]) {
      atualizados[index] = {
        ...atualizados[index],
        name: data.name,
        slug: data.slug,
        active: data.active,
      };
      emit("update:modelValue", atualizados);
      emit("change");
    }
  } else {
    const id = String(indexOrId);
    actionItemLoadingId.value = id;
    try {
      const payload: SubtypeUpdateInput = {
        name: data.name,
        slug: data.slug,
        active: data.active,
      };
      await categoriasApi.atualizarSubtipo(id, payload);
      toast.success("Subtipo atualizado com sucesso.");
      await carregarSubtiposLive();
      emit("change");
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        errorObj.response?.data?.message ||
          errorObj.message ||
          "Erro ao atualizar subtipo.",
      );
    } finally {
      actionItemLoadingId.value = null;
    }
  }
}

async function handleRemoveSubtype(indexOrId: number | string) {
  if (props.mode === "draft") {
    const index = typeof indexOrId === "number" ? indexOrId : 0;
    const atualizados = props.modelValue.filter((_, i) => i !== index);
    emit("update:modelValue", atualizados);
    emit("change");
  } else {
    const id = String(indexOrId);
    actionItemLoadingId.value = id;
    try {
      await categoriasApi.deletarSubtipo(id);
      toast.info("Subtipo desativado com sucesso.");
      await carregarSubtiposLive();
      emit("change");
    } catch (err: unknown) {
      const errorObj = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(
        errorObj.response?.data?.message ||
          errorObj.message ||
          "Erro ao desativar subtipo.",
      );
    } finally {
      actionItemLoadingId.value = null;
    }
  }
}

watch(
  () => props.categoryId,
  (newId) => {
    if (props.mode === "live" && newId) {
      carregarSubtiposLive();
    }
  },
);

onMounted(() => {
  if (props.mode === "live") {
    carregarSubtiposLive();
  }
});
</script>

<template>
  <div class="space-y-3">
    <!-- Cabeçalho do Bloco -->
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2">
          <label class="block text-xs font-semibold text-neutral-dark">
            Subtipos Vinculados (Subcategorias)
          </label>
          <span
            class="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-600"
          >
            {{ displaySubtypes.length }}
          </span>
        </div>
        <p class="text-xs text-stone-500 mt-0.5">
          Tipologias de móveis associadas a este ambiente (ex: Sofás, Poltronas, Camas, Mesas).
        </p>
      </div>
    </div>

    <!-- Container do Gerenciador de Tags -->
    <div
      class="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-3.5 focus-within:border-secondary/40 focus-within:bg-white transition-colors"
    >
      <!-- Campo de Entrada Ágil com Botão de Ação -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1">
          <input
            v-model="inputValue"
            type="text"
            placeholder="Digite o nome do subtipo e aperte Enter ou vírgula..."
            class="w-full px-3.5 py-2 pr-10 rounded-lg border border-stone-300 bg-white text-xs text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all"
            @keydown="handleInputKeydown"
            @paste="handleInputPaste"
          />
          <div
            v-if="inputValue.trim()"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 font-mono hidden sm:block"
          >
            [Enter]
          </div>
        </div>

        <UiButton
          type="button"
          variant="secondary"
          size="sm"
          :disabled="!inputValue.trim()"
          @click="processarInclusaoTermos(inputValue)"
        >
          <Icon icon="mdi:plus" class="w-3.5 h-3.5" />
          <span>Adicionar</span>
        </UiButton>
      </div>

      <!-- Dica de Ergonomia de Digitação -->
      <div class="flex items-center gap-1.5 text-[11px] text-stone-400">
        <Icon icon="mdi:keyboard-outline" class="w-3.5 h-3.5 shrink-0" />
        <span>
          Pressione <strong>Enter</strong> ou <strong>vírgula</strong> para criar a tag. Você também pode colar múltiplos termos (ex: <em>Sofás, Poltronas, Puffs</em>).
        </span>
      </div>

      <!-- Divisor Sutil -->
      <div class="border-t border-stone-200/80"></div>

      <!-- Área de Nuvem de Chips -->
      <div>
        <!-- Carregamento no modo live -->
        <div
          v-if="loading"
          class="py-5 flex items-center justify-center text-stone-400 text-xs gap-2"
        >
          <div
            class="w-4 h-4 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin"
          ></div>
          <span>Carregando subtipos...</span>
        </div>

        <!-- Estado Vazio -->
        <div
          v-else-if="displaySubtypes.length === 0"
          class="py-5 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-lg bg-white/70"
        >
          <div class="flex flex-col items-center justify-center gap-1">
            <Icon icon="mdi:tag-outline" class="w-5 h-5 text-stone-300" />
            <span>Nenhum subtipo adicionado ainda.</span>
            <span class="text-[11px] text-stone-400">
              {{ mode === 'draft' ? 'Adicione os subtipos acima para salvar junto com a categoria.' : 'Use o campo acima para adicionar subtipos a esta categoria.' }}
            </span>
          </div>
        </div>

        <!-- Lista de Chips -->
        <div v-else class="flex flex-wrap gap-2 pt-1 items-center">
          <SubcategoriaChip
            v-for="(sub, index) in displaySubtypes"
            :key="'id' in sub && sub.id ? sub.id : index"
            :subtype="sub"
            :is-draft="mode === 'draft'"
            :loading="actionItemLoadingId === ('id' in sub ? sub.id : String(index))"
            @update="handleUpdateSubtype('id' in sub && sub.id ? sub.id : index, $event)"
            @remove="handleRemoveSubtype('id' in sub && sub.id ? sub.id : index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
