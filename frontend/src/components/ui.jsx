import { localizeNode, useLocale } from "../context/LocaleContext";

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-surface border border-border rounded-lg ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  const { t } = useLocale();
  return (
    <div className="mb-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="break-words text-2xl text-ink">{t(title)}</h1>
        {subtitle && <p className="mt-1 break-words text-ink-secondary">{t(subtitle)}</p>}
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{action}</div>}
    </div>
  );
}

export function Button({ as: Component = "button", children, variant = "primary", className = "", ...props }) {
  const { t } = useLocale();
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    secondary: "bg-white text-ink border border-border hover:bg-bg",
    danger: "bg-danger text-white hover:opacity-90",
    ghost: "text-ink-secondary hover:bg-bg",
  };
  return (
    <Component
      className={`inline-flex items-center gap-2 px-4 py-2 rounded font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {localizeNode(children, t)}
    </Component>
  );
}

export function Input({ label, error, className = "", ...props }) {
  const { t } = useLocale();
  return (
    <label className="block">
      {label && <span className="block text-sm text-ink-secondary mb-1">{t(label)}</span>}
      <input
        className={`w-full border rounded px-3 py-2 text-sm bg-white focus:border-primary ${
          error ? "border-danger" : "border-border"
        } ${className}`}
        {...props}
        placeholder={t(props.placeholder)}
      />
      {error && <span className="block text-xs text-danger mt-1">{t(error)}</span>}
    </label>
  );
}

export function Select({ label, error, children, className = "", ...props }) {
  const { t } = useLocale();
  return (
    <label className="block">
      {label && <span className="block text-sm text-ink-secondary mb-1">{t(label)}</span>}
      <select
        className={`w-full border rounded px-3 py-2 text-sm bg-white focus:border-primary ${
          error ? "border-danger" : "border-border"
        } ${className}`}
        {...props}
      >
        {localizeNode(children, t)}
      </select>
      {error && <span className="block text-xs text-danger mt-1">{t(error)}</span>}
    </label>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-bg text-ink-secondary border-border",
    success: "bg-success-light text-success border-success/20",
    warning: "bg-warning-light text-warning border-warning/20",
    danger: "bg-danger-light text-danger border-danger/20",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  const { t } = useLocale();
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && <Icon className="w-10 h-10 text-ink-muted mb-3" strokeWidth={1.5} />}
      <p className="text-ink font-medium">{t(title)}</p>
      {description && <p className="text-ink-secondary text-sm mt-1 max-w-sm">{t(description)}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  const { t } = useLocale();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-3 sm:p-4">
      <div className="max-h-[90vh] supports-[height:100dvh]:max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-lg bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
          <h2 className="min-w-0 break-words text-lg text-ink">{t(title)}</h2>
          <button onClick={onClose} className="text-ink-secondary hover:text-ink text-xl leading-none" aria-label={t("Close")}>
            &times;
          </button>
        </div>
        <div className="p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

export function statusTone(status) {
  const map = {
    confirmed: "success", attended: "success", paid: "success", completed: "success", approved: "success",
    pending: "warning", partially_paid: "warning", in_progress: "warning", proposed: "warning", submitted: "warning",
    cancelled: "danger", unpaid: "danger", rejected: "danger",
  };
  return map[status] || "neutral";
}
