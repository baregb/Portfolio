import { Plus } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import type { FaqItem } from "@/features/content";

const TITLE_ID = "faq-title";

/**
 * Spec 0006, AC-7: questions as native disclosures. Plain server markup, so it
 * opens by keyboard and without JavaScript; `data-analytics-faq` lets the one
 * global listener count first opens (AC-17). Renders nothing when empty.
 */
export function Faq({ items }: { readonly items: readonly FaqItem[] }) {
  if (items.length === 0) return null;
  return (
    <Section labelledBy={TITLE_ID} reveal className="border-t border-line">
      <Container className="grid gap-8 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] md:gap-12">
        <div className="grid content-start gap-3">
          <p className="label text-accent">Straight answers</p>
          <h2 id={TITLE_ID} className="text-heading font-bold">
            Questions, answered
          </h2>
        </div>
        <div className="min-w-0 border-t border-line">
          {items.map((item) => (
            <details
              key={item.question}
              data-analytics-faq={item.question}
              className="group border-b border-line"
            >
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
                <h3 className="text-subheading font-bold">{item.question}</h3>
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line text-accent transition-transform duration-(--duration-fast) ease-out group-open:rotate-45">
                  <Icon icon={Plus} />
                </span>
              </summary>
              <p className="max-w-prose pb-6 text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </Section>
  );
}
