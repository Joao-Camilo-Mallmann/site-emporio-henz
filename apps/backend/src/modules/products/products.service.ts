import { NotFoundError } from "@/lib/errors";
import {
  productsRepository,
  ProductsRepository,
} from "@/modules/products/products.repository";
import { ProductDto } from "@/modules/products/products.types";

export class ProductsService {
  constructor(private repo: ProductsRepository = productsRepository) {}

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
}

export const productsService = new ProductsService();
export default productsService;
