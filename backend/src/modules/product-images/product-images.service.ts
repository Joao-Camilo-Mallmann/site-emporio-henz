import { BadRequestError, NotFoundError } from "@/lib/errors";
import { processImage } from "@/lib/images";
import { readSingleFileUpload } from "@/lib/multipart";
import { AuthenticatedUser } from "@/lib/router";
import { isValidUuid } from "@/lib/slug";
import {
  productImagePaths,
  removeUploadFiles,
  variationSamplePath,
  writeUploadFile,
} from "@/lib/uploads";
import { VARIATION_NOT_IN_PRODUCT_MESSAGE } from "@/modules/product-images/product-images.types";
import {
  productImagesRepository,
  ProductImagesRepository,
} from "@/modules/product-images/product-images.repository";
import {
  productsService,
  ProductsService,
} from "@/modules/products/products.service";
import {
  ProductImageDto,
  ProductVariationDto,
} from "@/modules/products/products.types";

const IMAGE_NOT_FOUND_MESSAGE = "Foto não encontrada neste produto.";
const VARIATION_NOT_FOUND_MESSAGE = "Variação não encontrada neste produto.";

export class ProductImagesService {
  constructor(
    private repo: ProductImagesRepository = productImagesRepository,
    private products: ProductsService = productsService,
  ) {}

  // Ordem das checagens: autorização (sem ler o corpo) → Content-Length →
  // multipart com um arquivo → tamanho → variação → formato → processamento →
  // gravação → transação. Se o banco falhar, os arquivos da requisição são apagados.
  async uploadProductImage(
    productId: string,
    actor: AuthenticatedUser,
    req: Request,
  ): Promise<ProductImageDto> {
    const product = await this.products.assertCanManageProduct(productId, actor);

    const { file, fields } = await readSingleFileUpload(req, ["variationId"]);

    let variationId: string | null = null;
    if (fields.variationId !== undefined) {
      if (!isValidUuid(fields.variationId)) {
        throw new BadRequestError(VARIATION_NOT_IN_PRODUCT_MESSAGE);
      }
      const variation = await this.repo.findActiveVariation(
        product.id,
        fields.variationId,
      );
      if (!variation) {
        throw new BadRequestError(VARIATION_NOT_IN_PRODUCT_MESSAGE);
      }
      variationId = variation.id;
    }

    const bytes = new Uint8Array(await file.arrayBuffer());

    // processImage confere formato e tamanho pelo cabeçalho antes de decodificar.
    const [thumb, full] = await Promise.all([
      processImage(bytes, "thumb"),
      processImage(bytes, "full"),
    ]);

    const imageId = crypto.randomUUID();
    const paths = productImagePaths(product.id, imageId);

    try {
      await writeUploadFile(paths.thumbnailPath, thumb.bytes);
      await writeUploadFile(paths.fullImagePath, full.bytes);
      return await this.repo.insertImage({
        id: imageId,
        productId: product.id,
        variationId,
        thumbnailPath: paths.thumbnailPath,
        fullImagePath: paths.fullImagePath,
      });
    } catch (error) {
      await removeUploadFiles([paths.thumbnailPath, paths.fullImagePath]);
      throw error;
    }
  }

  // Soft delete da foto; os arquivos continuam no volume (PRD).
  async deleteProductImage(
    productId: string,
    imageId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.products.assertCanManageProduct(productId, actor);

    const deleted = await this.repo.softDeleteImage(productId, imageId);
    if (!deleted) {
      throw new NotFoundError(IMAGE_NOT_FOUND_MESSAGE);
    }
  }

  // Grava a amostra sempre em arquivo novo; o anterior fica no volume.
  async putVariationSample(
    productId: string,
    variationId: string,
    actor: AuthenticatedUser,
    req: Request,
  ): Promise<ProductVariationDto> {
    const product = await this.products.assertCanManageProduct(productId, actor);

    const variation = await this.repo.findActiveVariation(
      product.id,
      variationId,
    );
    if (!variation) {
      throw new NotFoundError(VARIATION_NOT_FOUND_MESSAGE);
    }

    const { file } = await readSingleFileUpload(req);
    const bytes = new Uint8Array(await file.arrayBuffer());

    const sample = await processImage(bytes, "sample");
    const samplePath = variationSamplePath(variation.id, crypto.randomUUID());
    await writeUploadFile(samplePath, sample.bytes);

    let updated: ProductVariationDto | null;
    try {
      updated = await this.repo.updateVariationSample(
        product.id,
        variation.id,
        samplePath,
      );
    } catch (error) {
      await removeUploadFiles([samplePath]);
      throw error;
    }

    if (!updated) {
      await removeUploadFiles([samplePath]);
      throw new NotFoundError(VARIATION_NOT_FOUND_MESSAGE);
    }

    return updated;
  }

  // Volta `sample_image_path` para null sem apagar o arquivo anterior.
  async deleteVariationSample(
    productId: string,
    variationId: string,
    actor: AuthenticatedUser,
  ): Promise<ProductVariationDto> {
    await this.products.assertCanManageProduct(productId, actor);

    const updated = await this.repo.updateVariationSample(
      productId,
      variationId,
      null,
    );
    if (!updated) {
      throw new NotFoundError(VARIATION_NOT_FOUND_MESSAGE);
    }

    return updated;
  }
}

export const productImagesService = new ProductImagesService();
export default productImagesService;
