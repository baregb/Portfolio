// Spec 0003, AC-12 and spec 0004, AC-13: the site navigation, one constant.
// List only routes that exist. Lenses are reached through the lens switcher
// and the CV through its buttons; `/styleguide` is never listed.

export type NavItem = { readonly href: string; readonly label: string };

export const navItems: readonly NavItem[] = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];
