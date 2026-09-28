export interface ProductDto {
  id: string;
  categoryId: string;
  subtypeId: string | null;
  supplierId: string | null;
  name: string;
  slug: string;
  collectionLine: string | null;
  mainMaterial: string | null;
  referencePrice: number;
  maxInstallments: number;
  availabilityType: string;
  estimatedDays: number;
  heightMm: number | null;
  widthMm: number | null;
  depthMm: number | null;
  description: string | null;
  specifications: Record<string, unknown>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
