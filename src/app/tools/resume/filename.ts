// Filename builders for the resume / cover-letter download buttons.
// Format: `Nate_White_<Position>_<Company>.docx`, falling back to a
// dated name when META is missing.

import { parseMeta } from "./parsers";

/** Drop path separators and control chars; collapse whitespace to underscores; cap length. */
export function sanitizeFilenamePart(s: string): string {
  return s
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 60);
}

/** Resume filename. Prefers position + company; falls back to a date if META missing. */
export function buildDownloadFilename(output: string): string {
  const { company, position } = parseMeta(output);
  const parts = ["Nate_White"];
  if (position) parts.push(sanitizeFilenamePart(position));
  if (company) parts.push(sanitizeFilenamePart(company));
  if (parts.length === 1) {
    parts.push("Resume", new Date().toISOString().slice(0, 10));
  }
  return parts.filter(Boolean).join("_") + ".docx";
}

/** Cover-letter filename. Same shape, tagged `Cover_Letter`. */
export function buildCoverLetterFilename(output: string): string {
  const { company, position } = parseMeta(output);
  const parts = ["Nate_White", "Cover_Letter"];
  if (position) parts.push(sanitizeFilenamePart(position));
  if (company) parts.push(sanitizeFilenamePart(company));
  if (parts.length === 2) {
    parts.push(new Date().toISOString().slice(0, 10));
  }
  return parts.filter(Boolean).join("_") + ".docx";
}
