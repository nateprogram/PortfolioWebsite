// GET /resume.pdf, generated from src/data/resume.ts at build time.
//
// `force-static` renders this once per deploy and serves it from the CDN,
// so the download always matches /resume and there's no PDF to re-export
// by hand when a job or bullet changes. The document itself lives in
// src/lib/resume-pdf.tsx.

import { countPdfPages, renderResumePdf } from "@/lib/resume-pdf";

export const dynamic = "force-static";
export const runtime = "nodejs";

export async function GET() {
  const pdf = await renderResumePdf();
  // The resume is one page. This runs during `next build`, so an edit
  // that pushes it onto a second page fails the build instead of
  // shipping quietly.
  const pages = countPdfPages(pdf);
  if (pages !== 1) {
    throw new Error(
      `resume.pdf runs to ${pages} pages; it must fit on one. Trim a bullet or a project in src/data/resume.ts or src/data/experience.ts (see CONTENT.md).`
    );
  }
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="Nate-White-Resume.pdf"',
    },
  });
}
