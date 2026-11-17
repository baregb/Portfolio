"use client";

import Link from "next/link";
import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from "react";
import { cx } from "./cx";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "line" | "onAccent";
export type ButtonSize = "sm" | "md";

type CommonProps = {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly iconStart?: ReactNode;
  readonly iconEnd?: ReactNode;
  readonly className?: string;
  readonly children: ReactNode;
};

type LinkProps = CommonProps & {
  readonly href: string;
  readonly external?: boolean;
  readonly disabled?: boolean;
};

type NativeButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    readonly href?: undefined;
    readonly pending?: boolean;
  };

export type ButtonProps = LinkProps | NativeButtonProps;

// Controls are round (D); the square mono `line` variant is for quiet actions
// that sit inside content boxes (B), like "Request details".
const VARIANTS: Readonly<Record<ButtonVariant, string>> = {
  primary: "rounded-full bg-accent text-accent-ink hover:brightness-110",
  secondary:
    "rounded-full border border-line bg-surface text-fg shadow-soft hover:border-line-strong",
  ghost: "rounded-full text-fg hover:bg-accent-soft",
  line: "rounded-input border border-line-strong font-mono text-[0.8125rem] text-fg hover:bg-accent-soft",
  onAccent: "rounded-full bg-block-ink text-block hover:brightness-95",
};

const SIZES: Readonly<Record<ButtonSize, string>> = {
  sm: "min-h-9 gap-1.5 px-3.5 text-sm",
  md: "min-h-11 gap-2 px-5 text-[0.9375rem]",
};

const base =
  "inline-flex select-none items-center justify-center font-medium whitespace-nowrap " +
  "transition-[filter,background-color,border-color,transform] duration-(--duration-fast) ease-out " +
  "active:translate-y-px";

const disabledLook = "cursor-not-allowed opacity-55 hover:brightness-100 active:translate-y-0";

/** A button, or a link styled as one when given `href`. */
export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", iconStart, iconEnd, className, children } = props;
  const classes = cx(base, VARIANTS[variant], SIZES[size], className);
  const content = (
    <>
      {iconStart}
      {children}
      {iconEnd}
    </>
  );

  if (props.href !== undefined) {
    const { href, external, disabled } = props;
    // A disabled link is plain text, never a dead link (spec 0003).
    if (disabled) {
      return (
        <span aria-disabled="true" className={cx(classes, disabledLook)}>
          {content}
        </span>
      );
    }
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
          {content}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  const {
    variant: _variant,
    size: _size,
    iconStart: _iconStart,
    iconEnd: _iconEnd,
    className: _className,
    children: _children,
    href: _href,
    pending = false,
    disabled = false,
    type = "button",
    onClick,
    ...rest
  } = props;

  // Pending keeps focus on the button (no `disabled`), but ignores clicks (AC-11).
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (pending) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      aria-busy={pending || undefined}
      aria-disabled={pending || undefined}
      onClick={handleClick}
      className={cx(classes, (disabled || pending) && disabledLook, pending && "cursor-progress")}
    >
      {pending ? <Spinner className="size-4" /> : iconStart}
      {children}
      {iconEnd}
    </button>
  );
}
