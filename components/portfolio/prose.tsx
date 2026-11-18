import { MDXContent } from "@content-collections/mdx/react";
import type { ComponentPropsWithoutRef } from "react";
import { cx } from "@/components/ui/cx";
import { TextLink } from "@/components/ui/text-link";

// Compiled MDX (case study sections, the about body) drawn with tokens only
// (spec 0004). No typography plugin: each element gets its own small style.
// Server components only; the MDX was compiled at build.

type Props<T extends keyof React.JSX.IntrinsicElements> = ComponentPropsWithoutRef<T>;

const components = {
  h2: ({ className, children, ...props }: Props<"h2">) => (
    <h2 className={cx("mt-10 text-heading font-bold first:mt-0", className)} {...props}>
      {children}
    </h2>
  ),
  h3: ({ className, children, ...props }: Props<"h3">) => (
    <h3 className={cx("mt-8 text-subheading font-bold first:mt-0", className)} {...props}>
      {children}
    </h3>
  ),
  h4: ({ className, children, ...props }: Props<"h4">) => (
    <h4 className={cx("mt-6 font-display text-lg font-bold first:mt-0", className)} {...props}>
      {children}
    </h4>
  ),
  p: ({ className, ...props }: Props<"p">) => (
    <p className={cx("mt-4 first:mt-0", className)} {...props} />
  ),
  ul: ({ className, ...props }: Props<"ul">) => (
    <ul
      className={cx("mt-4 grid list-disc gap-2 ps-5 marker:text-accent first:mt-0", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }: Props<"ol">) => (
    <ol
      className={cx(
        "mt-4 grid list-decimal gap-2 ps-5 marker:font-mono marker:text-accent first:mt-0",
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }: Props<"li">) => <li className={cx("ps-1", className)} {...props} />,
  a: ({ href = "", children }: Props<"a">) => (
    <TextLink href={href} external={href.startsWith("https:")}>
      {children}
    </TextLink>
  ),
  strong: ({ className, ...props }: Props<"strong">) => (
    <strong className={cx("font-semibold text-fg", className)} {...props} />
  ),
  em: ({ className, ...props }: Props<"em">) => (
    <em className={cx("italic", className)} {...props} />
  ),
  code: ({ className, ...props }: Props<"code">) => (
    <code
      className={cx(
        "border border-line bg-surface px-1 py-px font-mono text-[0.875em] [pre_&]:border-0 [pre_&]:p-0",
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }: Props<"pre">) => (
    <pre
      className={cx(
        "mt-4 overflow-x-auto border border-line bg-surface p-4 font-mono text-sm first:mt-0",
        className,
      )}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }: Props<"blockquote">) => (
    <blockquote
      className={cx("mt-4 border-s-2 border-accent ps-4 text-muted first:mt-0", className)}
      {...props}
    />
  ),
  hr: ({ className, ...props }: Props<"hr">) => (
    <hr className={cx("my-8 border-line", className)} {...props} />
  ),
  table: ({ className, ...props }: Props<"table">) => (
    <div className="mt-4 overflow-x-auto first:mt-0">
      <table className={cx("w-full border-collapse text-sm", className)} {...props} />
    </div>
  ),
  th: ({ className, ...props }: Props<"th">) => (
    <th
      className={cx(
        "border-b border-line-strong px-3 py-2 text-start font-mono text-xs font-medium tracking-wide text-muted uppercase",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }: Props<"td">) => (
    <td className={cx("border-b border-line px-3 py-2 align-top", className)} {...props} />
  ),
};

/** Renders a compiled MDX section as readable prose, at most `max-w-prose` wide. */
export function Prose({ code, className }: { readonly code: string; readonly className?: string }) {
  return (
    <div className={cx("max-w-prose text-[1.0625rem] leading-relaxed", className)}>
      <MDXContent code={code} components={components} />
    </div>
  );
}
