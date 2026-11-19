import type { ReactNode } from "react";
import { PageHero } from "@/components/portfolio/page-hero";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { TextLink } from "@/components/ui/text-link";
import { getProfile } from "@/features/content";
import { RETENTION_DAYS } from "@/features/forms/schema";
import { PRIVACY_UPDATED } from "./copy";

// The privacy note (feature 15). Every statement here follows from a decided
// spec: the forms pipeline and its retention (spec 0005), cookieless Umami
// with Do Not Track (feature 13), and Cloudflare hosting (spec 0001). Change
// the page when any of those change, and move `PRIVACY_UPDATED`.

const LEAD = "What this site collects, why, and how long it keeps it. Short, because it is little.";

function Part({
  id,
  title,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="grid gap-4">
      <h2 id={id} className="text-heading font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function List({ children }: { readonly children: ReactNode }) {
  return <ul className="grid list-disc gap-2 ps-5 marker:text-accent">{children}</ul>;
}

export function PrivacyPage() {
  const { name } = getProfile();
  return (
    <>
      <PageHero label="Privacy" title="Privacy" lead={LEAD}>
        <p className="label text-muted">
          Last updated <time dateTime={PRIVACY_UPDATED.iso}>{PRIVACY_UPDATED.label}</time>
        </p>
      </PageHero>
      <Section>
        <Container>
          <div className="grid max-w-prose gap-12 text-[1.0625rem] leading-relaxed">
            <Part id="privacy-short" title="In short">
              <p>
                This is the personal site of {name}. It uses no tracking cookies, shows no ads, and
                sells nothing about you. The only personal details I keep are the ones you type into
                a form, and only so I can reply.
              </p>
            </Part>

            <Part id="privacy-forms" title="When you send a message">
              <p>
                The contact form and the request details form send what you type: your name, your
                email, and your message (or your reason for asking, and which project it is about).
              </p>
              <List>
                <li>
                  It is saved in a database on Cloudflare and emailed to me, with your email as the
                  reply address. It goes nowhere else.
                </li>
                <li>
                  I keep each message for {RETENTION_DAYS} days. After that, a scheduled job deletes
                  it automatically.
                </li>
                <li>Your IP address and browser details are not saved with your message.</li>
                <li>
                  To stop spam, Cloudflare Turnstile checks that a person is sending the form, and
                  your IP address is used for a moment to limit how many messages one visitor can
                  send per minute. Neither is stored by this site.
                </li>
              </List>
            </Part>

            <Part id="privacy-analytics" title="Analytics">
              <p>
                I use Umami to see which pages people read. It uses no cookies and does not identify
                you. It counts page views and a few actions: opening a role page, reading a case
                study, and downloading the CV.
              </p>
              <p>
                If your browser sends Do Not Track, nothing is recorded. If you block the script,
                the site works just the same.
              </p>
            </Part>

            <Part id="privacy-logs" title="Errors and logs">
              <p>
                When something breaks, the server logs the page address, the kind of request, and an
                error code, never what you typed. Error reports go to Sentry with personal data
                turned off. Cloudflare, which hosts the site, keeps short lived request logs that
                can include your IP address.
              </p>
            </Part>

            <Part id="privacy-services" title="Who handles it">
              <List>
                <li>
                  <TextLink href="https://www.cloudflare.com/privacypolicy/" external>
                    Cloudflare
                  </TextLink>
                  : hosting, the message database, email delivery, and the spam check.
                </li>
                <li>
                  <TextLink href="https://umami.is/privacy" external>
                    Umami
                  </TextLink>
                  : cookieless visit counts.
                </li>
                <li>
                  <TextLink href="https://sentry.io/privacy/" external>
                    Sentry
                  </TextLink>
                  : error reports, without personal data.
                </li>
              </List>
            </Part>

            <Part id="privacy-choices" title="Your choices">
              <p>
                You can ask me to show you or delete anything you sent, at any time, through the{" "}
                <TextLink href="/contact">contact page</TextLink>. I will do it and confirm by
                email.
              </p>
            </Part>
          </div>
        </Container>
      </Section>
    </>
  );
}
