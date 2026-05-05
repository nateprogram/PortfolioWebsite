// Chips rendered above the projects grid. `value` drives the URL query
// param (`?filter=ai-ml`); `label` is the visible text; `matches` is the
// category string a project must contain to pass the filter. The "all"
// entry has no `matches` because it short-circuits the filter.

export const PROJECT_FILTERS = [
  { value: "all", label: "All" },
  { value: "ai-ml", label: "AI/ML", matches: "AI/ML" },
  { value: "full-stack", label: "Full-Stack", matches: "Full-Stack" },
  { value: "games", label: "Games", matches: "Games" },
  { value: "systems", label: "Systems", matches: "Systems" },
] as const;
