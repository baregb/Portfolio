import type { LibraryItem } from "@/components/portfolio/library-item";
import { ProjectCard } from "@/components/portfolio/project-card";

/** The library grid. Shared by the filtered view and the no JavaScript fallback. */
export function ProjectList({ items }: { readonly items: readonly LibraryItem[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <li key={item.slug}>
          <ProjectCard item={item} />
        </li>
      ))}
    </ul>
  );
}
