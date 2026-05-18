// Client-side PDF export for the resume builder.
//
// Opens a new browser window pre-loaded with the resume rendered as
// clean HTML inside a print-tuned stylesheet (Times New Roman 11pt,
// single column, ATS-friendly margins), then triggers the browser's
// print dialog so the user picks "Save as PDF". Produces a text-based
// (not raster) PDF that ATS parsers handle the same way as the .docx.
//
// Free, no dependencies — relies on `window.open` + `window.print`.

/**
 * Open a new tab containing the resume as a print-styled HTML doc and
 * trigger the print dialog. Returns true if the window opened, false
 * if the browser's popup blocker stopped it (so the caller can show
 * a "allow popups" error).
 *
 * Accepts the full builder output (META + ATS Keywords + `---` +
 * resume body); strips the preamble internally so only the resume
 * body is rendered, matching the .docx export.
 */
export function openResumePrintWindow(fullMarkdown: string): boolean {
  const body = stripPreamble(fullMarkdown);
  const html = buildResumeHtml(body);

  const win = window.open("", "_blank", "width=900,height=1100");
  if (!win) return false;

  // Use document.open/write/close so the new window's title and styles
  // load before we call .print(). Some browsers race the print dialog
  // before the stylesheet applies otherwise.
  win.document.open();
  win.document.write(html);
  win.document.close();

  // Wait one tick for layout, then print. afterprint closes the tab.
  win.addEventListener("afterprint", () => {
    try {
      win.close();
    } catch {
      // some browsers refuse window.close() on tabs they didn't open
      // programmatically — ignore
    }
  });
  // Use onload to ensure fonts/styles applied. Fall back to a
  // setTimeout if onload already fired.
  if (win.document.readyState === "complete") {
    win.print();
  } else {
    win.onload = () => win.print();
  }
  return true;
}

// ----- markdown → HTML ------------------------------------------------------

/** Drop the META + ATS Keywords + leading `---` from the full output. */
function stripPreamble(md: string): string {
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (/^---\s*$/.test(lines[i])) {
      return lines.slice(i + 1).join("\n").trimStart();
    }
  }
  return md;
}

/**
 * Convert resume markdown to clean HTML matching the .docx layout.
 * Intentionally minimal — covers exactly what the resume prompt emits:
 * # H1, ## H2, **bold**, *italic*, `-` bullets, paragraphs.
 */
function markdownToHtml(md: string): string {
  // Split on blank lines into "blocks". Each block is either a heading,
  // a list (any line starting with `-` or `*`), or a paragraph.
  const blocks = md.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const out: string[] = [];

  for (const block of blocks) {
    // H1 (the name)
    const h1Match = /^#\s+(.+)$/.exec(block);
    if (h1Match) {
      out.push(`<h1>${parseInline(h1Match[1])}</h1>`);
      continue;
    }
    // H2 (section heading) — handle either first-line H2 followed by
    // body in same block, or stand-alone H2.
    const lines = block.split("\n");
    if (lines.length === 1) {
      const h2 = /^##\s+(.+)$/.exec(lines[0]);
      if (h2) {
        out.push(`<h2>${parseInline(h2[1])}</h2>`);
        continue;
      }
    }
    // List block — every line starts with `-` or `*`.
    if (lines.every((l) => /^[-*]\s+/.test(l))) {
      const items = lines
        .map((l) => `<li>${parseInline(l.replace(/^[-*]\s+/, ""))}</li>`)
        .join("");
      out.push(`<ul>${items}</ul>`);
      continue;
    }
    // Mixed: H2 followed by paragraph(s) under it. Split.
    const firstH2 = /^##\s+(.+)$/.exec(lines[0]);
    if (firstH2) {
      out.push(`<h2>${parseInline(firstH2[1])}</h2>`);
      const rest = lines.slice(1).join("\n").trim();
      if (rest) out.push(...renderProseLines(rest));
      continue;
    }
    // Default: prose paragraph(s).
    out.push(...renderProseLines(block));
  }

  return out.join("\n");
}

/** Render arbitrary multiline prose. Splits on newlines into <p>s. */
function renderProseLines(text: string): string[] {
  return text
    .split("\n")
    .filter((l) => l.trim())
    .map((l) => `<p>${parseInline(l)}</p>`);
}

/**
 * Inline parsing: HTML-escape the text, then re-introduce **bold** /
 * *italic* markers as <strong>/<em>. Order matters: escape first so
 * any literal `<` or `&` in the text doesn't get mistaken for markup.
 */
function parseInline(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

/**
 * Build the full HTML document the print window loads. Print stylesheet
 * mirrors the .docx layout: Times New Roman 11pt body, 12pt small-caps
 * section headers with a hairline rule, 20pt centered name, 0.75"
 * margins (matches the docx renderer's 1080-twip margins).
 */
function buildResumeHtml(body: string): string {
  const inner = markdownToHtml(body);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Resume</title>
<style>
  @page { size: letter; margin: 0.75in; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    background: #fff;
    color: #000;
    font-family: "Times New Roman", Times, serif;
    font-size: 11pt;
    line-height: 1.3;
  }
  body {
    /* On-screen viewing (before the user clicks Print) gets a fake
       page outline so the user can preview the layout. */
    padding: 0.75in;
    max-width: 8.5in;
    margin: 0 auto;
  }
  h1 {
    font-size: 20pt;
    text-align: center;
    margin: 0 0 2pt 0;
    font-weight: bold;
    letter-spacing: 0.5pt;
  }
  h1 + p { text-align: center; margin: 0 0 2pt 0; }
  h2 {
    font-size: 12pt;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.5pt;
    border-bottom: 1px solid #000;
    padding-bottom: 1pt;
    margin: 10pt 0 4pt 0;
  }
  p { margin: 2pt 0; }
  ul { margin: 2pt 0 4pt 0; padding-left: 18pt; }
  li { margin: 1pt 0; }
  strong { font-weight: bold; }
  em { font-style: italic; }
  /* Print: drop the on-screen page outline (we're already on a page). */
  @media print {
    body { padding: 0; max-width: none; }
    h2 { page-break-after: avoid; }
    li, p { page-break-inside: avoid; }
  }
</style>
</head>
<body>
${inner}
</body>
</html>`;
}
