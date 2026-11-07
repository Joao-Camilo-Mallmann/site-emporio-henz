import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { RouteLocationRaw } from "vue-router";
import { categoriasApi, sistemaApi, produtosApi } from "@/api";
import {
  Product,
  type BackendStatus,
  type ICategory,
  type ISubtype,
} from "@/types";
import { slugify } from "@/utils/slug";

const CATEGORIAS_POR_PAGINA = 100;

/** Itens que cabem na barra de categorias do desktop (largura do Figma). */
export const MAX_ITENS_BARRA = 6;

export interface CardCategoriaHome {
  slug: string;
  name: string;
  image: string;
}

/** Vitrine fixa da home (Figma #38:2521): só aparece o card cuja categoria existe. */
export const CARDS_HOME: readonly CardCategoriaHome[] = [
  { slug: "quarto", name: "Quarto", image: "/images/categories/cat-quarto.webp" },
  {
    slug: "sala-de-estar",
    name: "Sala de Estar",
    image: "/images/categories/cat-sala-estar.webp",
  },
  {
    slug: "sala-de-jantar",
    name: "Sala de Jantar",
    image: "/images/categories/cat-sala-jantar.webp",
  },
  { slug: "cozinha", name: "Cozinha", image: "/images/categories/cat-cozinha.webp" },
  {
    slug: "escritorio",
    name: "Escritório",
    image: "/images/categories/cat-escritorio.webp",
  },
  { slug: "banheiro", name: "Banheiro", image: "/images/categories/cat-banheiro.webp" },
];

/** Procura a categoria pelo slug e, se não achar, pelo nome normalizado. */
export function encontrarCategoria(
  lista: readonly ICategory[],
  slug: string,
): ICategory | undefined {
  return (
    lista.find((categoria) => categoria.slug === slug) ??
    lista.find((categoria) => slugify(categoria.name) === slug)
  );
}

export function linkCategoria(categoria: Pick<ICategory, "slug">): RouteLocationRaw {
  return { path: "/catalogo", query: { categoria: categoria.slug } };
}

export function linkSubcategoria(
  categoria: Pick<ICategory, "slug">,
  subtipo: Pick<ISubtype, "name">,
): RouteLocationRaw {
  return {
    path: "/catalogo",
    query: { categoria: categoria.slug, subcategoria: subtipo.name },
  };
}

export const useAppStore = defineStore("app", () => {
  const backendStatus = ref<BackendStatus>({
    online: false,
    loading: false,
  });

  const produtos = ref<Product[]>([]);
  const produtosLoading = ref(false);
  const produtosError = ref<string>();

  // Categorias públicas (menu, drawer e vitrine da home), carregadas uma vez por sessão
  const categorias = ref<ICategory[]>([]);
  const categoriasLoading = ref(false);
  const categoriasError = ref<string>();
  const categoriasCarregadas = ref(false);
  let categoriasPromise: Promise<void> | null = null;

  async function checkBackendHealth() {
    backendStatus.value.loading = true;
    backendStatus.value.error = undefined;
    try {
      const data = await sistemaApi.status();
      backendStatus.value = {
        online: true,
        timestamp: data.timestamp,
        uptime: data.uptime,
        loading: false,
      };
    } catch (err: unknown) {
      backendStatus.value = {
        online: false,
        loading: false,
        error: err instanceof Error ? err.message : "Falha na conexão",
      };
    }
  }

  async function carregarProdutos() {
    produtosLoading.value = true;
    produtosError.value = undefined;
    try {
      const lista = await produtosApi.listar();
      produtos.value = lista.map((p) => new Product(p));
    } catch (err: unknown) {
      produtosError.value =
        err instanceof Error ? err.message : "Erro ao carregar produtos";
    } finally {
      produtosLoading.value = false;
    }
  }

  async function buscarTodasCategorias(): Promise<ICategory[]> {
    const todas: ICategory[] = [];
    let page = 1;
    let totalPages: number;
    do {
      const resposta = await categoriasApi.listar({
        page,
        limit: CATEGORIAS_POR_PAGINA,
      });
      todas.push(...resposta.data);
      totalPages = resposta.pagination.totalPages || 1;
      page += 1;
    } while (page <= totalPages);

    // Com token de Admin a API devolve também os inativos; o site público nunca os mostra
    return todas
      .filter((categoria) => categoria.active)
      .map((categoria) => ({
        ...categoria,
        subtypes: (categoria.subtypes ?? []).filter((sub) => sub.active),
      }));
  }

  function carregarCategorias(): Promise<void> {
    if (categoriasCarregadas.value) return Promise.resolve();
    if (categoriasPromise) return categoriasPromise;

    categoriasLoading.value = true;
    categoriasError.value = undefined;
    categoriasPromise = buscarTodasCategorias()
      .then((lista) => {
        categorias.value = lista;
        categoriasCarregadas.value = true;
      })
      .catch((err: unknown) => {
        categoriasError.value =
          err instanceof Error ? err.message : "Erro ao carregar categorias";
      })
      .finally(() => {
        categoriasLoading.value = false;
        categoriasPromise = null;
      });
    return categoriasPromise;
  }

  // Até 6 categorias cabem na barra; a partir da 7ª, 5 ficam visíveis e o botão "Mais" ocupa o 6º espaço
  const categoriasBarra = computed(() =>
    categorias.value.length <= MAX_ITENS_BARRA
      ? categorias.value
      : categorias.value.slice(0, MAX_ITENS_BARRA - 1),
  );
  const categoriasMais = computed(() =>
    categorias.value.length <= MAX_ITENS_BARRA
      ? []
      : categorias.value.slice(MAX_ITENS_BARRA - 1),
  );

  // Enquanto carrega (ou se a API falhar) a vitrine mantém os 6 cards para não saltar o layout
  const cardsHome = computed<CardCategoriaHome[]>(() => {
    if (!categoriasCarregadas.value) return [...CARDS_HOME];
    return CARDS_HOME.flatMap((card) => {
      const categoria = encontrarCategoria(categorias.value, card.slug);
      return categoria ? [{ ...card, slug: categoria.slug }] : [];
    });
  });

  return {
    backendStatus,
    produtos,
    produtosLoading,
    produtosError,
    categorias,
    categoriasBarra,
    categoriasMais,
    cardsHome,
    categoriasLoading,
    categoriasError,
    categoriasCarregadas,
    checkBackendHealth,
    carregarProdutos,
    carregarCategorias,
  };
});
