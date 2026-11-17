import type { ReactNode } from "react";

/** A dashed hairline label for a status, such as "Available on request". */
export function Badge({ children }: { readonly children: ReactNode }) {
  return (
    <span className="inline-flex items-center border border-dashed border-line-strong px-2 py-0.5 label text-muted">
      {children}
    </span>
  );
}
