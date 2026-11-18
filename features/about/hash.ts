// Which element ids an address hash can name. Pure, so `HashTarget` only
// wires it to the DOM.

const decode = (
  value: string,
): { readonly ok: true; readonly value: string } | { readonly ok: false } => {
  try {
    return { ok: true, value: decodeURIComponent(value) };
  } catch {
    // A malformed escape such as `#%` or `#skill-%E0` is a visitor typo, not a bug.
    return { ok: false };
  }
};

/**
 * The ids to try for a hash, in the order the browser tries them for
 * `:target`: the raw fragment first, then its percent-decoded form. Empty
 * for no hash. Never throws, whatever the visitor typed.
 */
export const hashTargetIds = (hash: string): readonly string[] => {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return [];
  const decoded = decode(raw);
  return decoded.ok && decoded.value !== raw ? [raw, decoded.value] : [raw];
};
