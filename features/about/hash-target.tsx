"use client";

import { useEffect } from "react";
import { hashTargetIds } from "./hash";

/** Set on the element the address hash names; style it with `data-hash-target:`. */
const HASH_TARGET_ATTRIBUTE = "data-hash-target";

const clearHashTarget = () =>
  document
    .querySelectorAll(`[${HASH_TARGET_ATTRIBUTE}]`)
    .forEach((element) => element.removeAttribute(HASH_TARGET_ATTRIBUTE));

const markHashTarget = () => {
  clearHashTarget();
  const target = hashTargetIds(window.location.hash)
    .map((id) => document.getElementById(id))
    .find((element) => element !== null);
  target?.setAttribute(HASH_TARGET_ATTRIBUTE, "");
};

/**
 * CSS `:target` only updates on a full load or a real hash change. A Next
 * `<Link>` from another page arrives with `history.pushState`, so `:target`
 * never matches and the linked skill box is not highlighted (spec 0004, AC-9).
 * This marks the hashed element itself, on arrival and on later hash changes.
 */
export function HashTarget() {
  useEffect(() => {
    markHashTarget();
    window.addEventListener("hashchange", markHashTarget);
    return () => {
      window.removeEventListener("hashchange", markHashTarget);
      clearHashTarget();
    };
  }, []);
  return null;
}
