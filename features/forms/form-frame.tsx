"use client";

import { CircleCheck } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { SelectField, TextArea, TextField, type SelectOption } from "@/components/ui/text-field";
import { TextLink } from "@/components/ui/text-link";
import { CLIENT_TIMEOUT_MS, fieldErrors, HONEYPOT_FIELD, RETENTION_LINE } from "./schema";
import { FAILURE_MESSAGES, outcomeOf, type Failure } from "./submission";
import { TurnstileWidget, type TurnstileHandle } from "./turnstile-widget";

// Spec 0005: the frame both forms share. Validates in the browser with the
// same schema the Worker uses (AC-3), runs Turnstile on submit (AC-4), posts
// to the relative `/api/...` path, and shows the confirmation (AC-4) or a
// failure that keeps every typed value (AC-10). Hidden without JavaScript,
// with a line pointing to the links instead (AC-11).

export type FieldDef = {
  readonly name: string;
  readonly label: string;
  readonly control: "input" | "textarea" | "select";
  readonly type?: "text" | "email";
  readonly autoComplete?: string;
  readonly hint?: string;
  readonly rows?: number;
  readonly options?: readonly SelectOption[];
};

type Status =
  | { readonly kind: "idle" }
  | { readonly kind: "submitting" }
  | { readonly kind: "failed"; readonly failure: Failure }
  | { readonly kind: "sent"; readonly name: string; readonly email: string };

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/** A fixed starting state, for showing each state on `/styleguide` only. */
export type FormDemo = "errors" | "pending" | "failed" | "sent";

const demoStatus = (demo: FormDemo | undefined): Status => {
  if (demo === "pending") return { kind: "submitting" };
  if (demo === "failed") return { kind: "failed", failure: "generic" };
  if (demo === "sent") return { kind: "sent", name: "Jane", email: "jane@company.com" };
  return { kind: "idle" };
};

