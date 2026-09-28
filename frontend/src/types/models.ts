export interface ProductDimensions {
  width: number;
  height: number;
  depth: number;
  unit: "cm" | "mm";
}

export interface IProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  material: string;
  dimensions?: ProductDimensions;
  price?: number;
  isAvailable: boolean;
  images: string[];
}

export interface ProductFilterParams {
  category?: string;
  search?: string;
  availableOnly?: boolean;
}

export interface ProductCreateInput {
  name: string;
  description: string;
  category: string;
  material: string;
  dimensions?: ProductDimensions;
  price?: number;
  isAvailable: boolean;
  images?: string[];
}

export class Product implements IProduct {
  id: string;
  name: string;
  description: string;
  category: string;
  material: string;
  dimensions?: ProductDimensions;
  price?: number;
  isAvailable: boolean;
  images: string[];

  constructor(data: IProduct) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.category = data.category;
    this.material = data.material;
    this.dimensions = data.dimensions;
    this.price = data.price;
    this.isAvailable = data.isAvailable;
    this.images = data.images ?? [];
  }

  get formattedPrice(): string {
    if (this.price === undefined || this.price === null) return "Sob consulta";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(this.price);
  }

  get formattedDimensions(): string {
    if (!this.dimensions) return "Sob medida";
    return `${this.dimensions.width}x${this.dimensions.height}x${this.dimensions.depth} ${this.dimensions.unit}`;
  }
}
