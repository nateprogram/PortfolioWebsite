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
// in projects-list.tsx with the main one first. A project in several
// categories is drawn with a gradient that holds its main light for most
// of the width and then blends into the others (projectLightStyle).

import type { CSSProperties } from "react";
import { PROJECT_FILTERS } from "./project-filters";

export type Light = "apps" | "ai" | "systems" | "games";

/** CSS class that re-themes a subtree's light. Blue is the default. */
export const LIGHT_CLASS: Record<Light, string | undefined> = {
  apps: undefined,
  ai: "light-ai",
  systems: "light-systems",
  games: "light-games",
};

/** Each light's body color, as a CSS value. */
export const LIGHT_VAR: Record<Light, string> = {
  apps: "var(--light-blue)",
  ai: "var(--light-white)",
  systems: "var(--light-gold)",
  games: "var(--light-orange)",
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

/** A project's distinct lights, main first. */
export function projectLights(project: { categories: ReadonlyArray<string> }): Light[] {
  const lights = project.categories.map(categoryLight);
  return lights.length > 0 ? [...new Set(lights)] : ["apps"];
}

/** How much of the width the main light holds before blending (percent). */
const LEAN = 55;

/**
 * For a project in more than one category: CSS variables for a gradient
 * that holds the main light for the first LEAN% and then blends into the
 * others, so it leans toward the category the project is mostly about.
 *   --paint        left-to-right, for card lines and seams
 *   --floor-paint  the same across the Grid floor's plane, which is three
 *                  viewports wide (the middle third is on screen)
 *   --brand-alt    the second light, for its share of the reflection
 * Single-category projects get nothing and stay one color.
 */
export function projectLightStyle(project: {
  categories: ReadonlyArray<string>;
}): CSSProperties | undefined {
  const lights = projectLights(project);
  if (lights.length < 2) return undefined;
  const [main, ...rest] = lights;
  const step = (100 - LEAN) / rest.length;
  const stops = (map: (pct: number) => number) =>
    [
      `${LIGHT_VAR[main]} ${map(0)}%`,
      `${LIGHT_VAR[main]} ${map(LEAN)}%`,
      ...rest.map((l, i) => `${LIGHT_VAR[l]} ${map(LEAN + step * (i + 1))}%`),
    ].join(", ");
  const toPlane = (pct: number) => Math.round((100 / 3 + pct / 3) * 100) / 100;
  return {
    "--paint": `linear-gradient(90deg, ${stops((p) => p)})`,
    "--floor-paint": `linear-gradient(90deg, ${LIGHT_VAR[main]} 0%, ${stops(toPlane)}, ${LIGHT_VAR[rest[rest.length - 1]]} 100%)`,
    "--brand-alt": LIGHT_VAR[rest[0]],
  } as CSSProperties;
}
