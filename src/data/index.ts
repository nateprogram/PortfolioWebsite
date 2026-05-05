// Public entry point for the site's content layer.
//
// This barrel re-exports every piece of site content from focused
// sibling files so `import { DATA, PROJECT_DETAILS, PROJECT_FILTERS }
// from "@/data"` always works no matter how the data is organized
// underneath.
//
//   profile.ts             bio, contact, education, skill chips, navbar
//   projects-list.tsx      the projects[] array (cards on the homepage)
//   project-filters.ts     the filter chips above the projects grid
//   projects/<slug>.tsx    deep-dive content per project
//   project-details.ts     aggregates the per-project files
//   types.ts               shared types (ProjectDetail, Figure, ...)
//
// To add a new project:
//   1. add a new entry to PROJECTS in projects-list.tsx (the card)
//   2. drop a new projects/<slug>.tsx file (the deep dive, optional)
//   3. wire that file into project-details.ts

import { PROFILE } from "./profile";
import { PROJECTS } from "./projects-list";

export const DATA = {
  ...PROFILE,
  projects: PROJECTS,
} as const;

export { PROJECT_FILTERS } from "./project-filters";
export { PROJECT_DETAILS } from "./project-details";
export type {
  ProjectDetail,
  Figure,
  CodeSnippet,
  StackRationaleItem,
} from "./types";
