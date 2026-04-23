import { codeToHtml, type BundledLanguage } from "shiki";

// Server-side syntax highlighter used for the portfolio's inline code
// snippets. Runs at build / render time in the (server) project page, so
// the client bundle never sees shiki — we just ship the pre-generated HTML.
//
// Theme is "dark-plus" (Microsoft's VS Code Dark+), so a reader who spends
// their day in VS Code recognizes the colors immediately.

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
      theme: "dark-plus",
    });
  } catch (err) {
    // Grammar failed to load (rare — bundled list is small), or shiki died.
    // Swallow so the page still renders; InlineCodeSnippet has a plain-text
    // fallback path.
    console.warn(
      `[highlight] shiki failed for language "${language}":`,
      err
    );
    return null;
  }
}
