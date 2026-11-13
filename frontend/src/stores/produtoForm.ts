import {
  categoriasApi,
  fornecedoresApi,
  produtosApi,
  subtiposApi,
} from "@/api";
import { toast } from "@/composables/useToast";
import type {
  Category,
  FieldErrors,
  KeyValueRow,
  NumericInput,
  PhotoFormItem,
  ProductCreatePayload,
  ProductDto,
  ProductFormState,
  ProductImageDto,
  ProductUpdatePayload,
  SampleFormItem,
  Supplier,
} from "@/types";
import {
  apiErrorMessage,
  createKeyValueRow,
  createLocalKey,
  DEFAULT_VARIATION_COLOR,
  FIELD_IDS,
  INSTALLMENTS_MIN,
  normalizeHexColor,
  variationFieldId,
} from "@/utils/admin/produtos/produtoFormConstantes";
import { defineStore } from "pinia";
import { computed, reactive, toRefs } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "./auth";
import { useCategoriasStore } from "./categorias";

// Telas de cadastro e edição de produto: estado do formulário, opções dos
// seletores, gravação (POST ou PUT), envio dos arquivos e exclusões imediatas.
// A tela monta o formulário (`createEmptyForm` ou `formFromProduct`), entrega
// com `setProduto`, chama `carregarOpcoes` e, ao sair, `limpar`.

/** Exclusão que espera confirmação: foto publicada, amostra publicada ou o produto. */
type Remocao =
  | { kind: "image"; imageId: string }
  | { kind: "sample"; variationKey: string }
  | { kind: "product" };

/** Formulário do cadastro: o objeto que a tela de novo produto entrega à store. */
export function createEmptyForm(): ProductFormState {
  return {
    name: "",
    slug: "",
    slugEdited: false,
    categoryId: "",
    subtypeId: "",
    supplierId: "",
    collectionLine: "",
    mainMaterial: "",
    description: "",
    referencePrice: "",
    maxInstallments: 1,
    availabilityType: "IN_STOCK",
    estimatedDays: "",
    heightMm: "",
    widthMm: "",
    depthMm: "",
    variations: [],
    photos: [],
    specifications: [createKeyValueRow()],
    active: true,
  };
}

const estadoInicial = () => ({
  /** A tela de edição liga antes de buscar o produto. */
  editando: false,
  form: createEmptyForm(),
  /** Produto carregado (edição) ou recém-criado (cadastro). */
  product: null as ProductDto | null,
  /** Fotos já publicadas (só na edição). */
  existingImages: [] as ProductImageDto[],
  categories: [] as Category[],
  suppliers: [] as Supplier[],
  /** Verdadeiro até `carregarOpcoes` terminar. */
  loading: true,
  saving: false,
  /** Produto gravado: o formulário trava e só os arquivos seguem. */
  saved: false,
  uploading: false,
  removing: false,
  pendingRemoval: null as Remocao | null,
  /** Alerta geral: falha de gravação sem campo correspondente. */
  errorMessage: null as string | null,
  /** Erros por campo devolvidos pela API, pela chave `id do campo no DOM`. */
  serverErrors: {} as FieldErrors,
});

