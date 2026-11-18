import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { getProfile } from "@/features/content";

// Placeholder until the home page is designed and built (fast track B).
export default function Home() {
  const { name, roleLine, headline } = getProfile();
  return (
    <Section variant="grid" labelledBy="home-title">
      <Container className="grid gap-6">
        <p className="label text-accent">{roleLine}</p>
        <h1 id="home-title" className="max-w-4xl text-display font-extrabold">
          {name}
        </h1>
        <p className="max-w-prose text-lead text-muted">{headline}</p>
      </Container>
    </Section>
  );
}
