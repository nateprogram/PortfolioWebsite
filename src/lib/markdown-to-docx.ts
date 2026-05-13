// Client-side markdown-to-docx renderer for the resume tool.
//
// Takes the markdown Gemini produces and returns a docx Blob the
// browser can hand to <a download>. Skips the "## ATS Keywords" preamble
// (everything before the first `---`); only the resume body is exported.
//
// Lazy-loaded by the builder UI so the docx library (~200KB) isn't in
// the main bundle. Import via `await import("@/lib/markdown-to-docx")`.

import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  PageOrientation,
  Paragraph,
  TextRun,
} from "docx";

const FONT = "Calibri";
// Section-heading underline color. Kept neutral (near-black) so the
// document reads as a traditional ATS-style resume, not a designed one.
// Colored accents are one of the cues Jobscan-style parsers and some
// AI-detector heuristics use to flag "template / machine-styled output".
const COLOR_RULE = "000000";
const BULLET_REF = "bullets";

/** Render a markdown resume to a Blob ready for download. */
export async function renderResumeToDocxBlob(
  markdown: string,
): Promise<Blob> {
  const { headerLines, sections } = parseMarkdownResume(markdown);

  const children: Paragraph[] = [];

  // Header block: name + role line + contact lines, centered.
  for (const line of headerLines) {
    children.push(buildHeaderParagraph(line));
  }

  // Body sections.
  for (const section of sections) {
    children.push(buildSectionHeading(section.heading));
    for (const block of section.blocks) {
      if (block.kind === "bullet") {
        children.push(buildBulletParagraph(block.text));
      } else {
        children.push(buildBodyParagraph(block.text));
      }
    }
  }

  const doc = new Document({
    creator: "Nate White",
    title: "Tailored Resume",
    styles: {
      default: { document: { run: { font: FONT, size: 20 } } }, // 10pt
    },
    numbering: {
      config: [
        {
          reference: BULLET_REF,
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: { indent: { left: 360, hanging: 220 } },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 12240,
              height: 15840,
              orientation: PageOrientation.PORTRAIT,
            },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

// ----- markdown parsing -----------------------------------------------------

type Block =
  | { kind: "para"; text: string }
  | { kind: "bullet"; text: string };

type Section = {
  heading: string;
  blocks: Block[];
};

type Parsed = {
  /** Lines under the `# NAME` heading (role line, contact lines). */
  headerLines: string[];
  sections: Section[];
};

/**
 * Strip the `## ATS Keywords ... ---` preamble, then split the resume
 * body into ordered sections. Tolerates the model dropping or
 * re-ordering sections; just renders whatever's there.
 */
function parseMarkdownResume(md: string): Parsed {
  const body = stripPreamble(md);
  const lines = body.split("\n");

  const headerLines: string[] = [];
  const sections: Section[] = [];
  let current: Section | null = null;
  let inHeader = false;
  let headerStartIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();

    // The `# NAME` line opens the header block.
    if (line.startsWith("# ")) {
      inHeader = true;
      headerStartIdx = i;
      continue;
    }

    if (line.startsWith("## ")) {
      // Closes the header block (if any) and starts a new section.
      if (inHeader) {
        for (let h = headerStartIdx + 1; h < i; h++) {
          const t = lines[h].trim();
          if (t) headerLines.push(t);
        }
        inHeader = false;
      }
      current = { heading: line.slice(3).trim(), blocks: [] };
      sections.push(current);
      continue;
    }

    if (inHeader) {
      // Headers are accumulated when we close the block above; skip here.
      continue;
    }

    if (!current) {
      // Free text before any heading. Treat as header lines so it's not
      // dropped silently.
      if (line) headerLines.push(line);
      continue;
    }

    if (!line) continue; // collapse blank lines inside a section

    if (line.startsWith("- ") || line.startsWith("* ")) {
      current.blocks.push({ kind: "bullet", text: line.slice(2).trim() });
    } else {
      current.blocks.push({ kind: "para", text: line });
    }
  }

  // Flush header block if the file ends without ever opening a section.
  if (inHeader) {
    for (let h = headerStartIdx + 1; h < lines.length; h++) {
      const t = lines[h].trim();
      if (t) headerLines.push(t);
    }
  }

  return { headerLines, sections };
}

/**
 * Drop everything before the first standalone `---` line. The model
 * puts ATS Keywords before that separator and the resume body after.
 * If no separator is present, return the input unchanged.
 */
function stripPreamble(md: string): string {
  const lines = md.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (/^---\s*$/.test(lines[i])) {
      return lines.slice(i + 1).join("\n");
    }
  }
  return md;
}

// ----- paragraph builders ---------------------------------------------------

function buildHeaderParagraph(line: string): Paragraph {
  // The first non-empty line of the parsed header is the name (because
  // the `# NAME` line itself was the trigger, not stored). Render the
  // first-encountered line larger and bolder than the rest.
  // The caller doesn't track ordinal here, so we approximate: any line
  // that is ALL UPPERCASE (e.g. "NATE WHITE") is treated as the name.
  const isName = /^[A-Z][A-Z\s.\-']+$/.test(line);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: isName ? 80 : 40 },
    children: parseInlineRuns(line, {
      size: isName ? 36 : 20,
      bold: isName,
    }),
  });
}

function buildSectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 80 },
    border: {
      bottom: {
        style: BorderStyle.SINGLE,
        size: 6,
        color: COLOR_RULE,
        space: 4,
      },
    },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        font: FONT,
        bold: true,
        size: 22,
        color: "1F1F1F",
      }),
    ],
    heading: HeadingLevel.HEADING_2,
  });
}

function buildBodyParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: parseInlineRuns(text, { size: 20 }),
  });
}

function buildBulletParagraph(text: string): Paragraph {
  return new Paragraph({
    numbering: { reference: BULLET_REF, level: 0 },
    spacing: { after: 60 },
    children: parseInlineRuns(text, { size: 20 }),
  });
}

// ----- inline run parser ----------------------------------------------------

type RunOpts = {
  size?: number;
  bold?: boolean;
  italic?: boolean;
};

// Note: docx's TextRun expects `italics` (with the trailing s); the
// `italic` field on our internal RunOpts is the boolean we toggle as we
// scan markdown asterisks. We translate at the TextRun construction
// site below.

/**
 * Split a line into `TextRun`s, picking up **bold** and *italic*
 * markers. Nothing fancy: pairwise scanning, no nested combos. Good
 * enough for the resume markdown we generate.
 */
function parseInlineRuns(line: string, base: RunOpts): TextRun[] {
  const runs: TextRun[] = [];
  let i = 0;
  let buffer = "";
  let bold = base.bold ?? false;
  let italic = base.italic ?? false;
  const size = base.size ?? 20;

  const flush = () => {
    if (!buffer) return;
    runs.push(
      new TextRun({ text: buffer, font: FONT, bold, italics: italic, size }),
    );
    buffer = "";
  };

  while (i < line.length) {
    if (line.startsWith("**", i)) {
      flush();
      bold = !bold;
      i += 2;
      continue;
    }
    // Single-asterisk italic, but only if it isn't part of a `**`.
    if (line[i] === "*") {
      flush();
      italic = !italic;
      i += 1;
      continue;
    }
    buffer += line[i];
    i += 1;
  }
  flush();
  return runs;
}
