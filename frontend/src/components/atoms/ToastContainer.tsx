import { useUiStore } from "@/store/uiStore";

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="c-toast-container" aria-live="polite">
      {toasts.map((t) => (
        <button
          key={t.id}
          type="button"
          className={`c-toast c-toast--${t.variant}`}
          onClick={() => dismissToast(t.id)}
        >
          {t.variant === "success" && "✅"}
          {t.variant === "error" && "⚠️"}
          {t.variant === "info" && "ℹ️"}
          <span>{t.message}</span>
        </button>
      ))}
    </div>
  );
}
