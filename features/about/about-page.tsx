import { CtaBand } from "@/components/portfolio/cta-band";
import { projectAnchor } from "@/components/portfolio/links";
import { PageHero } from "@/components/portfolio/page-hero";
import { ProfilePhoto } from "@/components/portfolio/profile-photo";
import { Prose } from "@/components/portfolio/prose";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { TextLink } from "@/components/ui/text-link";
import { getAbout, getProfile, getSkillGroups } from "@/features/content";
import { getCvAsset } from "@/features/media/manifest";

const SKILLS_TITLE = "skills-title";

/**
 * `/about` (spec 0004, AC-9): the story, then every skill grouped by what it
 * does, each linked to the projects that prove it. Case studies and lenses
 * link here by `#skills` and `#skill-<slug>`.
 */
export function AboutPage() {
  const profile = getProfile();
  const groups = getSkillGroups();
  return (
    <>
      <PageHero
        label="About"
        title={profile.name}
        titleSize="display"
        lead={profile.headline}
        highlight={profile.headlineHighlight}
        media={<ProfilePhoto photo={profile.photo} variant="portrait" priority />}
        mediaOnPhones="bottom"
      />

      <Section>
        <Container>
          <Prose code={getAbout().body.code} />
        </Container>
      </Section>

      {groups.length > 0 ? (
        <Section id="skills" labelledBy={SKILLS_TITLE} className="border-t border-line">
          <Container className="grid gap-12">
            <h2 id={SKILLS_TITLE} className="text-title font-extrabold">
              Skills
            </h2>
            {groups.map(({ group, skills }) => (
              <div key={group} className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
                <h3 className="text-heading font-bold">{group}</h3>
                <ul className="grid border-s border-t border-line md:grid-cols-2">
                  {skills.map(({ skill, projects }) => (
                    <li
                      key={skill.slug}
                      id={`skill-${skill.slug}`}
                      className="grid content-start gap-3 border-e border-b border-line bg-surface p-5 target:bg-accent-soft md:p-6"
                    >
                      <h4 className="font-display text-subheading font-bold">{skill.name}</h4>
                      <p className="text-muted">{skill.description}</p>
                      <div className="grid gap-2 border-t border-dashed border-line pt-3">
                        <p className="label text-muted">Projects</p>
                        <ul className="grid gap-1.5">
                          {projects.map((project) => (
                            <li key={project.slug}>
                              <TextLink href={projectAnchor(project)}>{project.title}</TextLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Container>
        </Section>
      ) : null}

      <CtaBand cv={getCvAsset()} availability={profile.availability} />
    </>
  );
}

export const aboutMetadata = () => {
  const { seo } = getAbout();
  return {
    title: seo?.title ?? "About",
    description: seo?.description ?? getProfile().headline,
  };
};
