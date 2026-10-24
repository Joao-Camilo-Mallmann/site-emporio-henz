export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "danger" | "link" | "custom";
export type ButtonType = "button" | "submit" | "reset";

export type UiButtonProps = {
  variant?: ButtonVariant;
  type?: ButtonType;
  disabled?: boolean;
  loading?: boolean;
  block?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "icon" | "none";
};

export interface UiCardProps {
  title?: string;
  description?: string;
  badge?: string;
  href?: string;
}

export interface UiPaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  itemLabel?: string;
  disabled?: boolean;
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
export type ModalMaxWidth =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "full";

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

/** Valor aceito por `<UiSelect>`; o `<option>` mantém o tipo original no `v-model`. */
export type UiSelectValue = string | number | boolean | null;

export interface UiSelectOption {
  value: UiSelectValue;
  label: string;
  disabled?: boolean;
}

export interface UiSelectProps {
  /** Opções; sem elas, o slot padrão recebe `<option>` e `<optgroup>` livres. */
  options?: readonly UiSelectOption[];
  /** Primeira opção, com `placeholderValue` (ex.: "Todas as categorias"). */
  placeholder?: string;
  placeholderValue?: UiSelectValue;
  /** Deixa o placeholder desabilitado, para obrigar uma escolha. */
  placeholderDisabled?: boolean;
  id?: string;
  name?: string;
  /** Rótulo visível acima do campo. Sem ele, informe `ariaLabel`. */
  label?: string;
  ariaLabel?: string;
  hint?: string;
  /** Mensagem de erro: borda vermelha, `aria-invalid` e texto abaixo do campo. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
  /** Largura total (padrão). Use `false` em barras de filtro. */
  block?: boolean;
}
