"use client";

import { CircleAlert, CircleCheck, Info, X, type LucideIcon } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cx } from "./cx";

export type ToastKind = "success" | "error" | "info";

export type ToastInput = {
  readonly kind: ToastKind;
  readonly title: string;
  readonly description?: string;
};

type Toast = ToastInput & { readonly id: string };

type ToastApi = {
  readonly toast: (input: ToastInput) => string;
  readonly dismiss: (id: string) => void;
};

// AC-10 limits.
const MAX_VISIBLE = 3;
const AUTO_CLOSE_MS = 5000;

const ToastContext = createContext<ToastApi | null>(null);

/** Shows a toast. Needs `Toaster` mounted once, in the root layout. */
export const useToast = (): ToastApi => {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast needs <Toaster> above it (mount it in app/layout.tsx).");
  return api;
};

const KINDS: Readonly<Record<ToastKind, { readonly icon: LucideIcon; readonly classes: string }>> =
  {
    success: { icon: CircleCheck, classes: "bg-surface [&_svg.kind]:text-accent" },
    info: { icon: Info, classes: "bg-surface [&_svg.kind]:text-muted" },
    error: { icon: CircleAlert, classes: "bg-danger-soft [&_svg.kind]:text-danger" },
  };

function ToastItem({
  toast,
  onDismiss,
}: {
  readonly toast: Toast;
  readonly onDismiss: () => void;
}) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(AUTO_CLOSE_MS);
  const autoClose = toast.kind !== "error"; // errors stay until dismissed

  useEffect(() => {
    if (!autoClose || paused) return;
    const startedAt = Date.now();
    const timer = window.setTimeout(onDismiss, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - startedAt;
    };
  }, [autoClose, paused, onDismiss]);

  const { icon: KindIcon, classes } = KINDS[toast.kind];

  return (
    <li
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      className={cx(
        "pointer-events-auto grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3",
        "rounded-panel border border-line p-3.5 shadow-soft",
        "animate-[toast-in_var(--duration-base)_var(--ease-out)]",
        classes,
      )}
    >
      <KindIcon aria-hidden="true" className="kind mt-0.5 size-5" strokeWidth={2} />
      <div className="grid gap-0.5">
        <p className="text-sm font-semibold">{toast.title}</p>
        {toast.description ? <p className="text-sm text-muted">{toast.description}</p> : null}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={`Dismiss: ${toast.title}`}
        className="-m-1.5 inline-flex size-9 items-center justify-center rounded-full text-muted transition-colors duration-(--duration-fast) hover:bg-accent-soft hover:text-fg"
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </li>
  );
}

function ToastList({
  toasts,
  onDismiss,
  role,
}: {
  readonly toasts: readonly Toast[];
  readonly onDismiss: (id: string) => void;
  readonly role: "status" | "alert";
}) {
  // The live region exists before any toast arrives, so screen readers hear the first one.
  return (
    <div role={role} aria-live={role === "alert" ? "assertive" : "polite"}>
      <ol className="flex flex-col gap-2.5 empty:hidden">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
        ))}
      </ol>
    </div>
  );
}

/** Provides `useToast` and draws the toast stack. Wrap the app with it once. */
export function Toaster({ children }: { readonly children: ReactNode }) {
  const [toasts, setToasts] = useState<readonly Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    nextId.current += 1;
    const id = `toast-${nextId.current}`;
    // Oldest leave first once more than three would show.
    setToasts((current) => [...current, { ...input, id }].slice(-MAX_VISIBLE));
    return id;
  }, []);

  const api = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <section
        aria-label="Notifications"
        className={cx(
          "pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col gap-2.5 p-4",
          "pb-[max(1rem,env(safe-area-inset-bottom))] sm:left-auto sm:w-[24rem]",
        )}
      >
        <ToastList
          role="status"
          toasts={toasts.filter((t) => t.kind !== "error")}
          onDismiss={dismiss}
        />
        <ToastList
          role="alert"
          toasts={toasts.filter((t) => t.kind === "error")}
          onDismiss={dismiss}
        />
      </section>
    </ToastContext.Provider>
  );
}
