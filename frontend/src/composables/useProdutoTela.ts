import { categoriasApi, fornecedoresApi, produtosApi, subtiposApi } from "@/api";
import { useToast } from "@/composables/useToast";
import { useAuthStore } from "@/stores/auth";
import type {
  FieldErrors,
  ICategory,
  ISubtype,
  ISupplier,
  PhotoFormItem,
  ProductFormState,
  VariationFormItem,
} from "@/types";
import {
  apiErrorMessage,
  FIELD_IDS,
} from "@/utils/produtos/produtoFormConstantes";
import { listUploadStates } from "@/utils/produtos/produtoFormEstado";
import { computed, nextTick, ref, type Ref } from "vue";
import { useRouter } from "vue-router";

// Lógica comum às telas de cadastro e edição de produto: opções dos
// seletores, leitura do erro de gravação e envio dos arquivos.

// ---------------------------------------------------------------------------
// Opções dos seletores (categoria, subtipo e fornecedor)
// ---------------------------------------------------------------------------

/** Ids gravados no produto que precisam continuar selecionáveis na edição. */
export interface ProdutoSelecaoAtual {
  categoryId: string;
  subtypeId: string;
  supplierId: string;
}

/**
 * Categorias e fornecedores ativos para os seletores, com a regra do
 * fornecedor por perfil. Na edição, `garantirSelecionados` devolve à lista a
 * categoria, o subtipo e o fornecedor do produto mesmo que estejam inativos:
 * sem eles o seletor ficaria vazio e a validação recusaria o próprio produto.
 */
export function useProdutoOpcoes() {
  const authStore = useAuthStore();

  const categories = ref<ICategory[]>([]);
  const suppliers = ref<ISupplier[]>([]);
  // Resposta sem filtro: com token de Admin ela inclui inativos.
  let categoriasDaApi: ICategory[] = [];

  const isVendedor = computed(() => authStore.isVendedor);
  const supplierLocked = computed(
    () => isVendedor.value && suppliers.value.length === 1,
  );
  const noSupplier = computed(
    () => isVendedor.value && suppliers.value.length === 0,
  );

  /** Carrega as listas. Erros sobem para a tela, que mostra a falha. */
  async function carregarListas() {
    const [categoriesResponse, suppliersResponse] = await Promise.all([
      categoriasApi.listar({ limit: 100, active: true }),
      fornecedoresApi.listar({ limit: 100, active: true }),
    ]);
    categoriasDaApi = categoriesResponse.data;
    categories.value = categoriasDaApi
      .filter((category) => category.active)
      .map((category) => ({
        ...category,
        subtypes: (category.subtypes ?? []).filter((subtype) => subtype.active),
      }));
    suppliers.value = suppliersResponse.data.filter((supplier) => supplier.active);
  }

  async function categoriaAtual(id: string): Promise<ICategory> {
    const daApi = categoriasDaApi.find((category) => category.id === id);
    if (daApi) return { ...daApi, name: `${daApi.name} (inativa)`, subtypes: [] };
    try {
      const category = await categoriasApi.buscarPorId(id);
      return { ...category, name: `${category.name} (inativa)`, subtypes: [] };
    } catch {
      return { id, name: "Categoria indisponível", slug: "", active: false, subtypes: [] };
    }
  }

  async function subtipoAtual(id: string, categoryId: string): Promise<ISubtype> {
    const daApi = categoriasDaApi
      .flatMap((category) => category.subtypes ?? [])
      .find((subtype) => subtype.id === id);
    if (daApi) return { ...daApi, name: `${daApi.name} (inativo)` };
    try {
      const subtype = await subtiposApi.buscarPorId(id);
      return { ...subtype, name: `${subtype.name} (inativo)` };
    } catch {
      return { id, categoryId, name: "Subtipo indisponível", slug: "", active: false };
    }
  }

  /**
   * Edição: mantém selecionáveis os itens gravados no produto. Devolve
   * `false` se o fornecedor atual não pôde ser carregado (a tela limpa o
   * campo e pede uma nova escolha).
   */
  async function garantirSelecionados(atual: ProdutoSelecaoAtual): Promise<boolean> {
    if (atual.categoryId && !categories.value.some((c) => c.id === atual.categoryId)) {
      categories.value = [await categoriaAtual(atual.categoryId), ...categories.value];
    }

    const category = categories.value.find((c) => c.id === atual.categoryId);
    const subtypes = category?.subtypes ?? [];
    if (category && atual.subtypeId && !subtypes.some((s) => s.id === atual.subtypeId)) {
      category.subtypes = [
        await subtipoAtual(atual.subtypeId, atual.categoryId),
        ...subtypes,
      ];
    }

    if (atual.supplierId && !suppliers.value.some((s) => s.id === atual.supplierId)) {
      try {
        suppliers.value = [
          await fornecedoresApi.buscarPorId(atual.supplierId),
          ...suppliers.value,
        ];
      } catch {
        return false;
      }
    }
    return true;
  }

  return {
    categories,
    suppliers,
    supplierLocked,
    noSupplier,
    carregarListas,
    garantirSelecionados,
  };
}

