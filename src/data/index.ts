// Public entry point for the site's content layer.
//
// This barrel re-exports every piece of site content from focused
// sibling files so `import { DATA, PROJECT_DETAILS, PROJECT_FILTERS }
// from "@/data"` always works no matter how the data is organized
// underneath.
//
//   profile.ts             name, location, contact, education, bio,
//                          skill chips, navbar (the resume reads the
//                          identity fields from here too)
//   experience.ts          work history (timeline, /resume, PDF)
//   resume.ts              the resume as data (/resume + /resume.pdf)
//   projects-list.tsx      the project cards on the homepage
//   project-filters.ts     the filter chips above the projects grid
//   lights.ts              category -> circuit color (blue, white, gold,
//                          orange)
//   projects/<slug>.tsx    deep-dive content per project
//   project-details.ts     aggregates the per-project files
//   types.ts               shared types (ProjectDetail, Figure, ...)
//
// CONTENT.md at the repo root has step-by-step recipes for every common
// edit, and `npm run check:content` verifies the pieces still agree.

import { PROFILE } from "./profile";
import { PROJECTS } from "./projects-list";

export const DATA = {
  ...PROFILE,
  projects: PROJECTS,
} as const;

export { PROJECT_FILTERS } from "./project-filters";
export {
  LIGHT_CLASS,
  LIGHT_VAR,
  categoryLight,
  projectLight,
  projectLightClass,
  projectLights,
  projectLightStyle,
} from "./lights";
export type { Light } from "./lights";
export {
  EXPERIENCE,
  HOME_EXPERIENCE,
  CURRENT_ROLE,
  formatRange,
} from "./experience";
export type { ExperienceEntry } from "./experience";
export { RESUME, companyLabel } from "./resume";
export type { Project } from "./projects-list";
export { PROJECT_DETAILS } from "./project-details";
export type {
  ProjectDetail,
  Figure,
  CodeSnippet,
  StackRationaleItem,
} from "./types";
