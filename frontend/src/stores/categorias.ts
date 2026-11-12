import { categoriasApi } from "@/api";
import type { ICategory } from "@/types";
import { getAuthToken } from "@/utils/cookie";
import { slugify } from "@/utils/slug";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useAuthStore } from "./auth";

const POR_PAGINA = 100;

export const MAX_ITENS_BARRA = 6;

export interface CardCategoriaHome {
  slug: string;
  name: string;
  image: string;
}

export const CARDS_HOME: readonly CardCategoriaHome[] = [
  {
    slug: "quarto",
    name: "Quarto",
    image: "/images/categories/cat-quarto.webp",
  },
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
  {
    slug: "cozinha",
    name: "Cozinha",
    image: "/images/categories/cat-cozinha.webp",
  },
  {
    slug: "escritorio",
    name: "Escritório",
    image: "/images/categories/cat-escritorio.webp",
  },
  {
    slug: "banheiro",
    name: "Banheiro",
    image: "/images/categories/cat-banheiro.webp",
  },
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

export const useCategoriasStore = defineStore("categorias", () => {
  const authStore = useAuthStore();

  const todas = ref<ICategory[]>([]);
  const loading = ref(false);
  const error = ref<string>();
  const carregadas = ref(false);
  let pendente: Promise<void> | null = null;
  let tokenNaCarga: string | null = null;

  // Com token de Admin a API devolve também os inativos; o site público nunca os mostra
  const lista = computed<ICategory[]>(() =>
    todas.value
      .filter((categoria) => categoria.active)
      .map((categoria) => ({
        ...categoria,
        subtypes: (categoria.subtypes ?? []).filter((sub) => sub.active),
      })),
  );

  function extrairErro(err: unknown): string {
    const apiErr = err as { response?: { data?: { message?: string } } };
    if (apiErr.response?.data?.message) return apiErr.response.data.message;
    return err instanceof Error ? err.message : "Erro ao carregar categorias";
  }

  async function executarCarga(
    token: string | null,
    verificarAtual: () => boolean,
  ): Promise<void> {
    loading.value = true;
    error.value = undefined;
    try {
      const proximaLista = await buscarTodasCategorias();
      if (verificarAtual()) {
        todas.value = proximaLista;
        carregadas.value = true;
        tokenNaCarga = token;
      }
    } catch (err: unknown) {
      if (verificarAtual()) {
        error.value = extrairErro(err);
      }
    } finally {
      if (verificarAtual()) {
        loading.value = false;
        pendente = null;
      }
    }
  }

  function carregar(forcar = false): Promise<void> {
    const tokenAtual = authStore.token ?? getAuthToken() ?? null;
    const tokenMudou = carregadas.value && tokenAtual !== tokenNaCarga;
    if (carregadas.value && !forcar && !tokenMudou) {
      return Promise.resolve();
    }

    if (forcar || tokenMudou) {
      pendente = null;
    }

    if (!pendente) {
      const requisicao = executarCarga(
        tokenAtual,
        () => pendente === requisicao,
      );
      pendente = requisicao;
    }

    return pendente;
  }

  function recarregar(): Promise<void> {
    return carregar(true);
  }

  async function buscarTodasCategorias(): Promise<ICategory[]> {
    const acumuladas: ICategory[] = [];
    let page = 1;
    let totalPages: number;
    do {
      const resposta = await categoriasApi.listar({ page, limit: POR_PAGINA });
      acumuladas.push(...resposta.data);
      totalPages = resposta.pagination.totalPages || 1;
      page += 1;
    } while (page <= totalPages);

    return acumuladas;
  }

  // Até 6 categorias cabem na barra; a partir da 7ª, 5 ficam visíveis e o botão "Mais" ocupa o 6º espaço
  const transborda = computed(() => lista.value.length > MAX_ITENS_BARRA);
  const barra = computed(() =>
    transborda.value ? lista.value.slice(0, MAX_ITENS_BARRA - 1) : lista.value,
  );
  const mais = computed(() =>
    transborda.value ? lista.value.slice(MAX_ITENS_BARRA - 1) : [],
  );

  // Enquanto carrega (ou se a API falhar) a vitrine mantém os 6 cards para não saltar o layout
  const cardsHome = computed<CardCategoriaHome[]>(() => {
    if (!carregadas.value) return [...CARDS_HOME];
    return CARDS_HOME.flatMap((card) => {
      const categoria = encontrarCategoria(lista.value, card.slug);
      return categoria ? [{ ...card, slug: categoria.slug }] : [];
    });
  });

  return {
    todas,
    lista,
    loading,
    error,
    carregadas,
    barra,
    mais,
    cardsHome,
    carregar,
    recarregar,
  };
});
