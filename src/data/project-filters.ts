// Chips rendered above the projects grid. `value` drives the URL query
// param (`?focus=ai-ml`); `label` is the visible text; `matches` is the
// category string a project must contain to pass the filter. The "all"
// entry has no `matches` because it short-circuits the filter.
//
// `light` is the category's circuit color (see lights.ts): cards, tabs,
// and project pages in that category are drawn in it.

export const PROJECT_FILTERS = [
  { value: "all", label: "All" },
  { value: "ai-ml", label: "AI/ML", matches: "AI/ML", light: "ai" },
  { value: "full-stack", label: "Full-Stack", matches: "Full-Stack", light: "apps" },
  { value: "games", label: "Games", matches: "Games", light: "games" },
  { value: "systems", label: "Systems", matches: "Systems", light: "systems" },
] as const;
