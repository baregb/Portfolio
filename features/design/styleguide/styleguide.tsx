import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ArrowRight, Download, SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site/site-header";
import { ThemeSwitcher } from "@/components/site/theme-switcher";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";
import { SpecSheet } from "@/components/ui/spec-sheet";
import { Spinner } from "@/components/ui/spinner";
import { StatTile } from "@/components/ui/stat-tile";
import { Tag } from "@/components/ui/tag";
import { SelectField, TextArea, TextField } from "@/components/ui/text-field";
import { TextLink } from "@/components/ui/text-link";
import { contrastRatio, formatRatio } from "../contrast";
import { parseThemeTokens, type TokenMap } from "../tokens";
import { ModalDemo, PendingDemo, ToastDemo } from "./demos";

// Read at build: the swatches show the real token values and their contrast
// against the page background, computed by the same function the test uses.
const readTokens = (): { readonly light: TokenMap; readonly dark: TokenMap } => {
  const parsed = parseThemeTokens(readFileSync(join(process.cwd(), "app", "globals.css"), "utf8"));
  if (!parsed.ok) throw new Error(`styleguide: ${parsed.error}`);
  return parsed.tokens;
};

const SAMPLE_NAV = [
  { href: "/styleguide", label: "Work" },
  { href: "/styleguide#lenses", label: "Lenses" },
  { href: "/styleguide#about", label: "About" },
  { href: "/styleguide#contact", label: "Contact" },
] as const;

const TYPE_SCALE = [
  { role: "display", className: "font-display text-display font-extrabold", sample: "End to end." },
  {
    role: "title (h1)",
    className: "font-display text-title font-extrabold",
    sample: "Case studies",
  },
  {
    role: "heading (h2)",
    className: "font-display text-heading font-bold",
    sample: "What I built",
  },
  {
    role: "subheading (h3)",
    className: "font-display text-subheading font-bold",
    sample: "Payments",
  },
  {
    role: "lead",
    className: "text-lead text-muted",
    sample: "From the data model to the checkout, using AI tools to ship faster.",
  },
  {
    role: "body",
    className: "text-base",
    sample:
      "A storefront and admin app for a home catering business, with online ordering, card and bank transfer payments, and order tracking.",
  },
  { role: "small", className: "text-sm text-muted", sample: "Updated 17 November 2026" },
  { role: "label", className: "label text-muted", sample: "Case 01 · Commerce and payments" },
  {
    role: "number",
    className: "font-mono text-2xl font-medium text-accent tabular-nums",
    sample: "1,277",
  },
] as const;

