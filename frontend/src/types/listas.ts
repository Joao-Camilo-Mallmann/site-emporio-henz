export type SystemListType = "FAVORITES" | "WISHLIST" | "GIFT_LIST";
export type ListType = SystemListType | "CUSTOM";

export interface SavedItem {
  id: string;
  productId: string;
  productSlug?: string;
  name: string;
  price: number;
  image: string;
  finishLabel?: string;
  finishColor?: string;
  addedAt: string;
}

export interface UserList {
  id: string;
  name: string;
  isSystem: boolean;
  listType: ListType;
  shareSlug: string;
  createdAt: string;
  items: SavedItem[];
}

export interface SaveProductPayload {
  productId: string;
  productSlug?: string;
  name: string;
  price: number;
  image: string;
  finishLabel?: string;
  finishColor?: string;
  listIds: string[];
}

export interface CreateListPayload {
  name: string;
}

// Formatos devolvidos pela API de listas (`/api/v1/listas`)
export interface ApiListItem {
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

export interface ApiList {
  id: string;
  name: string;
  listType: ListType;
  isSystem: boolean;
  shareSlug: string;
  isPublic: boolean;
  itemsCount: number;
  createdAt: string;
  updatedAt: string;
  items?: ApiListItem[];
}

export interface ApiSharedList {
  name: string;
  listType: ListType;
  itemsCount: number;
  items: ApiListItem[];
}

export interface AddListItemPayload {
  productId: string;
  productSlug?: string;
  name: string;
  price: number;
  image: string;
  finishLabel?: string;
  finishColor?: string;
}

// Lista aberta pelo link público (somente leitura, sem dados do dono)
export interface SharedList {
  name: string;
  listType: ListType;
  items: SavedItem[];
}
