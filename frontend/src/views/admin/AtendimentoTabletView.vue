<script setup lang="ts">
import { atendimentoApi } from "@/api/atendimento";
import { listasApi } from "@/api/listas";
import { produtosApi } from "@/api/produtos";
import type {
  ApiListItem,
  ListType,
  ProductDto,
  ProductVariationDto,
  VariationType,
} from "@/types";
import { toApiAssetUrl } from "@/utils/uploads";
import { Icon } from "@iconify/vue";
import { isAxiosError } from "axios";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";

// Tela de atendimento presencial (tablet): o vendedor busca o cliente pelo
// e-mail (ou cola o link de uma lista) e vê o que ele salvou em casa.

interface ViewList {
  id: string;
  name: string;
  listType: ListType;
  items: ApiListItem[];
}

interface ViewResult {
  source: "email" | "link";
  title: string;
  subtitle: string;
  lists: ViewList[];
}

interface RecentSearch {
  label: string;
  query: string;
}

interface FinishSummary {
  key: string;
  label: string;
  color: string | null;
  typeLabel: string | null;
  sampleUrl: string | null;
  count: number;
}

const router = useRouter();

const RECENT_KEY = "atendimento_recentes";
const LAST_KEY = "atendimento_ultima_busca";
const MAX_RECENT = 6;
const DEBOUNCE_MS = 600;

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VARIATION_LABEL: Record<VariationType, string> = {
  COLOR: "Cor",
  FABRIC: "Tecido",
  WOOD: "Madeira",
  FINISH: "Acabamento",
};

const searchInput = ref<HTMLInputElement | null>(null);
const query = ref("");
const isLoading = ref(false);
const errorMessage = ref("");
const result = ref<ViewResult | null>(null);
const selectedListId = ref<string | null>(null);
const recent = ref<RecentSearch[]>([]);
const details = ref<Record<string, ProductDto>>({});

let requestCounter = 0;
let lastExecutedText = "";
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

// ---------- Busca ----------

function extractShareSlug(text: string): string | null {
  const match = text.match(UUID_PATTERN);
  if (!match) return null;
  const isBareUuid = text.trim().toLowerCase() === match[0].toLowerCase();
  return isBareUuid || /\/lista\//i.test(text) ? match[0].toLowerCase() : null;
}

function detectKind(text: string): "email" | "link" | null {
  if (EMAIL_PATTERN.test(text)) return "email";
  if (extractShareSlug(text)) return "link";
  return null;
}

function friendlyError(err: unknown, kind: "email" | "link"): string {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    const apiMessage = (err.response?.data as { message?: unknown } | undefined)
      ?.message;

    if (status === 404) {
      return kind === "email" && typeof apiMessage === "string"
        ? apiMessage
        : "Esta lista não existe ou não está mais disponível.";
    }
    if (status === 403) {
      return "Você não tem permissão para consultar as listas de clientes.";
    }
    if (status === 400 && typeof apiMessage === "string") {
      return apiMessage;
    }
  }
  return "Não foi possível consultar agora. Confira a conexão e tente de novo.";
}

function pickInitialList(lists: ViewList[]): string | null {
  const withItems = lists.find((list) => list.items.length > 0);
  return (withItems ?? lists[0])?.id ?? null;
}

async function runSearch(raw: string) {
  const text = raw.trim();
  const kind = detectKind(text);

  if (!kind) {
    errorMessage.value =
      "Digite o e-mail completo do cliente ou cole o link da lista.";
    return;
  }

  lastExecutedText = text;
  const current = ++requestCounter;
  isLoading.value = true;
  errorMessage.value = "";

  try {
    let next: ViewResult;

    if (kind === "email") {
      const data = await atendimentoApi.buscarCliente(text.toLowerCase());
      next = {
        source: "email",
        title: data.client.fullName,
        subtitle: data.client.email,
        lists: data.lists.map((list) => ({
          id: list.id,
          name: list.name,
          listType: list.listType,
          items: list.items ?? [],
        })),
      };
    } else {
      const slug = extractShareSlug(text) as string;
      const data = await listasApi.buscarCompartilhada(slug);
      next = {
        source: "link",
        title: data.name,
        subtitle: "Lista compartilhada pelo cliente",
        lists: [
          {
            id: slug,
            name: data.name,
            listType: data.listType,
            items: data.items,
          },
        ],
      };
    }

    if (current !== requestCounter) return;

    result.value = next;
    selectedListId.value = pickInitialList(next.lists);
    rememberSearch(next.title, text);
    sessionStorage.setItem(LAST_KEY, text);
    void loadProductDetails();
  } catch (err) {
    if (current !== requestCounter) return;
    result.value = null;
    errorMessage.value = friendlyError(err, kind);
  } finally {
    if (current === requestCounter) {
      isLoading.value = false;
    }
  }
}

