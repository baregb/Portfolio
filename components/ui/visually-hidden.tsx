import type { ReactNode } from "react";

/** Text for screen readers only; still read aloud, never shown. */
export function VisuallyHidden({ children }: { readonly children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
