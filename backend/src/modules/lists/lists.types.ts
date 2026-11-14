export type SystemListType = "FAVORITES" | "WISHLIST" | "GIFT_LIST";
export type ListType = SystemListType | "CUSTOM";

// As 3 listas padrão que todo cliente recebe (RF08), na ordem de exibição
export const SYSTEM_LISTS: { name: string; listType: SystemListType }[] = [
  { name: "Favoritos", listType: "FAVORITES" },
  { name: "Lista de Desejos", listType: "WISHLIST" },
  { name: "Lista de Presentes", listType: "GIFT_LIST" },
];

export interface ListDto {
  id: string;
  name: string;
  listType: ListType;
  isSystem: boolean;
  shareSlug: string;
  isPublic: boolean;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListItemDto {
  id: string;
  productId: string;
  productSlug: string | null;
  variationId: string | null;
  name: string;
  price: number;
  image: string;
  finishLabel: string | null;
  finishColor: string | null;
  addedAt: string;
}

export interface ListWithItemsDto extends ListDto {
  items: ListItemDto[];
}

// Visão pública do link compartilhado: nada que identifique o dono da lista
export interface SharedListDto {
  name: string;
  listType: ListType;
  itemsCount: number;
  items: ListItemDto[];
}

export interface SharedListRef {
  id: string;
  name: string;
  listType: ListType;
}

// Criar e renomear usam o mesmo payload
export interface ListNameDto {
  name: string;
}

export interface AddListItemDto {
  productId: string;
  productSlug?: string;
  variationId?: string;
  name: string;
  price: number;
  image: string;
  finishLabel?: string;
  finishColor?: string;
}

export interface AddListItemResult {
  item: ListItemDto;
  created: boolean;
}