// Busca em tempo real: dispara sozinha quando o texto vira um e-mail ou link válido
watch(query, (value) => {
  if (debounceTimer) clearTimeout(debounceTimer);
  errorMessage.value = "";

  const text = value.trim();
  if (!detectKind(text)) return;

  debounceTimer = setTimeout(() => {
    if (text === lastExecutedText && result.value) return;
    void runSearch(text);
  }, DEBOUNCE_MS);
});

function searchNow() {
  if (debounceTimer) clearTimeout(debounceTimer);
  void runSearch(query.value);
}

function startNewClient() {
  if (debounceTimer) clearTimeout(debounceTimer);
  requestCounter++;
  query.value = "";
  result.value = null;
  errorMessage.value = "";
  isLoading.value = false;
  lastExecutedText = "";
  sessionStorage.removeItem(LAST_KEY);
  searchInput.value?.focus();
}

// ---------- Atendimentos recentes (trocar de cliente com um toque) ----------

function loadRecent() {
  try {
    const raw = sessionStorage.getItem(RECENT_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    recent.value = Array.isArray(parsed) ? (parsed as RecentSearch[]) : [];
  } catch {
    recent.value = [];
  }
}

function rememberSearch(label: string, search: string) {
  const key = search.trim().toLowerCase();
  const others = recent.value.filter((r) => r.query.toLowerCase() !== key);
  recent.value = [{ label, query: search.trim() }, ...others].slice(
    0,
    MAX_RECENT,
  );
  try {
    sessionStorage.setItem(RECENT_KEY, JSON.stringify(recent.value));
  } catch {
    // Sem armazenamento da sessão: a lista de recentes vale só nesta tela
  }
}

function openRecent(item: RecentSearch) {
  if (debounceTimer) clearTimeout(debounceTimer);
  query.value = item.query;
  void runSearch(item.query);
}

// ---------- Dados dos móveis (material e amostras) ----------

async function loadProductDetails() {
  const ids = new Set<string>();
  for (const list of result.value?.lists ?? []) {
    for (const item of list.items) {
      if (UUID_PATTERN.test(item.productId) && !details.value[item.productId]) {
        ids.add(item.productId);
      }
    }
  }
  if (ids.size === 0) return;

  const idList = [...ids];
  const settled = await Promise.allSettled(
    idList.map((id) => produtosApi.buscarDetalhe(id)),
  );
  settled.forEach((outcome, index) => {
    if (outcome.status === "fulfilled") {
      details.value[idList[index]] = outcome.value;
    }
  });
}

function productFor(item: ApiListItem): ProductDto | undefined {
  return details.value[item.productId] as ProductDto | undefined;
}

function variationFor(item: ApiListItem): ProductVariationDto | undefined {
  const label = item.finishLabel?.trim().toLowerCase();
  if (!label) return undefined;
  return productFor(item)?.variations.find(
    (variation) => variation.name.trim().toLowerCase() === label,
  );
}

// ---------- Dados derivados para a tela ----------

const activeList = computed(
  () => result.value?.lists.find((l) => l.id === selectedListId.value) ?? null,
);

const allItems = computed(() =>
  (result.value?.lists ?? []).flatMap((list) => list.items),
);

const totalProducts = computed(
  () => new Set(allItems.value.map((item) => item.productId)).size,
);

const finishSummary = computed<FinishSummary[]>(() => {
  const groups = new Map<string, FinishSummary>();
  const seenProducts = new Map<string, Set<string>>();

  for (const item of allItems.value) {
    if (!item.finishLabel && !item.finishColor) continue;

    const label = item.finishLabel?.trim() || "Acabamento sem nome";
    const key = `${label.toLowerCase()}|${(item.finishColor ?? "").toLowerCase()}`;
    const variation = variationFor(item);

    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label,
        color: item.finishColor ?? variation?.colorsHex[0] ?? null,
        typeLabel: variation ? VARIATION_LABEL[variation.variationType] : null,
        sampleUrl: variation?.sampleImageUrl
          ? toApiAssetUrl(variation.sampleImageUrl)
          : null,
        count: 0,
      });
      seenProducts.set(key, new Set());
    }

    const products = seenProducts.get(key) as Set<string>;
    if (!products.has(item.productId)) {
      products.add(item.productId);
      (groups.get(key) as FinishSummary).count++;
    }
  }

  return [...groups.values()];
});

