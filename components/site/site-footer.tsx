import { Container } from "@/components/ui/container";
import { TextLink } from "@/components/ui/text-link";
import { getProfile, type Profile } from "@/features/content";

const LINK_LABELS: Readonly<Record<Profile["links"][number]["kind"], string>> = {
  github: "GitHub",
  linkedin: "LinkedIn",
  website: "Website",
};

/** Name, role, profile links, and the year the site was built. */
export function SiteFooter() {
  const { name, roleLine, location, links } = getProfile();
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
          {links.length > 0 ? (
            <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Profiles">
              {links.map(({ kind, url }) => (
                <li key={url}>
                  <TextLink href={url} external>
                    {LINK_LABELS[kind]}
                  </TextLink>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="text-sm text-muted">
            © {year} {name}
          </p>
        </div>
      </Container>
    </footer>
  );
}
