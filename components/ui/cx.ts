/** Joins class names, skipping empty and false values. */
export const cx = (...classes: readonly (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(" ");