const materialSummary = computed(() => {
  const counts = new Map<string, number>();
  const seen = new Set<string>();

  for (const item of allItems.value) {
    if (seen.has(item.productId)) continue;
    seen.add(item.productId);

    const material = productFor(item)?.mainMaterial?.trim();
    if (material) {
      counts.set(material, (counts.get(material) ?? 0) + 1);
    }
  }

  return [...counts.entries()].map(([name, count]) => ({ name, count }));
});

// ---------- Apresentação ----------

function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function plural(count: number, singular: string, pluralWord: string): string {
  return `${count} ${count === 1 ? singular : pluralWord}`;
}

function getListIcon(listType: ListType): string {
  switch (listType) {
    case "FAVORITES":
      return "mdi:heart";
    case "WISHLIST":
      return "mdi:star";
    case "GIFT_LIST":
      return "mdi:gift";
    default:
      return "mdi:folder-outline";
  }
}

// A página pública do produto é `/catalogo/:slug`. Ela também aceita o id e
// troca a URL pelo slug, então o id serve de reserva quando o slug falta.
function openProduct(item: ApiListItem) {
  const slug = item.productSlug || productFor(item)?.slug || item.productId;
  void router.push({ name: "catalogo-produto", params: { slug } });
}

function hideBrokenImage(event: Event) {
  (event.target as HTMLImageElement).style.display = "none";
}

onMounted(() => {
  loadRecent();

  // Volta ao cliente que estava aberto (por exemplo, depois de ver um produto)
  const last = sessionStorage.getItem(LAST_KEY);
  if (last) {
    query.value = last;
    void runSearch(last);
  } else {
    searchInput.value?.focus();
  }
});

onBeforeUnmount(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
  requestCounter++;
});
</script>

