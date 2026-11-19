import Link from "next/link";
import { ExternalLinks } from "@/components/portfolio/external-links";
import { profileLinks } from "@/components/portfolio/links";
import { Container } from "@/components/ui/container";
import { getProfile } from "@/features/content";

/** Name, role, profile links, the year the site was built, and the privacy note. */
export function SiteFooter() {
  const profile = getProfile();
  const { name, roleLine, location } = profile;
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-line">
      <Container className="grid gap-8 py-10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div className="grid gap-1">
          <p className="font-display text-xl font-extrabold tracking-[-0.03em]">{name}</p>
          <p className="text-muted">{roleLine}</p>
          <p className="mt-2 label text-muted">{location}</p>
        </div>
        <div className="grid gap-4 md:justify-items-end">
          <ExternalLinks links={profileLinks(profile)} label="Profiles" />
          <p className="flex flex-wrap items-center gap-x-4 text-sm text-muted">
            <span>
              © {year} {name}
            </span>
            <Link
              href="/privacy"
              className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 hover:text-fg hover:decoration-2"
            >
              Privacy
            </Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}
