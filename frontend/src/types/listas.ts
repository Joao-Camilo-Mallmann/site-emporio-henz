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
