// The four lights of the Grid. In TRON: Legacy a program's circuit color
// says whose side it is on, and the site borrows that code for project
// categories, so color always means something:
//
//   apps      blue    programs that fight for the users   Full-Stack
//   ai        white   users and ISOs, the Grid's self-made Quorra-style
//                     intelligence                        AI/ML
//   systems   gold    Clu, the program that built and runs the Grid
//                                                         Systems
//   games     orange  Clu's army and the Games            Games
//
// The colors themselves live in globals.css (the .light-* classes). A
// project takes the light of its FIRST category, so order `categories`
// in projects-list.tsx with the main one first.

import { PROJECT_FILTERS } from "./project-filters";

export type Light = "apps" | "ai" | "systems" | "games";

/** CSS class that re-themes a subtree's light. Blue is the default. */
export const LIGHT_CLASS: Record<Light, string | undefined> = {
  apps: undefined,
  ai: "light-ai",
  systems: "light-systems",
  games: "light-games",
};

/** The light for a category name, e.g. "Games" -> "games". */
export function categoryLight(category: string): Light {
  for (const f of PROJECT_FILTERS) {
    if ("matches" in f && f.matches === category) return f.light;
  }
  return "apps";
}

/** A project's light: the light of its first category. */
export function projectLight(project: { categories: ReadonlyArray<string> }): Light {
  return project.categories.length > 0 ? categoryLight(project.categories[0]) : "apps";
}

/** Shorthand: the class for a project's light. */
export function projectLightClass(project: { categories: ReadonlyArray<string> }) {
  return LIGHT_CLASS[projectLight(project)];
}