function toNumber(value: NumericInput): number | null {
  const parsed = value === "" ? NaN : Number(String(value).replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

/** Objeto JSONB (`specifications`, `finishDetails`) → linhas do editor. */
function recordToRows(record: Record<string, unknown> | null | undefined) {
  return Object.entries(record ?? {}).map(([key, value]) =>
    createKeyValueRow(key, String(value ?? "")),
  );
}

/**
 * Corpo do `POST /produtos` ou, com `edicao`, do `PUT /produtos/:id`. Número
 * vazio vai como `null` para a API acusar o campo. No `PUT` os opcionais
 * vazios vão explícitos (`null` ou `{}`): a API ignora campo omitido, e sem
 * isso a edição não conseguiria limpá-los.
 */
function montarPayload(
  form: ProductFormState,
  edicao: boolean,
): ProductUpdatePayload {
  const numero = (value: NumericInput) =>
    toNumber(value) ?? (null as unknown as number);
  const texto = (value: string) => value.trim() || (edicao ? null : undefined);
  const registro = (rows: KeyValueRow[]) => {
    const entries = rows
      .map((row) => [row.key.trim(), row.value.trim()])
      .filter(([key, value]) => key || value);
    if (entries.length > 0) return Object.fromEntries(entries);
    return edicao ? {} : undefined;
  };

  return {
    categoryId: form.categoryId,
    subtypeId: form.subtypeId || (edicao ? null : undefined),
    supplierId: form.supplierId,
    name: form.name.trim(),
    slug:
      edicao || form.slugEdited
        ? form.slug.trim()
        : form.slug.trim() || undefined,
    collectionLine: texto(form.collectionLine),
    mainMaterial: texto(form.mainMaterial),
    referencePrice: numero(form.referencePrice),
    maxInstallments: numero(form.maxInstallments),
    availabilityType: form.availabilityType,
    estimatedDays:
      form.availabilityType === "ON_DEMAND"
        ? numero(form.estimatedDays)
        : undefined,
    heightMm: numero(form.heightMm),
    widthMm: numero(form.widthMm),
    depthMm: numero(form.depthMm),
    description: texto(form.description),
    specifications: registro(form.specifications),
    active: form.active,
    // A ordem da tela é o `sortOrder`; variação omitida recebe soft delete.
    variations: form.variations.map((variation, index) => ({
      id: variation.id ?? undefined,
      name: variation.name.trim(),
      variationType: variation.variationType,
      colorsHex: variation.colorsHex.map(normalizeHexColor),
      finishDetails: registro(variation.finishDetails),
      sortOrder: index,
      inStock: variation.inStock,
    })),
  };
}

/**
 * Produto de `GET /produtos/:id` → formulário: o objeto que a tela de edição
 * entrega à store. As fotos publicadas ficam em `existingImages`;
 * `form.photos` guarda só os arquivos novos.
 */
export function formFromProduct(product: ProductDto): ProductFormState {
  const numero = (value: number | null | undefined): NumericInput =>
    typeof value === "number" && Number.isFinite(value) ? value : "";

  return {
    name: product.name ?? "",
    slug: product.slug ?? "",
    // O slug já existe: ele não acompanha mais mudanças no nome.
    slugEdited: true,
    categoryId: product.categoryId ?? "",
    subtypeId: product.subtypeId ?? "",
    supplierId: product.supplierId ?? "",
    collectionLine: product.collectionLine ?? "",
    mainMaterial: product.mainMaterial ?? "",
    description: product.description ?? "",
    referencePrice: numero(product.referencePrice),
    maxInstallments: numero(product.maxInstallments) || INSTALLMENTS_MIN,
    availabilityType: product.availabilityType,
    estimatedDays:
      product.availabilityType === "ON_DEMAND"
        ? numero(product.estimatedDays)
        : "",
    heightMm: numero(product.heightMm),
    widthMm: numero(product.widthMm),
    depthMm: numero(product.depthMm),
    variations: [...(product.variations ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((variation) => ({
        key: createLocalKey(),
        id: variation.id,
        name: variation.name ?? "",
        variationType: variation.variationType,
        colorsHex:
          variation.colorsHex.length > 0
            ? variation.colorsHex.map(normalizeHexColor)
            : [DEFAULT_VARIATION_COLOR],
        finishDetails: recordToRows(variation.finishDetails),
        inStock: variation.inStock,
        sample: null,
        existingSampleUrl: variation.sampleImageUrl,
      })),
    photos: [],
    specifications: recordToRows(product.specifications),
    active: product.active,
  };
}

export const useProdutoFormStore = defineStore("produtoForm", () => {
  const router = useRouter();
  const authStore = useAuthStore();
  const categoriasStore = useCategoriasStore();

  const s = reactive(estadoInicial());
  // Descarta a carga das opções se a tela já foi trocada.
  let abertura = 0;

  const destino = computed(() => (s.editando ? "/admin/produtos" : "/admin"));
  const feito = computed(() => (s.editando ? "atualizado" : "cadastrado"));
  const locked = computed(() => s.saving || s.saved);
  const busy = computed(() => s.uploading || s.removing);
  // Vendedor com um único vínculo: fornecedor pré-selecionado e travado.
  const supplierLocked = computed(
    () => authStore.isVendedor && s.suppliers.length === 1,
  );
  // Vendedor sem vínculo: aviso e gravação desabilitada.
  const noSupplier = computed(
    () => authStore.isVendedor && s.suppliers.length === 0,
  );

  // Amostras e fotos, na ordem de envio.
  const uploadStates = computed(() => [
    ...s.form.variations.flatMap((item) => item.sample?.uploadState ?? []),
    ...s.form.photos.map((photo) => photo.uploadState),
  ]);
  const totalFiles = computed(() => uploadStates.value.length);
  const doneFiles = computed(
    () => uploadStates.value.filter((state) => state === "done").length,
  );
  const failedFiles = computed(
    () => uploadStates.value.filter((state) => state === "error").length,
  );

  const fieldError = (id: string) => s.serverErrors[id] ?? "";

  function describedBy(id: string, hintId = "") {
    const ids = [fieldError(id) ? `${id}-error` : "", hintId].filter(Boolean);
    return ids.join(" ") || undefined;
  }

  // -------------------------------------------------------------------------
  // Carga
  // -------------------------------------------------------------------------

  /** Zera a tela e libera os previews locais (object URLs). */
  function limpar() {
    abertura += 1;
    s.form.variations.forEach((variation) => {
      if (variation.sample) URL.revokeObjectURL(variation.sample.previewUrl);
    });
    s.form.photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    Object.assign(s, estadoInicial());
  }

  /**
   * Edição: a categoria, o subtipo e o fornecedor do produto voltam às listas
   * mesmo inativos; sem eles o seletor ficaria vazio e a API recusaria o
   * próprio produto.
   */
  async function garantirSelecionados() {
    const { categoryId, subtypeId, supplierId } = s.form;

    if (categoryId && !s.categories.some((item) => item.id === categoryId)) {
      const achada =
        categoriasStore.todas.find((item) => item.id === categoryId) ??
        (await categoriasApi.buscarPorId(categoryId).catch(() => null));
      s.categories.unshift(
        achada
          ? {
              ...achada,
              name: achada.active ? achada.name : `${achada.name} (inativa)`,
              subtypes: [],
            }
          : {
              id: categoryId,
              name: "Categoria indisponível",
              slug: "",
              active: false,
              subtypes: [],
            },
      );
    }

    const category = s.categories.find((item) => item.id === categoryId);
    const subtypes = category?.subtypes ?? [];
    if (
      category &&
      subtypeId &&
      !subtypes.some((item) => item.id === subtypeId)
    ) {
      const achado =
        categoriasStore.todas
          .flatMap((item) => item.subtypes ?? [])
          .find((item) => item.id === subtypeId) ??
        (await subtiposApi.buscarPorId(subtypeId).catch(() => null));
      category.subtypes = [
        achado
          ? {
              ...achado,
              name: achado.active ? achado.name : `${achado.name} (inativo)`,
            }
          : {
              id: subtypeId,
              categoryId,
              name: "Subtipo indisponível",
              slug: "",
              active: false,
            },
        ...subtypes,
      ];
    }

    if (supplierId && !s.suppliers.some((item) => item.id === supplierId)) {
      const achado = await fornecedoresApi
        .buscarPorId(supplierId)
        .catch(() => null);
      if (achado) s.suppliers.unshift(achado);
      else s.form.supplierId = "";
    }
  }

  /**
   * Recebe da tela o formulário já montado: vazio no cadastro; na edição, o
   * do produto carregado, que vem junto.
   */
  function setProduto(
    form: ProductFormState,
    product: ProductDto | null = null,
  ) {
    s.form = form;
    s.product = product;
    s.existingImages = [...(product?.images ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }

  /** Carrega categorias e fornecedores dos seletores e libera a tela. */
  async function carregarOpcoes() {
    const pedido = abertura;
    try {
      const [suppliers] = await Promise.all([
        fornecedoresApi.listar({ limit: 100, active: true }),
        categoriasStore.carregar(),
      ]);
      if (pedido !== abertura) return;
      if (!categoriasStore.carregadas) {
        throw new Error(
          categoriasStore.error ?? "Não foi possível carregar as categorias.",
        );
      }

      // Cópia por item: `garantirSelecionados` anexa subtipos sem tocar na store.
      s.categories = categoriasStore.lista.map((category) => ({
        ...category,
        subtypes: [...(category.subtypes ?? [])],
      }));
      s.suppliers = suppliers.data.filter((supplier) => supplier.active);

      if (s.editando) await garantirSelecionados();
      else if (supplierLocked.value) s.form.supplierId = s.suppliers[0].id;
      s.loading = false;
    } catch (err: unknown) {
      if (pedido !== abertura) return;
      toast.error(
        apiErrorMessage(
          err,
          "Não foi possível carregar categorias e fornecedores.",
        ),
      );
      router.push(destino.value);
    }
  }

  // -------------------------------------------------------------------------
  // Gravação e envio dos arquivos
  // -------------------------------------------------------------------------

  /** Campo da API (`name`, `variations.0.colorsHex.1`) → id do campo no DOM. */
  function fieldIdDe(campo: string): string | undefined {
    if (campo in FIELD_IDS) return FIELD_IDS[campo as keyof typeof FIELD_IDS];

    const [, indice, prop, sub] =
      /^variations\.(\d+)\.([a-zA-Z]+)(?:\.(\d+))?$/.exec(campo) ?? [];
    const key = s.form.variations[Number(indice)]?.key;
    if (!key) return undefined;
    if (["name", "id", "sortOrder"].includes(prop))
      return variationFieldId.name(key);
    if (prop === "variationType") return variationFieldId.type(key);
    if (prop === "colorsHex")
      return variationFieldId.color(key, Number(sub ?? 0));
    if (prop === "finishDetails") return variationFieldId.details(key);
    if (prop === "inStock") return variationFieldId.inStock(key);
    return undefined;
  }

  /**
   * Lê a falha do `POST` ou do `PUT`: `errors` e `field` da API (e `409` no
   * slug) viram erros por campo; o que não tem campo vai para o alerta geral.
   */
  function registrarErro(err: unknown) {
    const response = (
      err as {
        response?: {
          status?: number;
          data?: { field?: unknown; errors?: unknown };
        };
      }
    ).response;
    const mensagem = apiErrorMessage(
      err,
      "Ocorreu um erro ao salvar o produto.",
    );
    const erros: FieldErrors = {};
    let semCampo = false;
    const marcar = (campo: string, texto: string) => {
      const id = fieldIdDe(campo);
      if (id) erros[id] = texto;
      else semCampo = true;
    };

    const { errors, field } = response?.data ?? {};
    if (errors && typeof errors === "object" && !Array.isArray(errors)) {
      Object.entries(errors).forEach(([campo, texto]) => {
        if (typeof texto === "string") marcar(campo, texto);
      });
    } else if (typeof field === "string") {
      marcar(field, mensagem);
    } else if (response?.status === 409) {
      erros[FIELD_IDS.slug] = apiErrorMessage(
        err,
        "Já existe um produto com este slug. Escolha outro.",
      );
    }

    s.serverErrors = erros;
    s.errorMessage =
      semCampo || Object.keys(erros).length === 0 ? mensagem : null;
  }

  async function enviarItem(
    item: SampleFormItem | PhotoFormItem,
    variacaoGravada: boolean,
    envio: () => Promise<void>,
  ) {
    if (!variacaoGravada) {
      item.uploadState = "error";
      item.uploadError = `A variação não foi encontrada no produto ${feito.value}.`;
      return;
    }
    item.uploadState = "uploading";
    item.uploadError = undefined;
    try {
      await envio();
      item.uploadState = "done";
    } catch (err: unknown) {
      item.uploadState = "error";
      item.uploadError = apiErrorMessage(
        err,
        "Não foi possível enviar o arquivo.",
      );
    }
  }

  /**
   * Envia o que falta do produto gravado: amostras e depois fotos, uma
   * requisição por vez. Com `key`, reenvia só aquela amostra ou foto. Ao
   * completar tudo, avisa e sai da tela.
   */
  async function enviarArquivos(key?: string) {
    const produto = s.product;
    if (!produto || s.uploading) return;

    s.uploading = true;
    for (const variation of s.form.variations) {
      const sample = variation.sample;
      if (!sample || sample.uploadState === "done") continue;
      if (key && key !== variation.key) continue;
      await enviarItem(sample, !!variation.id, async () => {
        const { sampleImageUrl } = await produtosApi.enviarAmostra(
          produto.id,
          variation.id!,
          sample.file,
        );
        sample.uploadedUrl = sampleImageUrl;
        // Na edição a amostra nova passa a ser a publicada da variação.
        if (s.editando) variation.existingSampleUrl = sampleImageUrl;
      });
    }
    for (const photo of s.form.photos) {
      if (photo.uploadState === "done" || (key && key !== photo.key)) continue;
      const variationId = s.form.variations.find(
        (item) => item.key === photo.variationKey,
      )?.id;
      await enviarItem(
        photo,
        !photo.variationKey || !!variationId,
        async () => {
          photo.uploaded = await produtosApi.enviarFoto(
            produto.id,
            photo.file,
            variationId ?? null,
          );
        },
      );
    }
    s.uploading = false;

    if (doneFiles.value === totalFiles.value) {
      toast.success(`Produto ${feito.value} com sucesso!`);
      router.push(destino.value);
    }
  }

  /** `POST` no cadastro, `PUT` na edição; depois os arquivos. */
  async function salvar() {
    if (locked.value) return;

    s.saving = true;
    s.errorMessage = null;
    s.serverErrors = {};
    try {
      const payload = montarPayload(s.form, s.editando);
      const gravado = s.product
        ? await produtosApi.atualizar(s.product.id, payload)
        : await produtosApi.criar(payload as ProductCreatePayload);
      s.product = { ...s.product, ...gravado };
      // A variação na posição `i` foi enviada com `sortOrder = i`.
      s.form.variations.forEach((variation, index) => {
        variation.id =
          gravado.variations.find((item) => item.sortOrder === index)?.id ??
          variation.id;
      });
      // A partir daqui só os arquivos seguem (reenviar o POST daria 409).
      s.saved = true;
    } catch (err: unknown) {
      registrarErro(err);
      return;
    } finally {
      s.saving = false;
    }

    await enviarArquivos();
  }

  /** Sai da tela com arquivos pendentes. */
  function concluirAssimMesmo() {
    const pendentes = totalFiles.value - doneFiles.value;
    toast.warning(
      pendentes === 1
        ? `Produto ${feito.value}, mas 1 arquivo não foi enviado.`
        : `Produto ${feito.value}, mas ${pendentes} arquivos não foram enviados.`,
    );
    router.push(destino.value);
  }

  // -------------------------------------------------------------------------
  // Exclusões imediatas (não esperam o botão de salvar)
  // -------------------------------------------------------------------------

  async function confirmarRemocao() {
    const pedido = s.pendingRemoval;
    const produto = s.product;
    if (!pedido || !produto) return;

    s.removing = true;
    try {
      if (pedido.kind === "image") {
        await produtosApi.removerFoto(produto.id, pedido.imageId);
        s.existingImages = s.existingImages.filter(
          (image) => image.id !== pedido.imageId,
        );
        toast.info("Foto removida do produto.");
      } else if (pedido.kind === "sample") {
        const variation = s.form.variations.find(
          (item) => item.key === pedido.variationKey,
        );
        // Variação ainda não gravada: a amostra só existe no navegador.
        if (variation?.id) {
          await produtosApi.removerAmostra(produto.id, variation.id);
          toast.info("Amostra removida da variação.");
        }
        if (variation) variation.existingSampleUrl = null;
      } else {
        await produtosApi.deletar(produto.id);
        toast.info("Produto desativado com sucesso.");
        router.push(destino.value);
      }
      s.pendingRemoval = null;
    } catch (err: unknown) {
      toast.error(
        apiErrorMessage(err, "Não foi possível concluir a exclusão."),
      );
    } finally {
      s.removing = false;
    }
  }

  return {
    ...toRefs(s),
    destino,
    locked,
    busy,
    supplierLocked,
    noSupplier,
    totalFiles,
    doneFiles,
    failedFiles,
    fieldError,
    describedBy,
    setProduto,
    carregarOpcoes,
    limpar,
    salvar,
    enviarArquivos,
    concluirAssimMesmo,
    confirmarRemocao,
  };
});
