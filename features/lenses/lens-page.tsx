import { toLibraryItem } from "@/components/portfolio/library-item";
import { TrackLensVisit } from "@/features/analytics";
import { ProfilePage, type LensSkill } from "@/features/home/profile-page";
import {
  getLenses,
  getProfile,
  getSkillGroups,
  type Flagship,
  type Lens,
} from "@/features/content";
import { getCvAsset } from "@/features/media/manifest";

/**
 * A role lens at `/for/<lens>` (spec 0004, AC-3): the home composition with
 * this lens's headline, intro, project order, and skills. Its first flagship
 * is the green block; a lens with none has no green block (AC-14 allows it).
 */
export function LensPage({ lens }: { readonly lens: Lens }) {
  const profile = getProfile();
  const featured = lens.projects.find(
    (project): project is Flagship => project.depth === "flagship",
  );
  const onAbout = new Set(
    getSkillGroups().flatMap(({ skills }) => skills.map(({ skill }) => skill.slug)),
  );
  const lensSkills: readonly LensSkill[] = lens.skills.map((skill) => ({
    slug: skill.slug,
    name: skill.name,
    description: skill.description,
    href: onAbout.has(skill.slug) ? `/about#skill-${skill.slug}` : null,
  }));

  return (
    <>
      <TrackLensVisit lens={lens.slug} />
      <ProfilePage
        profile={profile}
        cv={getCvAsset()}
        hero={{
          label: lens.name,
          lead: lens.headline,
          highlight: lens.headlineHighlight,
          intro: lens.intro,
        }}
        lenses={getLenses().map(({ slug, name }) => ({ slug, name }))}
        current={lens.slug}
        featured={featured}
        projects={lens.projects.filter((project) => project !== featured).map(toLibraryItem)}
        lensSkills={lensSkills}
        trackRecord={lens.trackRecord}
        testimonials={lens.testimonials}
        faq={lens.faq}
      />
    </>
  );
}
