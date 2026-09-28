export interface UserSupplierLinkDto {
  id: string;
  userId: string;
  supplierId: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AssignedSupplierDto {
  id: string;
  name: string;
  contact: string | null;
  active: boolean;
  linkedAt: string;
}

export interface AssignSupplierDto {
  supplierId: string;
}
