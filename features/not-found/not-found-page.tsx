import { ArrowRight } from "lucide-react";
import { PageHero } from "@/components/portfolio/page-hero";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Icon } from "@/components/ui/icon";
import { TextLink } from "@/components/ui/text-link";

// The 404 page (feature 15; spec 0004 left it to launch). One band, no green
// block: say what happened, then offer the two places most visitors want.

const LEAD = "This address does not match a page here. It may have moved, or the link has a typo.";

export function NotFoundPage() {
  return (
    <PageHero label="Error 404" title="Page not found" lead={LEAD}>
      <ButtonGroup>
        <Button href="/" iconEnd={<Icon icon={ArrowRight} />}>
          Go to the home page
        </Button>
        <Button href="/work" variant="secondary">
          Browse the work
        </Button>
      </ButtonGroup>
      <p className="max-w-prose text-muted">
        Followed a link on this site to get here? <TextLink href="/contact">Tell me</TextLink> and I
        will fix it.
      </p>
    </PageHero>
  );
}
