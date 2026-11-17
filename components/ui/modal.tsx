"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cx } from "./cx";

type ModalProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly description?: string;
  /** Close when the dimmed area outside the panel is clicked. */
  readonly closeOnBackdrop?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
};

/**
 * A themed modal on the native <dialog> (AC-9). `showModal()` gives the top
 * layer, the focus trap, and Escape; we keep it controlled through `open`
 * and send focus back to whatever opened it.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  closeOnBackdrop = false,
  children,
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      openerRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
      openerRef.current?.focus();
    }
  }, [open]);

  return (
    // The backdrop click is a pointer shortcut; Escape (onCancel) is the keyboard path to the same close.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // Escape fires `cancel`; let the parent decide by closing through `open`.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
      className={cx(
        "m-auto max-h-[calc(100dvh-2rem)] w-[min(32rem,calc(100vw-2rem))] overflow-auto",
        "rounded-panel border border-line bg-surface p-0 text-fg shadow-soft",
        "backdrop:bg-fg/40 open:animate-[toast-in_var(--duration-base)_var(--ease-out)]",
        className,
      )}
    >
      <div className="grid gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <h2 id={titleId} className="text-heading font-bold">
              {title}
            </h2>
            {description ? (
              <p id={descriptionId} className="text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-m-1.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-(--duration-fast) hover:bg-accent-soft hover:text-fg"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
