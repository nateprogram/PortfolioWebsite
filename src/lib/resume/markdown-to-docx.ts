// Client-side markdown-to-docx renderer for the resume tool.
//
// Takes the markdown Gemini produces and returns a docx Blob the
// browser can hand to <a download>. Skips the "## ATS Keywords" preamble
// (everything before the first `---`); only the resume body is exported.
//
// Lazy-loaded by the builder UI so the docx library (~200KB) isn't in
// the main bundle. Import via `await import("@/lib/resume/markdown-to-docx")`.

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
import JSZip from "jszip";

// Times New Roman 11pt is on the research doc's list of standard
// ATS-safe fonts (alongside Calibri, Arial, Helvetica). TNR's narrower
// glyphs fit ~15% more text per page than Calibri at the same size,
// which keeps a content-heavy resume on one page. Shipped on every
// major OS so recipients don't see font substitution.
const FONT = "Times New Roman";
// Section-heading underline color. Kept neutral (near-black) so the
// document reads as a traditional ATS-style resume, not a designed one.
// Colored accents are one of the cues Jobscan-style parsers and some
// AI-detector heuristics use to flag "template / machine-styled output".
const COLOR_RULE = "000000";
const BULLET_REF = "bullets";
// Half-point sizes (docx uses half-points). 22 = 11pt body, 24 = 12pt
// section heading, 40 = 20pt name. Larger than the previous Calibri
// 10pt because TNR reads smaller at the same point size.
const SIZE_BODY = 22;
const SIZE_SECTION = 24;
const SIZE_NAME = 40;

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
    // Core metadata that shows up in File → Properties on Windows /
    // mdls on macOS. We set every field that has a "tell" default:
    //   - title: the docx library leaves this blank if unset, which is
    //     fine. Previously we set "Tailored Resume" which was a hard
    //     giveaway anyone clicking Properties would see.
    //   - creator + lastModifiedBy: both default to "Un-named" when not
    //     specified. Real Word docs inherit the Windows username here.
    creator: "Nate White",
    lastModifiedBy: "Nate White",
    description: "",
    styles: {
      default: { document: { run: { font: FONT, size: SIZE_BODY } } },
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

  const rawBlob = await Packer.toBlob(doc);
  return injectWordAppMetadata(rawBlob, markdown);
}

/**
 * The docx library leaves `docProps/app.xml` as an empty <Properties/>
 * element. Real Word documents fill that file with `<Application>`,
 * `<AppVersion>`, word/character/line/paragraph counts, and a handful of
 * stock booleans. An empty Properties block is an easy "this wasn't
 * authored in Word" signal for anyone unzipping the .docx to inspect it.
 *
 * We rebuild app.xml to match what Word 2016+ produces for a fresh
 * one-page document. Word counts are computed from the actual resume
 * body so the metadata stays internally consistent with the text.
 */
async function injectWordAppMetadata(
  blob: Blob,
  originalMarkdown: string,
): Promise<Blob> {
  try {
    const buf = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(buf);

    const body = stripPreamble(originalMarkdown);
    const words = (body.match(/\S+/g) ?? []).length;
    const charactersWithSpaces = body.length;
    const characters = body.replace(/\s/g, "").length;
    // Word's "Lines" count is roughly chars-per-line at the page's
    // text-box width. 75 is a fair approximation for Calibri 10pt at
    // our 0.75" margins.
    const lines = Math.max(1, Math.ceil(charactersWithSpaces / 75));
    const paragraphs = Math.max(
      1,
      body.split(/\n\s*\n/).filter((p) => p.trim()).length,
    );
    // Single-page resume target. Even multi-page Word docs report Pages
    // as a small integer here; we never expect a resume above 2.
    const pages = body.length > 6500 ? 2 : 1;

    const appXml =
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
      `<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">` +
      `<Template>Normal.dotm</Template>` +
      `<TotalTime>1</TotalTime>` +
      `<Pages>${pages}</Pages>` +
      `<Words>${words}</Words>` +
      `<Characters>${characters}</Characters>` +
      `<Application>Microsoft Office Word</Application>` +
      `<DocSecurity>0</DocSecurity>` +
      `<Lines>${lines}</Lines>` +
      `<Paragraphs>${paragraphs}</Paragraphs>` +
      `<ScaleCrop>false</ScaleCrop>` +
      `<Company></Company>` +
      `<LinksUpToDate>false</LinksUpToDate>` +
      `<CharactersWithSpaces>${charactersWithSpaces}</CharactersWithSpaces>` +
      `<SharedDoc>false</SharedDoc>` +
      `<HyperlinksChanged>false</HyperlinksChanged>` +
      `<AppVersion>16.0000</AppVersion>` +
      `</Properties>`;

    zip.file("docProps/app.xml", appXml);
    return await zip.generateAsync({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      compression: "DEFLATE",
    });
  } catch (err) {
    // Post-processing should never fail the download. If something goes
    // wrong, fall back to the original blob (which has the rest of the
    // clean metadata already, just an empty app.xml).
    console.warn(
      `[markdown-to-docx] failed to inject Word app.xml: ${(err as Error).message}`,
    );
    return blob;
  }
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
      size: isName ? SIZE_NAME : SIZE_BODY,
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
        size: SIZE_SECTION,
        color: "1F1F1F",
      }),
    ],
    heading: HeadingLevel.HEADING_2,
  });
}

function buildBodyParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: parseInlineRuns(text, { size: SIZE_BODY }),
  });
}

function buildBulletParagraph(text: string): Paragraph {
  return new Paragraph({
    numbering: { reference: BULLET_REF, level: 0 },
    spacing: { after: 60 },
    children: parseInlineRuns(text, { size: SIZE_BODY }),
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
  const size = base.size ?? SIZE_BODY;

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
