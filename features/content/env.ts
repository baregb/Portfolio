// `CONTENT_DRAFTS` decides whether drafts appear (spec 0002). A build variable,
// not public: `true` in `pnpm dev` and the preview Worker's build, unset in
// production. Anything other than unset, `true`, or `false` is a mistake.

export type DraftsSetting =
  | { readonly ok: true; readonly includeDrafts: boolean }
  | { readonly ok: false; readonly error: string };

export const parseContentDrafts = (value: string | undefined): DraftsSetting => {
  if (value === undefined || value === "" || value === "false") {
    return { ok: true, includeDrafts: false };
  }
  if (value === "true") return { ok: true, includeDrafts: true };
  return {
    ok: false,
    error: `CONTENT_DRAFTS must be "true", "false", or unset; got ${JSON.stringify(value)}`,
  };
};