// ---------------------------------------------------------------------------
// Erro de gravação (POST e PUT)
// ---------------------------------------------------------------------------

/**
 * Lê a falha do `POST` ou do `PUT`: `409` vira erro no campo slug; o resto
 * vira o alerta geral do formulário.
 */
export function erroDeGravacao(
  err: unknown,
  fallback: string,
): { serverErrors: FieldErrors; errorMessage: string | null } {
  const status = (err as { response?: { status?: number } }).response?.status;
  if (status === 409) {
    return {
      serverErrors: {
        [FIELD_IDS.slug]: apiErrorMessage(
          err,
          "Já existe um produto com este slug. Escolha outro.",
        ),
      },
      errorMessage: null,
    };
  }
  return { serverErrors: {}, errorMessage: apiErrorMessage(err, fallback) };
}

// ---------------------------------------------------------------------------
// Envio dos arquivos depois de gravar
// ---------------------------------------------------------------------------

export interface ProdutoEnvioArquivosOpcoes {
  /** Estado do formulário, com os arquivos e o `uploadState` de cada um. */
  form: Ref<ProductFormState>;
  /** Devolve o produto já gravado, ou `null` enquanto ele não existe. */
  produto: () => { id: string } | null;
  /** Como o produto é citado nas mensagens de erro: "cadastrado" ou "salvo". */
  produtoRotulo: string;
  /** Toast exibido quando todos os arquivos sobem. */
  mensagemSucesso: string;
  /** Começo do aviso de "Concluir assim mesmo", ex.: "Produto cadastrado". */
  prefixoAviso: string;
  /** Rota para onde a tela segue ao concluir. */
  destino: string;
  /** Chamado quando a amostra de uma variação sobe (`sampleImageUrl` novo). */
  aoEnviarAmostra?: (variation: VariationFormItem, url: string | null) => void;
  /** Leva o painel de progresso à vista quando há arquivos para enviar. */
  mostrarPainel?: () => void;
}

/**
 * Envio dos arquivos de um produto já gravado (cadastro e edição): amostras e
 * depois fotos, uma requisição por vez (sem `Promise.all`), com contadores de
 * progresso, reenvio individual e conclusão da tela.
 */
