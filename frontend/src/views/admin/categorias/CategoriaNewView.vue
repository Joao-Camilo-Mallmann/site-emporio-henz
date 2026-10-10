<script setup lang="ts">
import { categoriasApi } from "@/api";
import { useToast } from "@/composables/useToast";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
  SubtypeDraftItem,
} from "@/types";
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import CategoriaForm from "./CategoriaForm.vue";

const router = useRouter();
const toast = useToast();

const saving = ref(false);
const errorMessage = ref<string | null>(null);

async function handleCreate(
  payload: CategoryCreateInput | CategoryUpdateInput,
  draftSubtypes?: SubtypeDraftItem[],
) {
  saving.value = true;
  errorMessage.value = null;

  try {
    const createdCategory = await categoriasApi.criar(
      payload as CategoryCreateInput,
    );

    if (draftSubtypes && draftSubtypes.length > 0) {
      let createdCount = 0;
      for (const draft of draftSubtypes) {
        try {
          await categoriasApi.criarSubtipo({
            categoryId: createdCategory.id,
            name: draft.name,
            slug: draft.slug || undefined,
            active: draft.active,
          });
          createdCount++;
        } catch (subErr) {
          console.error(`Erro ao criar subtipo "${draft.name}":`, subErr);
        }
      }

      if (createdCount === draftSubtypes.length) {
        toast.success(
          `Categoria e ${createdCount} subtipo(s) cadastrados com sucesso!`,
        );
      } else {
        toast.warning(
          `Categoria criada com sucesso, mas apenas ${createdCount} de ${draftSubtypes.length} subtipos foram cadastrados.`,
        );
      }
    } else {
      toast.success("Categoria cadastrada com sucesso!");
    }

    router.push("/admin/categorias");
  } catch (err: unknown) {
    const errorObj = err as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    errorMessage.value =
      errorObj.response?.data?.message ||
      errorObj.message ||
      "Ocorreu um erro ao cadastrar a categoria.";
  } finally {
    saving.value = false;
  }
}

function handleCancel() {
  router.push("/admin/categorias");
}
</script>

<template>
  <div class="min-h-[calc(100vh-14rem)] bg-stone-50/70 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-2xl mx-auto space-y-6">
      <!-- Breadcrumbs e Cabeçalho Limpo -->
      <div>
        <div class="flex items-center gap-1.5 text-xs text-stone-500 mb-2">
          <RouterLink to="/admin" class="hover:text-neutral-dark transition-colors">
            Painel
          </RouterLink>
          <span>/</span>
          <RouterLink to="/admin/categorias" class="hover:text-neutral-dark transition-colors">
            Categorias
          </RouterLink>
          <span>/</span>
          <span class="text-neutral-dark font-medium">Nova Categoria</span>
        </div>

        <h1 class="text-2xl font-bold text-neutral-dark tracking-tight">
          Nova Categoria
        </h1>
        <p class="text-sm text-stone-500 mt-0.5">
          Cadastre uma nova categoria de ambiente no acervo da loja e vincule suas subcategorias
        </p>
      </div>

      <!-- Container do Formulário -->
      <div class="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <CategoriaForm
          :loading="saving"
          :error-message="errorMessage"
          @submit="handleCreate"
          @cancel="handleCancel"
        />
      </div>
    </div>
  </div>
</template>
