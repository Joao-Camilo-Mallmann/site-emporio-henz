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
  ariaLabel?: string;
  variant?: "whatsapp" | "primary" | "secondary" | "dark";
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
