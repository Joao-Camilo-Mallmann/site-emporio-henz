import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  isUniqueViolation,
  NotFoundError,
} from "@/lib/errors";
import { AuthenticatedUser } from "@/lib/router";
import { slugify } from "@/lib/slug";
import { ROLES } from "@/middlewares/role";
import {
  productsRepository,
  ProductsRepository,
} from "@/modules/products/products.repository";
import {
  AvailabilityType,
  CreateProductDto,
  ManageableProduct,
  PaginatedProductsResult,
  ProductDetailDto,
  ProductDto,
  ProductQueryFilters,
  UpdateProductDto,
} from "@/modules/products/products.types";

const SELLER_NO_SUPPLIERS_MESSAGE =
  "Vendedor sem vínculo ativo com nenhuma empresa não possui permissão para gerenciar produtos.";
const SELLER_UNAUTHORIZED_SUPPLIER_MESSAGE =
  "Você não possui autorização para gerenciar produtos deste fornecedor.";

export class ProductsService {
  constructor(private repo: ProductsRepository = productsRepository) {}

  async listPaginated(
    filters: ProductQueryFilters = {},
    actor?: AuthenticatedUser,
  ): Promise<PaginatedProductsResult> {
    if (actor?.role === ROLES.ADMIN) {
      return await this.repo.listPaginated(filters);
    }

    if (actor?.role === ROLES.SELLER) {
      const allowedSupplierIds = await this.resolveSellerSupplierIds(actor.id);
      if (filters.supplierId !== undefined) {
        this.assertSellerOwnsSupplier(allowedSupplierIds, filters.supplierId);
      }
      return await this.repo.listPaginated({
        ...filters,
        supplierIds: allowedSupplierIds,
      });
    }

    // Visitantes anônimos e Clientes (role = 1) visualizam apenas produtos ativos
    return await this.repo.listPaginated({
      ...filters,
      active: true,
    });
  }

  async getById(
    id: string,
    actor?: AuthenticatedUser,
  ): Promise<ProductDetailDto> {
    if (actor?.role === ROLES.SELLER) {
      const allowedSupplierIds = await this.resolveSellerSupplierIds(actor.id);
      const product = await this.repo.findDetailById(id);
      if (!product) {
        throw new NotFoundError("Produto não encontrado.");
      }
      this.assertSellerOwnsSupplier(allowedSupplierIds, product.supplierId);
      return product;
    }

    const product = await this.repo.findDetailById(id);
    if (!product) {
      throw new NotFoundError("Produto não encontrado.");
    }

    if (actor?.role !== ROLES.ADMIN && !product.active) {
      throw new NotFoundError("Produto não encontrado.");
    }

    return product;
  }

