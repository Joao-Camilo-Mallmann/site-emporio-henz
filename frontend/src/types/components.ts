export type ButtonVariant = "primary" | "secondary" | "outline";
export type ButtonType = "button" | "submit" | "reset";

export interface UiButtonProps {
  variant?: ButtonVariant;
  type?: ButtonType;
  disabled?: boolean;
}

export interface UiCardProps {
  title?: string;
  description?: string;
  badge?: string;
  href?: string;
}

export interface UiFloatingButtonProps {
  icon?: string;
  href?: string;
  to?: string;
  target?: string;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
  variant?: "primary" | "secondary" | "dark" | "ghost";
  size?: "sm" | "md" | "lg";
  title?: string;
}

export interface UiFloatingActionsProps {
  whatsappNumber?: string;
  whatsappMessage?: string;
  showScrollTop?: boolean;
  showWhatsApp?: boolean;
  scrollThreshold?: number;
}

export type ModalVariant =
  "danger" | "warning" | "info" | "primary" | "success";
export type ModalMaxWidth = "sm" | "md" | "lg" | "xl" | "2xl";

export interface UiModalProps {
  open?: boolean;
  modelValue?: boolean;
  title?: string;
  description?: string;
  variant?: ModalVariant;
  icon?: string;
  showIcon?: boolean;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: ModalVariant;
  loading?: boolean;
  maxWidth?: ModalMaxWidth;
  showClose?: boolean;
  showFooter?: boolean;
  showCancel?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
}
