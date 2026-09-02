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
