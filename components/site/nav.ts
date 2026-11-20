// Spec 0003, AC-12 and spec 0004, AC-13: the site navigation. List only
// routes that exist. Lenses are reached through the lens switcher and the CV
// through its buttons; `/styleguide` is never listed. Services joins once a
// service is published (spec 0006, AC-5b and AC-12).

export type NavItem = { readonly href: string; readonly label: string };

const WORK: NavItem = { href: "/work", label: "Work" };
const SERVICES: NavItem = { href: "/services", label: "Services" };
const ABOUT: NavItem = { href: "/about", label: "About" };
const CONTACT: NavItem = { href: "/contact", label: "Contact" };

/** Work, Services, About, Contact; Services only when a service is published. */
export const navItemsFor = (hasServices: boolean): readonly NavItem[] =>
  hasServices ? [WORK, SERVICES, ABOUT, CONTACT] : [WORK, ABOUT, CONTACT];

/** Spec 0006, AC-12: the menu's availability line speaks to clients on the services pages. */
export const isServicesPath = (pathname: string): boolean =>
  pathname === SERVICES.href || pathname.startsWith(`${SERVICES.href}/`);