export function useProdutoEnvioArquivos(opcoes: ProdutoEnvioArquivosOpcoes) {
  const { form } = opcoes;
  const router = useRouter();
  const toast = useToast();

  const uploading = ref(false);

  const uploadStates = computed(() => listUploadStates(form.value));
  const totalFiles = computed(() => uploadStates.value.length);
  const doneFiles = computed(
    () => uploadStates.value.filter((state) => state === "done").length,
  );
  const failedFiles = computed(
    () => uploadStates.value.filter((state) => state === "error").length,
  );
  const progressPercent = computed(() =>
    totalFiles.value === 0
      ? 100
      : Math.round((doneFiles.value / totalFiles.value) * 100),
  );

  async function enviarAmostra(variation: VariationFormItem) {
    const sample = variation.sample;
    const current = opcoes.produto();
    if (!sample || !current) return;

    if (!variation.id) {
      sample.uploadState = "error";
      sample.uploadError = `A variação não foi encontrada no produto ${opcoes.produtoRotulo}.`;
      return;
    }

    sample.uploadState = "uploading";
    sample.uploadError = undefined;
    try {
      const updated = await produtosApi.enviarAmostra(
        current.id,
        variation.id,
        sample.file,
      );
      sample.uploadedUrl = updated.sampleImageUrl;
      opcoes.aoEnviarAmostra?.(variation, updated.sampleImageUrl);
      sample.uploadState = "done";
    } catch (err: unknown) {
      sample.uploadState = "error";
      sample.uploadError = apiErrorMessage(
        err,
        "Não foi possível enviar a amostra.",
      );
    }
  }

  async function enviarFoto(photo: PhotoFormItem) {
    const current = opcoes.produto();
    if (!current) return;

    let variationId: string | null = null;
    if (photo.variationKey) {
      const variation = form.value.variations.find(
        (item) => item.key === photo.variationKey,
      );
      if (!variation?.id) {
        photo.uploadState = "error";
        photo.uploadError = `A variação desta foto não foi encontrada no produto ${opcoes.produtoRotulo}.`;
        return;
      }
      variationId = variation.id;
    }

    photo.uploadState = "uploading";
    photo.uploadError = undefined;
    try {
      photo.uploaded = await produtosApi.enviarFoto(
        current.id,
        photo.file,
        variationId,
      );
      photo.uploadState = "done";
    } catch (err: unknown) {
      photo.uploadState = "error";
      photo.uploadError = apiErrorMessage(
        err,
        "Não foi possível enviar a foto.",
      );
    }
  }

  function concluirSeCompleto() {
    if (failedFiles.value > 0 || doneFiles.value < totalFiles.value) return;
    toast.success(opcoes.mensagemSucesso);
    router.push(opcoes.destino);
  }

  /** Amostras e depois fotos, uma requisição por vez (sem `Promise.all`). */
  async function enviarArquivos() {
    uploading.value = true;
    try {
      for (const variation of form.value.variations) {
        if (variation.sample && variation.sample.uploadState !== "done") {
          await enviarAmostra(variation);
        }
      }
      for (const photo of form.value.photos) {
        if (photo.uploadState !== "done") {
          await enviarFoto(photo);
        }
      }
    } finally {
      uploading.value = false;
    }
    concluirSeCompleto();
  }

  /** Leva o painel de progresso à vista (se há arquivos) e inicia o envio. */
  async function iniciarEnvio() {
    if (totalFiles.value > 0) {
      nextTick(() => opcoes.mostrarPainel?.());
    }
    await enviarArquivos();
  }

  async function tentarAmostraDeNovo(variationKey: string) {
    if (uploading.value) return;
    const variation = form.value.variations.find(
      (item) => item.key === variationKey,
    );
    if (!variation) return;

    uploading.value = true;
    try {
      await enviarAmostra(variation);
    } finally {
      uploading.value = false;
    }
    concluirSeCompleto();
  }

  async function tentarFotoDeNovo(photoKey: string) {
    if (uploading.value) return;
    const photo = form.value.photos.find((item) => item.key === photoKey);
    if (!photo) return;

    uploading.value = true;
    try {
      await enviarFoto(photo);
    } finally {
      uploading.value = false;
    }
    concluirSeCompleto();
  }

  function concluirAssimMesmo() {
    const pending = totalFiles.value - doneFiles.value;
    toast.warning(
      pending === 1
        ? `${opcoes.prefixoAviso}, mas 1 arquivo não foi enviado.`
        : `${opcoes.prefixoAviso}, mas ${pending} arquivos não foram enviados.`,
    );
    router.push(opcoes.destino);
  }

  return {
    uploading,
    totalFiles,
    doneFiles,
    failedFiles,
    progressPercent,
    iniciarEnvio,
    tentarAmostraDeNovo,
    tentarFotoDeNovo,
    concluirAssimMesmo,
  };
}
