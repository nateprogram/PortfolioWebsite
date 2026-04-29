import { codeToHtml, type BundledLanguage } from "shiki";

// Server-side syntax highlighter used for the portfolio's inline code
// snippets. Runs at build / render time in the (server) project page, so
// the client bundle never sees shiki; we just ship the pre-generated HTML.
//
// Uses shiki's *dual theme* mode: both "light-plus" (VS Code Light+) and
// "dark-plus" (VS Code Dark+) colors are written into the HTML as CSS
// custom properties (`--shiki-light`, `--shiki-dark`). The site's
// `globals.css` then flips between them based on the `.dark` class on
// `<html>`. That means the same rendered snippet looks correct in both
// color modes: light mode readers get the familiar Light+ palette on a
// light background instead of a jarring black inline block.

// Map the loose language labels we author in `resume.tsx` to shiki's bundled
// grammar names. Anything not in this table falls through to a plaintext
// block rather than crashing the page.
const LANG_ALIASES: Record<string, BundledLanguage> = {
  cpp: "cpp",
  "c++": "cpp",
  c: "c",
  h: "cpp",
  hpp: "cpp",
  python: "python",
  py: "python",
  ts: "ts",
  typescript: "ts",
  tsx: "tsx",
  js: "js",
  javascript: "js",
  jsx: "jsx",
  json: "json",
  bash: "bash",
  sh: "bash",
  shell: "bash",
  glsl: "glsl",
  hlsl: "hlsl",
  xml: "xml",
  html: "html",
  css: "css",
  md: "md",
  markdown: "md",
  sql: "sql",
  rust: "rust",
  rs: "rust",
  go: "go",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
};

export async function highlightCode(
  code: string,
  language: string
): Promise<string | null> {
  const lang = LANG_ALIASES[language.trim().toLowerCase()];
  try {
    return await codeToHtml(code, {
      lang: lang ?? "text",
      themes: {
        // Keys here become the CSS-variable suffixes on every span
        // (`--shiki-light`, `--shiki-dark`). `defaultColor: false` stops
        // shiki from writing an inline `color:` / `background-color:`
        // fallback that would pin the snippet to one theme regardless
        // of the site's current color mode.
        light: "light-plus",
        dark: "dark-plus",
      },
      defaultColor: false,
    });
  } catch (err) {
    // Grammar failed to load (rare, bundled list is small), or shiki died.
    // Swallow so the page still renders; InlineCodeSnippet has a plain-text
    // fallback path.
    console.warn(
      `[highlight] shiki failed for language "${language}":`,
      err
    );
    return null;
  }
}