export function FormFrame({
  heading,
  submitLabel,
  sentHeading,
  endpoint,
  fields,
  schema,
  extra = {},
  linkedinUrl,
  headingLevel = "h2",
  demo,
  prefill,
}: {
  readonly heading: string;
  readonly submitLabel: string;
  readonly sentHeading: string;
  readonly endpoint: "/api/contact" | "/api/request";
  readonly fields: readonly FieldDef[];
  readonly schema: z.ZodType<{ readonly name: string; readonly email: string }>;
  /** Values the page supplies, such as the project slug. */
  readonly extra?: Readonly<Record<string, string>>;
  readonly linkedinUrl?: string;
  /** `h3` where the form sits under another `h2` (the styleguide). */
  readonly headingLevel?: "h2" | "h3";
  readonly demo?: FormDemo;
  /** Values to place in fields that are still empty (spec 0006, AC-14). */
  readonly prefill?: Readonly<Record<string, string>>;
}) {
  const Heading = headingLevel;
  const formId = useId();
  const headingId = `${formId}-heading`;
  const sentHeadingRef = useRef<HTMLHeadingElement>(null);
  const turnstile = useRef<TurnstileHandle>(null);
  // One id per form fill, kept across retries so a retry never duplicates (AC-9).
  const submissionId = useRef<string | null>(null);

  const [values, setValues] = useState<Readonly<Record<string, string>>>(() =>
    Object.fromEntries(fields.map((field) => [field.name, ""])),
  );
  // A new prefill fills only fields that are still empty, adjusted during
  // render (React's pattern for state that follows a prop), never in an effect.
  const [appliedPrefill, setAppliedPrefill] = useState(prefill);
  if (prefill !== appliedPrefill) {
    setAppliedPrefill(prefill);
    if (prefill) {
      setValues((current) =>
        Object.fromEntries(
          Object.entries(current).map(([name, value]) => [name, value || (prefill[name] ?? "")]),
        ),
      );
    }
  }
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>(() => {
    if (demo !== "errors") return {};
    const parsed = schema.safeParse(Object.fromEntries(fields.map((field) => [field.name, ""])));
    return parsed.success ? {} : fieldErrors(parsed.error);
  });
  const [status, setStatus] = useState<Status>(() => demoStatus(demo));

  const fieldId = (name: string) => `${formId}-${name}`;

  useEffect(() => {
    if (status.kind === "sent") sentHeadingRef.current?.focus();
  }, [status.kind]);

  const fail = (failure: Failure) => {
    setStatus({ kind: "failed", failure });
    turnstile.current?.reset();
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status.kind === "submitting") return;

    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      const found = fieldErrors(parsed.error);
      setErrors(found);
      setStatus({ kind: "idle" });
      const first = fields.find((field) => found[field.name]);
      if (first) document.getElementById(fieldId(first.name))?.focus();
      return;
    }
    setErrors({});
    setStatus({ kind: "submitting" });

    let token: string;
    try {
      const handle = turnstile.current;
      if (!handle) throw new Error("turnstile_unavailable");
      token = await handle.execute();
    } catch {
      fail("turnstile_failed");
      return;
    }

    submissionId.current ??= crypto.randomUUID();
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          ...extra,
          id: submissionId.current,
          [HONEYPOT_FIELD]: honeypot,
          turnstileToken: token,
        }),
        signal: AbortSignal.timeout(CLIENT_TIMEOUT_MS),
      });
      const body: unknown = await response.json().catch(() => null);
      const outcome = outcomeOf(response.status, body);
      if (outcome === "success") {
        setStatus({ kind: "sent", name: parsed.data.name, email: parsed.data.email });
      } else {
        fail(outcome);
      }
    } catch {
      fail("network");
    }
  };

  // A polite live region that stays mounted through every state, so screen
  // readers announce the confirmation when its text changes (AC-4). A region
  // inserted with its text already inside is often skipped.
  const announcement =
    status.kind === "sent" && !demo
      ? `${sentHeading}. Thanks, ${status.name}. I will reply to ${status.email}.`
      : "";

  return (
    <>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      {status.kind === "sent" ? (
        <Card className="gap-4 md:p-8">
          <div className="grid gap-3">
            <Icon icon={CircleCheck} className="size-8 text-accent" />
            <Heading ref={sentHeadingRef} tabIndex={-1} className="text-heading font-bold">
              {sentHeading}
            </Heading>
            <p className="text-muted">
              Thanks, {status.name}. I will reply to {status.email}.
            </p>
          </div>
        </Card>
      ) : (
        <>
          <Card className="gap-6 md:p-8 noscript:hidden">
            <Heading id={headingId} className="text-heading font-bold">
              {heading}
            </Heading>
            <form aria-labelledby={headingId} noValidate onSubmit={onSubmit} className="grid gap-5">
              {fields.map((field) => {
                const common = {
                  id: fieldId(field.name),
                  name: field.name,
                  label: field.label,
                  hint: field.hint,
                  error: errors[field.name],
                  required: true,
                  value: values[field.name] ?? "",
                };
                const update = (value: string) =>
                  setValues((current) => ({ ...current, [field.name]: value }));
                if (field.control === "textarea") {
                  return (
                    <TextArea
                      key={field.name}
                      {...common}
                      rows={field.rows ?? 6}
                      onChange={(event) => update(event.target.value)}
                    />
                  );
                }
                if (field.control === "select") {
                  return (
                    <SelectField
                      key={field.name}
                      {...common}
                      options={field.options ?? []}
                      onChange={(event) => update(event.target.value)}
                    />
                  );
                }
                return (
                  <TextField
                    key={field.name}
                    {...common}
                    type={field.type ?? "text"}
                    autoComplete={field.autoComplete}
                    onChange={(event) => update(event.target.value)}
                  />
                );
              })}

              {/* The honeypot: hidden from people and screen readers, filled by bots (AC-5). */}
              <div aria-hidden="true" className="absolute -left-[10000px] size-px overflow-hidden">
                <label htmlFor={fieldId(HONEYPOT_FIELD)}>Leave this field empty</label>
                <input
                  id={fieldId(HONEYPOT_FIELD)}
                  name={HONEYPOT_FIELD}
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                />
              </div>

              <TurnstileWidget ref={turnstile} siteKey={SITE_KEY} />

              {status.kind === "failed" ? (
                <p role="alert" className="border-s-2 border-danger ps-3 text-sm text-danger">
                  {status.failure === "generic" ? (
                    linkedinUrl ? (
                      <>
                        Something went wrong on my side. Try again, or reach me on{" "}
                        <TextLink href={linkedinUrl} external>
                          LinkedIn
                        </TextLink>
                        .
                      </>
                    ) : (
                      "Something went wrong on my side. Try again."
                    )
                  ) : (
                    FAILURE_MESSAGES[status.failure]
                  )}
                </p>
              ) : null}

              <div className="grid gap-3">
                <ButtonGroup>
                  <Button type="submit" pending={status.kind === "submitting"}>
                    {submitLabel}
                  </Button>
                </ButtonGroup>
                <p className="text-sm text-muted">{RETENTION_LINE}</p>
              </div>
            </form>
          </Card>
          <p className="hidden text-muted noscript:block">
            This form needs JavaScript. You can still reach me through the links above.
          </p>
        </>
      )}
    </>
  );
}
