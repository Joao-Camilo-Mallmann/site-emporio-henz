import {
  toast,
  type Content,
  type Id,
  type ToastContainerOptions,
  type ToastOptions,
} from "vue3-toastify";

export function useToast() {
  const success = (content: Content, options?: ToastOptions) =>
    toast.success(content, options);

  const error = (content: Content, options?: ToastOptions) =>
    toast.error(content, options);

  const warning = (content: Content, options?: ToastOptions) =>
    toast.warning(content, options);

  const info = (content: Content, options?: ToastOptions) =>
    toast.info(content, options);

  const clear = (toastId?: Id) => {
    if (toastId !== undefined) {
      toast.remove(toastId);
    } else {
      toast.clearAll();
    }
  };

  return {
    toast,
    success,
    error,
    warning,
    info,
    clear,
  };
}

export { toast, type Content, type Id, type ToastContainerOptions, type ToastOptions };
