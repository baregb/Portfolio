import { ChevronDown } from "lucide-react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cx } from "./cx";

type FieldProps = {
  readonly label: string;
  readonly name: string;
  readonly id?: string;
  /** What is wrong and how to fix it. Sets `aria-invalid` and is read with the field. */
  readonly error?: string;
  readonly hint?: string;
};

const control =
  "w-full rounded-input border bg-surface px-3 py-2.5 text-[0.9375rem] text-fg " +
  "placeholder:text-muted transition-colors duration-(--duration-fast) " +
  "disabled:cursor-not-allowed disabled:opacity-60";

function FieldFrame({
  id,
  label,
  hint,
  error,
  required,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? (
          <span className="text-muted">
            {" "}
            <span aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </span>
        ) : null}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="text-sm text-muted">
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, hint?: string, error?: string): string | undefined =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;

/** A labelled single line input. The label is always visible (never only a placeholder). */
export function TextField({
  label,
  name,
  id = name,
  error,
  hint,
  className,
  ...input
}: FieldProps & Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "id">) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} required={input.required}>
      <input
        {...input}
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cx(control, error ? "border-danger" : "border-line-strong", className)}
      />
    </FieldFrame>
  );
}

/** A labelled multi line input. */
export function TextArea({
  label,
  name,
  id = name,
  error,
  hint,
  className,
  rows = 5,
  ...textarea
}: FieldProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "name" | "id">) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} required={textarea.required}>
      <textarea
        {...textarea}
        id={id}
        name={name}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={cx(
          control,
          "resize-y",
          error ? "border-danger" : "border-line-strong",
          className,
        )}
      />
    </FieldFrame>
  );
}

export type SelectOption = { readonly value: string; readonly label: string };

/** A labelled native select (spec 0004), styled like the inputs with its own chevron. */
export function SelectField({
  label,
  name,
  id = name,
  error,
  hint,
  options,
  className,
  ...select
}: FieldProps & {
  readonly options: readonly SelectOption[];
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, "name" | "id" | "children">) {
  return (
    <FieldFrame id={id} label={label} hint={hint} error={error} required={select.required}>
      <div className="relative">
        <select
          {...select}
          id={id}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={cx(
            control,
            "min-h-11 cursor-pointer appearance-none pe-10",
            error ? "border-danger" : "border-line-strong",
            className,
          )}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          strokeWidth={2}
        />
      </div>
    </FieldFrame>
  );
}
