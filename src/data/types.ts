// Shared types for the portfolio data layer.
//
// The runtime payload (DATA, PROJECT_DETAILS, PROJECT_FILTERS) is split across
// several sibling files for readability; these types are the contracts every
// piece is expected to satisfy.

/**
 * One row in a project's "stack rationale" table — what we picked, and why.
 */
export type StackRationaleItem = {
  tech: string;
  why: string;
};

/**
 * A figure rendered inline with the project's Approach prose.
 *
 * Two flavors:
 *   - `src` form points at a static asset under `/public` (rendered via
 *     LightboxFigure with click-to-zoom).
 *   - `diagram` form swaps in a hand-built React component, keyed by id.
 *     The page renderer maps the id to the actual component, so each new
 *     diagram needs both a string literal here and a case in the renderer.
 */
export type Figure =
  | { src: string; alt: string; caption?: string }
  | {
      diagram: "stockai-dataflow" | "ga-scatter";
      alt: string;
      caption?: string;
    };

/**
 * A real code excerpt the page renders behind an expander.
 *
 * Each snippet has an `id`. Approach prose can splice the snippet inline
 * with a `{{code:<id>}}` placeholder so the code sits next to the text
 * that talks about it.
 */
export type CodeSnippet = {
  id: string;
  title: string;
  description?: string;
  language: string;
  code: string;
};

/**
 * The deep-dive content for a single project, rendered on /projects/[slug].
 *
 * Loosely STAR-shaped:
 *   problem        what the project set out to solve
 *   approach       key decisions made (may include `{{code:<id>}}` markers)
 *   stackRationale each piece of tech paired with why it was chosen
 *   highlights     scope and outcome bullets
 *   figures        diagrams or screenshots inline with the approach
 *   codeSnippets   real code behind expandables, referenced by id
 *
 * Every field is optional. A project needs an entry only if there's real
 * content to show; missing entries fall back to the short description plus
 * a "more to come" footer.
 */
export type ProjectDetail = {
  problem?: string;
  approach?: string;
  stackRationale?: ReadonlyArray<StackRationaleItem>;
  highlights?: ReadonlyArray<string>;
  figures?: ReadonlyArray<Figure>;
  codeSnippets?: ReadonlyArray<CodeSnippet>;
};