  async createProduct(
    dto: CreateProductDto,
    actor: AuthenticatedUser,
  ): Promise<ProductDetailDto> {
    if (actor.role === ROLES.SELLER) {
      const allowedSupplierIds = await this.resolveSellerSupplierIds(actor.id);
      this.assertSellerOwnsSupplier(allowedSupplierIds, dto.supplierId);
    }

    await this.validateCatalogReferences(
      dto.categoryId,
      dto.subtypeId ?? null,
      dto.supplierId,
    );

    const slug = dto.slug || slugify(dto.name);
    const slugExists = await this.repo.existsProductSlugActive(slug);
    if (slugExists) {
      throw this.slugConflict(slug);
    }

    const normalizedEstimatedDays =
      dto.availabilityType === "IN_STOCK" ? 0 : dto.estimatedDays;

    try {
      return await this.repo.createProduct({
        ...dto,
        slug,
        estimatedDays: normalizedEstimatedDays,
      });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw this.slugConflict(slug);
      }
      throw error;
    }
  }

  async updateProduct(
    id: string,
    dto: UpdateProductDto,
    actor: AuthenticatedUser,
  ): Promise<ProductDetailDto> {
    const { allowedSupplierIds } = await this.authorizeProductWrite(id, actor);
    // O PUT mescla com os valores atuais, então precisa do produto completo.
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError("Produto não encontrado.");
    }

    // Vendedor só transfere o produto para outro fornecedor ao qual está vinculado.
    if (
      allowedSupplierIds &&
      dto.supplierId !== undefined &&
      dto.supplierId !== existing.supplierId
    ) {
      this.assertSellerOwnsSupplier(allowedSupplierIds, dto.supplierId);
    }

    const effectiveAvailability =
      dto.availabilityType ?? (existing.availabilityType as AvailabilityType);
    let effectiveEstimatedDays =
      dto.estimatedDays !== undefined
        ? dto.estimatedDays
        : existing.estimatedDays;

    if (effectiveAvailability === "IN_STOCK") {
      effectiveEstimatedDays = 0;
    } else if (
      effectiveAvailability === "ON_DEMAND" &&
      (!Number.isInteger(effectiveEstimatedDays) || effectiveEstimatedDays < 1)
    ) {
      throw new BadRequestError(
        "Para produtos sob encomenda (ON_DEMAND), o prazo estimado (estimatedDays) é obrigatório e deve ser um inteiro maior ou igual a 1.",
      );
    }

    const effectiveCategoryId = dto.categoryId ?? existing.categoryId;
    const effectiveSubtypeId =
      dto.subtypeId !== undefined ? dto.subtypeId : existing.subtypeId;
    const effectiveSupplierId = dto.supplierId ?? existing.supplierId;

    if (
      dto.categoryId !== undefined ||
      dto.subtypeId !== undefined ||
      dto.supplierId !== undefined
    ) {
      if (!effectiveSupplierId) {
        throw new BadRequestError("O campo supplierId é obrigatório.");
      }
      await this.validateCatalogReferences(
        effectiveCategoryId,
        effectiveSubtypeId,
        effectiveSupplierId,
      );
    }

    if (dto.slug) {
      const slugExists = await this.repo.existsProductSlugActive(dto.slug, id);
      if (slugExists) {
        throw this.slugConflict(dto.slug);
      }
    }

    let updated: ProductDetailDto | null;
    try {
      updated = await this.repo.updateProduct(id, {
        ...dto,
        availabilityType: effectiveAvailability,
        estimatedDays: effectiveEstimatedDays,
      });
    } catch (error) {
      if (dto.slug && isUniqueViolation(error)) {
        throw this.slugConflict(dto.slug);
      }
      throw error;
    }

    if (!updated) {
      throw new NotFoundError("Produto não encontrado.");
    }

    return updated;
  }

  async deleteProduct(id: string, actor: AuthenticatedUser): Promise<void> {
    await this.assertCanManageProduct(id, actor);
    await this.repo.softDeleteProductWithCascade(id);
  }

  // Regra única de escrita em produto (RNF09), compartilhada por PUT, DELETE e
  // pelas rotas de imagem: Admin opera qualquer produto; Vendedor só os de
  // fornecedores com vínculo ativo. Lança 403 (E1) para Vendedor sem vínculo,
  // 404 para produto inexistente ou desativado e 403 (E2/E3) fora do escopo.
  // Não lê corpo de requisição, então pode rodar antes de qualquer upload.
  async assertCanManageProduct(
    productId: string,
    actor: AuthenticatedUser,
  ): Promise<ManageableProduct> {
    const { product } = await this.authorizeProductWrite(productId, actor);
    return product;
  }

  // Devolve também os fornecedores do Vendedor (undefined para Admin), para quem
  // precisar checar outro fornecedor sem consultar user_suppliers de novo.
  private async authorizeProductWrite(
    productId: string,
    actor: AuthenticatedUser,
  ): Promise<{ product: ManageableProduct; allowedSupplierIds?: string[] }> {
    let allowedSupplierIds: string[] | undefined;
    if (actor.role === ROLES.SELLER) {
      allowedSupplierIds = await this.resolveSellerSupplierIds(actor.id);
    }

    const existing = await this.repo.findManageableById(productId);
    if (!existing) {
      throw new NotFoundError("Produto não encontrado.");
    }

    if (actor.role === ROLES.SELLER && allowedSupplierIds) {
      this.assertSellerOwnsSupplier(allowedSupplierIds, existing.supplierId);
    }

    return { product: existing, allowedSupplierIds };
  }

  async getRecommendations(productId: string): Promise<ProductDto[]> {
    const product = await this.repo.findById(productId);
    if (!product) {
      throw new NotFoundError("Produto não encontrado.");
    }

    return await this.repo.findRecommendations(
      productId,
      product.categoryId,
      4,
    );
  }

  private async resolveSellerSupplierIds(userId: string): Promise<string[]> {
    const supplierIds = await this.repo.findActiveSupplierIdsByUserId(userId);
    if (supplierIds.length === 0) {
      throw new ForbiddenError(SELLER_NO_SUPPLIERS_MESSAGE);
    }
    return supplierIds;
  }

  private assertSellerOwnsSupplier(
    allowedSupplierIds: string[],
    targetSupplierId: string | null | undefined,
  ): void {
    if (!targetSupplierId || !allowedSupplierIds.includes(targetSupplierId)) {
      throw new ForbiddenError(SELLER_UNAUTHORIZED_SUPPLIER_MESSAGE);
    }
  }

  private async validateCatalogReferences(
    categoryId: string,
    subtypeId: string | null,
    supplierId: string,
  ): Promise<void> {
    const categoryExists = await this.repo.existsActiveCategory(categoryId);
    if (!categoryExists) {
      throw new BadRequestError(
        "A categoria informada não existe ou foi removida.",
      );
    }

    if (subtypeId) {
      const subtypeCategoryId =
        await this.repo.findActiveSubtypeCategoryId(subtypeId);
      if (!subtypeCategoryId) {
        throw new BadRequestError(
          "O subtipo informado não existe ou foi removido.",
        );
      }
      if (subtypeCategoryId !== categoryId) {
        throw new BadRequestError(
          "O subtipo informado não pertence à categoria selecionada.",
        );
      }
    }

    const supplierExists = await this.repo.existsActiveSupplier(supplierId);
    if (!supplierExists) {
      throw new BadRequestError(
        "O fornecedor informado não existe ou foi removido.",
      );
    }
  }

  private slugConflict(slug: string): ConflictError {
    return new ConflictError(
      `Já existe um produto ativo com o slug '${slug}'.`,
    );
  }
}

export const productsService = new ProductsService();
export default productsService;
