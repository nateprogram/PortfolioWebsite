import { useSyncExternalStore } from "react";

// The projects grid's filter, shared by the Skills chips and the project
// tabs. It lives in the URL so a filtered view can be shared:
// `?focus=<category filter>` or `?skill=<skill id>`, one at a time.
//
// It's read through useSyncExternalStore rather than useSearchParams: the
// server snapshot is "all", so the full grid is in the prerendered HTML
// (crawlers and link previews see every project) and the client swaps to
// the URL's filter right after hydration.

const FILTER_EVENT = "projects:filter";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  window.addEventListener(FILTER_EVENT, onChange);
  return () => {
    window.removeEventListener("popstate", onChange);
    window.removeEventListener(FILTER_EVENT, onChange);
  };
}

// A string snapshot, so React can compare it by value.
function getSnapshot() {
  const q = new URLSearchParams(window.location.search);
  const skill = q.get("skill");
  if (skill) return `skill:${skill}`;
  const focus = q.get("focus");
  return focus ? `focus:${focus}` : "all";
}

const getServerSnapshot = () => "all";

export type ProjectFilter = { focus: string; skill?: undefined } | { focus?: undefined; skill: string };

export function useProjectFilter(): ProjectFilter {
  const key = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (key.startsWith("skill:")) return { skill: key.slice(6) };
  return { focus: key.startsWith("focus:") ? key.slice(6) : "all" };
}

/** Show one category (`focus`), one skill, or everything (`{}`). */
export function setProjectFilter(next: { focus?: string; skill?: string }) {
  const url = new URL(window.location.href);
  url.searchParams.delete("focus");
  url.searchParams.delete("skill");
  if (next.skill) url.searchParams.set("skill", next.skill);
  else if (next.focus && next.focus !== "all") url.searchParams.set("focus", next.focus);
  url.hash = "projects";
  // Passing history.state through keeps Next's router state intact.
  window.history.replaceState(window.history.state, "", url);
  window.dispatchEvent(new Event(FILTER_EVENT));
}
