import { LoaderCircle } from "lucide-react";
import { cx } from "./cx";

/** A spinning loader. Decorative: the control it sits in announces the busy state. */
export function Spinner({ className }: { readonly className?: string }) {
  return (
    <LoaderCircle
      aria-hidden="true"
      className={cx("shrink-0 animate-[spin_0.8s_linear_infinite]", className)}
      strokeWidth={2.25}
    />
  );
}
