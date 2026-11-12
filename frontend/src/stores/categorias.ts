import { categoriasApi } from "@/api";
import type { ICategory } from "@/types";
import { slugify } from "@/utils/slug";
import { defineStore } from "pinia";
import { computed, ref } from "vue";

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
  const lista = ref<ICategory[]>([]);
  const loading = ref(false);
  const error = ref<string>();
  const carregadas = ref(false);
  let pendente: Promise<void> | null = null;

  async function executarCarga(verificarAtual: () => boolean): Promise<void> {
    loading.value = true;
    error.value = undefined;
    try {
      const proximaLista = await buscarCategoriasAtivas();
      if (verificarAtual()) {
        lista.value = proximaLista;
        carregadas.value = true;
      }
    } catch (err: unknown) {
      if (verificarAtual()) {
        error.value =
          err instanceof Error ? err.message : "Erro ao carregar categorias";
      }
    } finally {
      if (verificarAtual()) {
        loading.value = false;
        pendente = null;
      }
    }
  }

  function carregar(forcar = false): Promise<void> {
    if (carregadas.value && !forcar) return Promise.resolve();

    if (forcar) {
      carregadas.value = false;
      pendente = null;
    }

    if (!pendente) {
      const requisicao = executarCarga(() => pendente === requisicao);
      pendente = requisicao;
    }

    return pendente;
  }

  function recarregar(): Promise<void> {
    return carregar(true);
  }

  async function buscarCategoriasAtivas(): Promise<ICategory[]> {
    const todas: ICategory[] = [];
    let page = 1;
    let totalPages: number;
    do {
      const resposta = await categoriasApi.listar({ page, limit: POR_PAGINA });
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