<template>
  <div
    class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-6 sm:py-8 px-4 sm:px-6 lg:px-8"
  >
    <div class="max-w-6xl mx-auto space-y-6">
      <!-- Cabeçalho -->
      <div>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-neutral-dark transition-colors min-h-11"
          @click="router.push('/admin')"
        >
          <Icon icon="mdi:arrow-left" class="w-4 h-4" />
          <span>Painel Administrativo</span>
        </button>
        <h1
          class="text-2xl sm:text-3xl font-bold text-neutral-dark tracking-tight"
        >
          Atendimento no showroom
        </h1>
        <p class="text-sm sm:text-base text-stone-500 mt-1">
          Veja o que o cliente salvou em casa e separe as amostras de tecidos e
          madeiras.
        </p>
      </div>

      <!-- Busca -->
      <section
        class="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-6 shadow-xs"
      >
        <label
          for="busca-cliente"
          class="block text-sm font-semibold text-neutral-dark mb-2"
        >
          E-mail do cliente
        </label>
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <Icon
              icon="mdi:account-search"
              class="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-400 pointer-events-none"
            />
            <input
              id="busca-cliente"
              ref="searchInput"
              v-model="query"
              type="text"
              inputmode="email"
              enterkeyhint="search"
              autocomplete="off"
              autocapitalize="off"
              autocorrect="off"
              spellcheck="false"
              placeholder="cliente@exemplo.com"
              class="w-full h-14 pl-13 pr-12 rounded-xl border border-stone-300 bg-white text-lg text-neutral-dark placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary"
              @keydown.enter="searchNow"
            />
            <button
              v-if="query"
              type="button"
              aria-label="Limpar busca"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-stone-400 hover:text-neutral-dark hover:bg-stone-100"
              @click="startNewClient"
            >
              <Icon icon="mdi:close" class="w-5 h-5" />
            </button>
          </div>
          <button
            type="button"
            class="h-14 px-8 rounded-xl bg-primary text-white text-base font-semibold hover:opacity-90 active:scale-[0.99] transition disabled:opacity-60"
            :disabled="isLoading"
            @click="searchNow"
          >
            {{ isLoading ? "Buscando..." : "Buscar" }}
          </button>
        </div>
        <p class="text-xs text-stone-500 mt-2">
          A busca começa sozinha quando o e-mail estiver completo. Você também
          pode colar o link de uma lista compartilhada.
        </p>

        <!-- Trocar de cliente com um toque -->
        <div v-if="recent.length > 0" class="mt-4">
          <p
            class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2"
          >
            Atendimentos recentes
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="item in recent"
              :key="item.query"
              type="button"
              class="min-h-12 px-4 rounded-full border border-stone-300 bg-white text-sm font-medium text-neutral-dark hover:bg-stone-50 active:bg-stone-100 transition-colors"
              @click="openRecent(item)"
            >
              {{ item.label }}
            </button>
          </div>
        </div>
      </section>

      <!-- Erro -->
      <div
        v-if="errorMessage"
        role="alert"
        class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900"
      >
        <Icon icon="mdi:alert-circle-outline" class="w-6 h-6 shrink-0 mt-0.5" />
        <p class="text-base">{{ errorMessage }}</p>
      </div>

      <!-- Carregando -->
      <div
        v-if="isLoading && !result"
        class="grid grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="n in 3"
          :key="n"
          class="h-56 rounded-2xl bg-stone-200/70 animate-pulse"
        />
      </div>

      <!-- Resultado -->
      <template v-if="result">
        <!-- Cliente -->
        <section
          class="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4"
        >
          <div
            class="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold shrink-0"
          >
            {{ result.title.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-xl font-bold text-neutral-dark truncate">
              {{ result.title }}
            </h2>
            <p class="text-sm text-stone-500 truncate">{{ result.subtitle }}</p>
            <p class="text-sm text-stone-600 mt-1">
              {{ plural(result.lists.length, "lista", "listas") }} ·
              {{ plural(totalProducts, "móvel", "móveis") }}
            </p>
          </div>
          <button
            type="button"
            class="min-h-12 px-5 rounded-xl border border-stone-300 text-sm font-semibold text-neutral-dark hover:bg-stone-50 active:bg-stone-100 transition-colors flex items-center justify-center gap-2"
            @click="startNewClient"
          >
            <Icon icon="mdi:account-switch" class="w-5 h-5" />
            Novo cliente
          </button>
        </section>

        <!-- Resumo de acabamentos e materiais -->
        <section
          class="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-6 space-y-5"
        >
          <h3 class="text-lg font-bold text-neutral-dark">
            Amostras para separar
          </h3>

          <div v-if="finishSummary.length === 0" class="text-sm text-stone-500">
            O cliente ainda não escolheu acabamentos nos móveis salvos.
          </div>

          <div v-else>
            <p
              class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3"
            >
              Cores e acabamentos escolhidos
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div
                v-for="finish in finishSummary"
                :key="finish.key"
                class="flex items-center gap-3 rounded-xl border border-stone-200 p-3"
              >
                <img
                  v-if="finish.sampleUrl"
                  :src="finish.sampleUrl"
                  :alt="`Amostra ${finish.label}`"
                  class="w-14 h-14 rounded-lg object-cover border border-stone-200 shrink-0"
                  @error="hideBrokenImage"
                />
                <span
                  v-else
                  class="w-14 h-14 rounded-lg border border-stone-300 shrink-0"
                  :style="{ backgroundColor: finish.color || '#e7e5e4' }"
                />
                <div class="min-w-0">
                  <p class="font-semibold text-neutral-dark truncate">
                    {{ finish.label }}
                  </p>
                  <p class="text-xs text-stone-500">
                    <span v-if="finish.typeLabel"
                      >{{ finish.typeLabel }} ·
                    </span>
                    {{ plural(finish.count, "móvel", "móveis") }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="materialSummary.length > 0">
            <p
              class="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3"
            >
              Materiais dos móveis
            </p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="material in materialSummary"
                :key="material.name"
                class="px-4 py-2 rounded-full bg-wood-honey/20 text-wood-dark text-sm font-semibold"
              >
                {{ material.name }} · {{ material.count }}
              </span>
            </div>
          </div>
        </section>

        <!-- Listas -->
        <section class="space-y-4">
          <div class="flex gap-2 overflow-x-auto pb-1" role="tablist">
            <button
              v-for="list in result.lists"
              :key="list.id"
              type="button"
              role="tab"
              :aria-selected="list.id === selectedListId"
              class="min-h-12 px-5 rounded-full border text-sm font-semibold whitespace-nowrap flex items-center gap-2 transition-colors"
              :class="
                list.id === selectedListId
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-neutral-dark border-stone-300 hover:bg-stone-50'
              "
              @click="selectedListId = list.id"
            >
              <Icon :icon="getListIcon(list.listType)" class="w-4 h-4" />
              {{ list.name }}
              <span class="opacity-80">({{ list.items.length }})</span>
            </button>
          </div>

          <div
            v-if="!activeList || activeList.items.length === 0"
            class="bg-white rounded-2xl border border-stone-200/90 py-14 text-center text-stone-500"
          >
            <Icon
              icon="mdi:sofa-outline"
              class="w-10 h-10 mx-auto mb-2 text-stone-300"
            />
            Esta lista ainda não tem móveis.
          </div>

          <div
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <article
              v-for="item in activeList.items"
              :key="item.id"
              class="bg-white rounded-2xl border border-stone-200/90 overflow-hidden flex flex-col"
            >
              <div class="relative aspect-[4/3] bg-stone-100">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.name"
                  class="w-full h-full object-cover"
                  @error="hideBrokenImage"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center text-stone-300"
                >
                  <Icon icon="mdi:image-outline" class="w-10 h-10" />
                </div>
              </div>

              <div class="p-4 flex flex-col gap-2 flex-1">
                <h4 class="text-base font-bold text-neutral-dark leading-snug">
                  {{ item.name }}
                </h4>
                <p class="text-lg font-semibold text-secondary">
                  {{ formatPrice(item.price) }}
                </p>

                <div
                  v-if="item.finishLabel || item.finishColor"
                  class="flex items-center gap-2"
                >
                  <span
                    v-if="item.finishColor"
                    class="w-5 h-5 rounded-full border border-stone-300 shrink-0"
                    :style="{ backgroundColor: item.finishColor }"
                  />
                  <span class="text-sm text-stone-600">
                    {{ item.finishLabel }}
                    <span v-if="variationFor(item)" class="text-stone-400">
                      · {{ VARIATION_LABEL[variationFor(item)!.variationType] }}
                    </span>
                  </span>
                </div>

                <p
                  v-if="productFor(item)?.mainMaterial"
                  class="text-xs text-stone-500"
                >
                  Material: {{ productFor(item)?.mainMaterial }}
                </p>

                <button
                  type="button"
                  class="mt-auto min-h-12 rounded-xl border border-stone-300 text-sm font-semibold text-neutral-dark hover:bg-stone-50 active:bg-stone-100 transition-colors flex items-center justify-center gap-2"
                  @click="openProduct(item)"
                >
                  Ver no site
                  <Icon icon="mdi:arrow-right" class="w-4 h-4" />
                </button>
              </div>
            </article>
          </div>
        </section>
      </template>

      <!-- Estado inicial -->
      <div
        v-else-if="!isLoading && !errorMessage"
        class="text-center py-12 text-stone-500"
      >
        <Icon
          icon="mdi:tablet-dashboard"
          class="w-12 h-12 mx-auto mb-3 text-stone-300"
        />
        <p class="text-base">
          Peça o e-mail ao cliente e digite acima para ver as listas dele.
        </p>
      </div>
    </div>
  </div>
</template>
