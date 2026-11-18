// Spec 0003, AC-12: the site navigation, one constant. List only routes that
// exist; each Journey 1 page adds its own entry when it ships (Work, Lenses,
// About, CV, Contact). `/styleguide` is never listed.

export type NavItem = { readonly href: string; readonly label: string };

export const navItems: readonly NavItem[] = [];
