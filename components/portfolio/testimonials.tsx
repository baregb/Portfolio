import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import type { Testimonial } from "@/features/content";
import { testimonialRole } from "./format";
import { Picture } from "./picture";

const TITLE_ID = "testimonials-title";

/**
 * Spec 0006, AC-8: quotes as figures in a grid of hairline boxes. A photo
 * with empty alt is decorative; the caption names the person. Renders
 * nothing when there are no quotes.
 */
export function Testimonials({ quotes }: { readonly quotes: readonly Testimonial[] }) {
  if (quotes.length === 0) return null;
  return (
    <Section labelledBy={TITLE_ID} reveal className="border-t border-line">
      <Container className="grid gap-8">
        <div className="grid gap-3">
          <p className="label text-accent">In their words</p>
          <h2 id={TITLE_ID} className="text-heading font-bold">
            What clients say
          </h2>
        </div>
        <ul className="grid border-s border-t border-line md:grid-cols-2">
          {quotes.map((quote) => {
            const role = testimonialRole(quote);
            return (
              <li key={quote.slug} className="border-e border-b border-line bg-surface">
                <figure className="grid h-full content-between gap-6 p-6 md:p-8">
                  <blockquote className="text-lead text-fg">
                    <p>
                      <span aria-hidden="true" className="font-display text-accent">
                        “
                      </span>
                      {quote.quote}
                      <span aria-hidden="true" className="font-display text-accent">
                        ”
                      </span>
                    </p>
                  </blockquote>
                  <figcaption className="flex items-center gap-4">
                    {quote.photo ? (
                      <Picture
                        image={quote.photo}
                        sizes="48px"
                        fit="cover"
                        className="size-12 shrink-0 border border-line"
                      />
                    ) : null}
                    <span className="grid min-w-0">
                      <span className="font-semibold">{quote.name}</span>
                      {role ? <span className="text-sm text-muted">{role}</span> : null}
                    </span>
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>
      </Container>
    </Section>
  );
}