function Block({
  id,
  title,
  description,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="grid gap-6 border-t border-line pt-10">
      <div className="grid gap-1">
        <h2 id={id} className="text-heading font-bold">
          {title}
        </h2>
        {description ? <p className="max-w-prose text-muted">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Swatch({
  name,
  light,
  dark,
}: {
  readonly name: string;
  readonly light: string;
  readonly dark: string;
}) {
  const ratio = (value: string, bg: string | undefined): string => {
    const result = contrastRatio(value, bg ?? "");
    return result.ok ? formatRatio(result.ratio) : "n/a";
  };
  return (
    <li className="grid min-w-0 content-start gap-2">
      <span
        aria-hidden="true"
        className="block h-16 border border-line"
        style={{ backgroundColor: `var(--color-${name})` }}
      />
      <span className="font-mono text-[0.8125rem] font-medium">--color-{name}</span>
      <SpecSheet
        className="border border-line bg-surface text-xs"
        items={[
          { key: "light", value: light },
          { key: "dark", value: dark },
          { key: "on bg light", value: ratio(light, LIGHT_BG) },
          { key: "on bg dark", value: ratio(dark, DARK_BG) },
        ]}
      />
    </li>
  );
}

const TOKENS = readTokens();
const LIGHT_BG = TOKENS.light.bg;
const DARK_BG = TOKENS.dark.bg;

/** Every token, type style, and component in every state (AC-13). */
export function Styleguide() {
  const names = Object.keys(TOKENS.light).filter(
    (name) => !["transparent", "current"].includes(name),
  );
  return (
    <>
      <Section variant="grid" labelledBy="styleguide-title">
        <Container className="grid items-end gap-10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="grid gap-5">
            <p className="label text-accent">Spec 0003 · Design system</p>
            <h1 id="styleguide-title" className="text-display font-extrabold">
              Styleguide
            </h1>
            <p className="max-w-prose text-lead text-muted">
              Every token, type style, and component in every state. Switch the theme to check both.
              This page is hidden from search and the nav.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <ThemeSwitcher />
              <span className="text-sm text-muted">System, Light, Dark</span>
            </div>
          </div>
          <Card as="aside" className="gap-0 p-0">
            <SpecSheet
              items={[
                { key: "headlines", value: "Bricolage Grotesque" },
                { key: "body", value: "Geist" },
                { key: "labels", value: "Geist Mono" },
                { key: "accent", value: "deep green" },
                { key: "tokens", value: "app/globals.css" },
              ]}
            />
          </Card>
        </Container>
      </Section>

      <Container className="grid gap-16 py-16">
        <Block
          id="colour"
          title="Colour"
          description="Each token with its light and dark value and its contrast against the page background. Translucent tokens show n/a."
        >
          <ul className="grid grid-cols-1 gap-5 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {names.map((name) => (
              <Swatch
                key={name}
                name={name}
                light={TOKENS.light[name] ?? ""}
                dark={TOKENS.dark[name] ?? ""}
              />
            ))}
          </ul>
        </Block>

        <Block
          id="type"
          title="Type"
          description="Bricolage Grotesque for headlines, Geist for reading, Geist Mono for labels and numbers."
        >
          <dl className="grid">
            {TYPE_SCALE.map(({ role, className, sample }) => (
              <div
                key={role}
                className="grid gap-2 border-b border-line py-5 md:grid-cols-[10rem_minmax(0,1fr)] md:items-baseline md:gap-8"
              >
                <dt className="label text-muted">{role}</dt>
                <dd className={className}>{sample}</dd>
              </div>
            ))}
          </dl>
        </Block>

        <Block
          id="buttons"
          title="Buttons"
          description="Controls are round. The square line button is for quiet actions inside content boxes."
        >
          <div className="grid gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button>Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="line">Request details →</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small primary</Button>
              <Button size="sm" variant="secondary">
                Small secondary
              </Button>
              <Button href="/styleguide" iconEnd={<Icon icon={ArrowRight} />}>
                Link as button
              </Button>
              <Button
                href="https://github.com/baregb"
                external
                variant="secondary"
                iconStart={<Icon icon={Download} />}
              >
                External link
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button pending>Pending</Button>
              <Button disabled>Disabled</Button>
              <Button href="/styleguide" disabled variant="secondary">
                Disabled link
              </Button>
              <PendingDemo />
            </div>
          </div>
        </Block>

        <Block id="links" title="Links and labels">
          <div className="grid gap-5">
            <p className="max-w-prose">
              Read the <TextLink href="/styleguide">internal link</TextLink> or the{" "}
              <TextLink href="https://github.com/baregb" external>
                external link
              </TextLink>
              , which opens in a new tab and says so to screen readers.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Tag>nextjs</Tag>
              <Tag>supabase</Tag>
              <Tag href="/styleguide">linked tag</Tag>
              <Badge>Available on request</Badge>
            </div>
          </div>
        </Block>

        <Block
          id="cards"
          title="Cards and spec sheets"
          description="Content boxes are square with hairlines and no shadow."
        >
          <div className="grid gap-5 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <Card as="article">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="label text-muted">Case 02 · Data migration</span>
                <Badge>Available on request</Badge>
              </div>
              <h3 className="text-heading font-bold">Membership charity data migration</h3>
              <p className="text-muted">Summary only. Details are shared on request.</p>
              <div>
                <Button variant="line" href="/styleguide">
                  Request details →
                </Button>
              </div>
            </Card>
            <Card as="aside" className="gap-0 p-0">
              <SpecSheet
                items={[
                  { key: "role", value: "Solutions architect" },
                  { key: "also", value: "Software developer" },
                  { key: "location", value: "Remote, worldwide" },
                  { key: "availability", value: "Selective" },
                ]}
              />
            </Card>
          </div>
        </Block>

        <Block
          id="stats"
          title="Stat tiles"
          description="Mono numbers in accent on the page; big Bricolage numbers on the green block."
        >
          <dl className="grid grid-cols-2 gap-6 border-t border-line pt-5 md:grid-cols-4">
            <StatTile value="1,277" label="automated tests passing" />
            <StatTile value="14/14" label="tables with RLS forced" />
            <StatTile
              value="111"
              label="database migrations"
              context="Every schema change is versioned SQL."
            />
            <StatTile value="95" label="pages and API routes" />
          </dl>
        </Block>

        <Block
          id="forms"
          title="Form fields"
          description="Labels always show. Errors say what is wrong and how to fix it."
        >
          <div className="grid max-w-2xl gap-5">
            <TextField label="Your name" name="sg-name" autoComplete="name" />
            <TextField
              label="Company"
              name="sg-company"
              hint="Optional. Helps me reply with the right examples."
            />
            <TextField
              label="Your email"
              name="sg-email"
              type="email"
              required
              defaultValue="jane@company"
              error="Enter a full email address, like jane@company.com."
            />
            <TextField label="Project" name="sg-project" disabled defaultValue="Beccah's Kitchen" />
            <TextArea
              label="Message"
              name="sg-message"
              required
              hint="A few lines about the role or project."
            />
            <SelectField
              label="Problem"
              name="sg-problem"
              defaultValue=""
              options={[
                { value: "", label: "All" },
                { value: "commerce", label: "Commerce and payments" },
                { value: "data", label: "Data migration" },
              ]}
            />
          </div>
        </Block>

        <Block
          id="feedback"
          title="Feedback"
          description="Toasts, the modal, and the loading and empty states."
        >
          <div className="grid gap-8">
            <ToastDemo />
            <ModalDemo />
            <div className="grid gap-5 md:grid-cols-2">
              <Card>
                <div className="flex items-center gap-2 text-muted">
                  <Spinner className="size-4" />
                  <span className="label">Loading</span>
                </div>
                <div role="status" className="grid gap-3">
                  <span className="sr-only">Loading projects</span>
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-7 w-4/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </Card>
              <Card className="justify-items-start">
                <Icon icon={SearchX} className="size-6 text-muted" />
                <h3 className="text-subheading font-bold">No projects match these filters</h3>
                <p className="text-muted">Try removing a filter, or see every project.</p>
                <Button variant="secondary" size="sm" href="/styleguide">
                  Clear filters
                </Button>
              </Card>
            </div>
          </div>
        </Block>

        <Block
          id="shell"
          title="Header"
          description="The floating frosted bar with sample nav items. Below the md breakpoint the nav folds into the menu button."
        >
          <div className="border border-line grid-band py-6">
            <SiteHeader items={SAMPLE_NAV} position="static" />
          </div>
        </Block>
      </Container>

      <Section variant="accent" labelledBy="accent-title" reveal>
        <Container className="grid gap-8">
          <div className="grid items-end gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="grid gap-3">
              <p className="label text-block-muted">Case 01 · The green block, once per page</p>
              <h2 id="accent-title" className="text-title font-extrabold">
                Beccah&apos;s Kitchen: ordering and operations for a Lagos caterer
              </h2>
            </div>
            <p className="text-block-muted">
              A storefront and admin app for a home catering business, with online ordering, card
              and bank transfer payments, order tracking, and catering quotes.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 border-t border-block-line pt-6 md:grid-cols-4">
            <StatTile size="large" value="1,277" label="automated tests passing" />
            <StatTile size="large" value="14/14" label="tables with RLS forced" />
            <StatTile size="large" value="111" label="database migrations" />
            <StatTile size="large" value="95" label="pages and API routes" />
          </dl>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1.5">
              <Tag tone="onAccent">nextjs</Tag>
              <Tag tone="onAccent">supabase</Tag>
              <Tag tone="onAccent">paystack</Tag>
            </div>
            <Button variant="onAccent" href="/styleguide">
              Read the case study
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
