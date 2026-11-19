import { toLibraryItem } from "@/components/portfolio/library-item";
import {
  getCategories,
  getFeatured,
  getLenses,
  getProfile,
  getProjects,
  getSkillGroups,
} from "@/features/content";
import { getCvAsset } from "@/features/media/manifest";
import { ProfilePage, type CategorySummary } from "./profile-page";

/** Home (spec 0004, AC-1): proof first, then paths into lenses, work, skills, and contact. */
export function HomePage() {
  const profile = getProfile();
  const projects = getProjects();
  const [featured, ...moreFeatured] = getFeatured();

  const categories: readonly CategorySummary[] = getCategories().map((category) => ({
    ...category,
    count: projects.filter((project) => project.categories.some((c) => c.slug === category.slug))
      .length,
  }));

  return (
    <ProfilePage
      profile={profile}
      cv={getCvAsset()}
      hero={{
        label: `${profile.roleLine} · ${profile.location}`,
        lead: profile.headline,
        highlight: profile.headlineHighlight,
      }}
      lenses={getLenses().map(({ slug, name }) => ({ slug, name }))}
      current={null}
      featured={featured}
      projects={moreFeatured.map(toLibraryItem)}
      categories={categories}
      skillGroups={getSkillGroups().map(({ group, skills }) => ({
        group,
        skills: skills.map(({ skill }) => skill.name),
      }))}
    />
  );
}
