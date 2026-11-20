import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import type { Profile } from "@/features/content";
import { svgPath } from "@/features/media/assets";
import { getImageAsset } from "@/features/media/manifest";

const TITLE_ID = "clients-title";

/** One logo as the strip draws it: a URL plus the proportions from the asset step. */
export type ClientLogo = {
  readonly name: string;
  readonly url: string;
  readonly width: number;
  readonly height: number;
};

/**
 * `profile.clients` with their asset step proportions, in order. A logo
 * missing from the manifest fails a production build; in a dev server before
 * `pnpm assets` it is left out.
 */
export const clientLogos = (clients: Profile["clients"]): readonly ClientLogo[] =>
  clients.flatMap((client) => {
    const asset = getImageAsset(client.logo);
    if (!asset) {
      if (process.env.NEXT_PHASE === "phase-production-build") {
        throw new Error(`LogoStrip: content/images/${client.logo} is not in the asset manifest`);
      }
      return [];
    }
    return [
      {
        name: client.name,
        url: `/${svgPath(client.logo)}`,
        width: asset.width,
        height: asset.height,
      },
    ];
  });

/**
 * Spec 0006, AC-9: the clients you have built for, each logo drawn in one
 * colour from its SVG through a CSS mask, so mixed brands read as one row in
 * either theme and no script inside an SVG ever runs. Renders nothing when empty.
 */
export function LogoStrip({ logos }: { readonly logos: readonly ClientLogo[] }) {
  if (logos.length === 0) return null;
  return (
    <Section spacing="compact" labelledBy={TITLE_ID} className="border-b border-line">
      <Container className="grid gap-5 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-10">
        <h2 id={TITLE_ID} className="label text-muted">
          Clients I&apos;ve built for
        </h2>
        <ul className="flex flex-wrap items-center gap-x-10 gap-y-6">
          {logos.map((logo) => (
            <li key={logo.name}>
              <span
                role="img"
                aria-label={logo.name}
                className="block h-8 max-w-40 bg-muted [mask-size:contain] [mask-position:center] [mask-repeat:no-repeat] forced-color-adjust-none forced-colors:bg-[CanvasText]"
                style={{
                  aspectRatio: `${logo.width} / ${logo.height}`,
                  maskImage: `url("${logo.url}")`,
                  WebkitMaskImage: `url("${logo.url}")`,
                }}
              />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
