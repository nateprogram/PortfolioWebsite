// SERVER-ONLY: builds the prompt the resume tool sends to Gemini.
//
// Assembles Nate's full body of work (public site DATA + PROJECT_DETAILS
// + the hidden EXTENDED_EXPERIENCE corpus) into one structured blob, plus
// a system prompt that locks in the style rules he cares about.
//
// Never import this from a client component. It pulls in extended-experience.ts
// which is server-only by contract.

import { DATA, PROJECT_DETAILS } from "@/data";
import { EXTENDED_EXPERIENCE } from "@/data/extended-experience";

/**
 * The system / instruction prompt. Locks the model to Nate's style rules
 * and tells it exactly what shape of output to produce. The output is
 * plain markdown so the front-end can stream + render progressively
 * without parsing JSON mid-stream.
 */
export const SYSTEM_PROMPT = `You are helping Nate White generate a tailored, ATS-friendly resume for a specific job description.

You have:
- Nate's complete body of professional and personal experience (PUBLIC SITE + EXTENDED CORPUS sections below).
- The job description he is applying for.

YOUR TASK
1. Read the job description and extract the 12-20 most important ATS keywords and phrases. These are the technologies, qualifications, methodologies, and named systems the JD says it wants. Skip filler ("strong communication", "team player") unless the JD really emphasizes them.
2. Select the most relevant projects, internships, and experiences from Nate's corpus for this specific role. Reorder them by relevance, not chronology, if that serves the JD better. Drop entries that don't help.
3. Tailor each entry's framing and vocabulary so honest experience aligns with the JD's language. Do not invent experience.
4. Produce a clean, single-column ATS-friendly resume in Markdown.

OUTPUT FORMAT (strict)

Output two sections separated by a horizontal rule. Nothing before, nothing after.

## ATS Keywords

A bulleted list of the 12-20 keywords/phrases you extracted from the JD, in order of importance.

---

(blank line, then the resume below)

# NATE WHITE
Software Engineer | <one-line role positioning tailored to the JD>
Redmond, WA · 425-518-1209 · NateWhite.dev@gmail.com
linkedin.com/in/nathan-white-799765218 · github.com/nateprogram · natewhite.dev

## Summary
<3-5 sentences. Lead with the most JD-relevant of Nate's experiences. Weave in 4-6 of the extracted ATS keywords naturally where Nate honestly has them. No fluff.>

## Technical Skills
<Bullet list with bold lead-in labels. Order by relevance to the JD. Mirror the JD's vocabulary where honest. 5-8 lines.>

## Professional Experience
<Reverse-chronological if it serves the JD; otherwise relevance order. Use Veltarium Software LLC and Spur Reply if relevant. Each role: bold role/company line, location and dates on the same line, then 3-5 tight bullets of concrete work. Lead each bullet with a verb and a specific noun, end with a metric or scope marker when honest.>

## Selected Engineering Projects
<Same shape as Experience. Each project: bold name + tagline, dates and stack on a context line, 2-4 tight bullets. Drop projects that don't help this JD. The projects file lists 8 entries; you'll usually use 3-5.>

## Education
**BS Computer Science** · DigiPen Institute of Technology · Redmond, WA · 2026

STYLE RULES (non-negotiable)
- No em dashes (—). Replace with colons, periods, semicolons, parentheticals, or commas.
- No AI-tell vocabulary: leverage, robust, comprehensive, cutting-edge, innovative, passionate, seamless, seamlessly, dive deep, delve, delving, intricate, myriad, tapestry, navigating, crucial, vital, game-changing, revolutionize, transformative, spearhead, synergy, best practice, elevate, enhance, effectively, efficiently, successfully, in today's, production-shaped, cross-functional, utilize, utilizing, orchestrate, foster, empower, unlock, streamline, holistic, spanning, architected (use "built" or "designed"), drove cross-discipline.
- No academic framing. Don't say "coursework", "capstone", "two semesters", "senior project", "school project", "DigiPen team". Projects stand on their own merit.
- Don't mention work-style preferences (hybrid / remote / onsite / relocation / comp / availability). Nate handles that conversation manually.
- Concrete metrics > adjectives. "Distributed to 10,000+ recipients" beats "scaled distribution".
- Recruiter-readable. Short sentences. Tight bullets. No walls of text.
- No emojis.
- No straight quotes around section names. No decorative dividers besides the single \`---\` between Keywords and Resume.

ANTI-FABRICATION (read carefully)
- If the JD asks for a technology Nate hasn't touched, omit it. Do not invent.
- Use the EXACT job titles from the corpus. Don't relabel "Founder & Engineer" as "Lead Software Engineer" or anything else. Copy the title verbatim.
- Use the EXACT dates from the corpus. Don't approximate "Apr 2025 - Present" to "2024 – Present" or any other shift. Copy date strings as written.
- Don't invent numbers, percentages, or metrics. The only quantitative claims allowed are ones that appear verbatim in the corpus (e.g., "10,000+ recipients", "16 generations", "~24h", "401", "19-person team", "23 scrapers", "148 features", "10 timeframes", "~11,500 lines", "42 modules", "40+ API handlers", "19-model schema"). If you want to make a quantitative claim and can't find it in the corpus, drop the number.
- Don't claim "X+ years of experience" unless Nate's dates literally support it. He's a 2026 new grad with 2020-2021 internships and ongoing personal projects since 2023.
- The Linux NAS in EXTENDED CORPUS is a UGREEN appliance with mesh VPN, NOT a hand-rolled Linux/Docker stack. Frame it accurately.
- "Production-shaped" in the corpus is a phrase Nate is moving away from. Don't reproduce it; use "production" or "live" or "deployed" instead.
`;

/**
 * Build the user-message payload that goes to Gemini.
 * Contains the full corpus then the JD.
 */
export function buildUserPrompt(jobDescription: string): string {
  const corpus = buildCorpus();
  return `# PUBLIC SITE\n\n${corpus.publicSite}\n\n# EXTENDED CORPUS (private; for your eyes only)\n\n${corpus.extended}\n\n# JOB DESCRIPTION\n\n${jobDescription.trim()}`;
}

/**
 * Renders the public DATA + the hidden EXTENDED_EXPERIENCE into prose
 * the LLM can read. Two halves so the LLM understands the trust level
 * of each piece of context.
 */
function buildCorpus(): { publicSite: string; extended: string } {
  // PUBLIC SITE: bio, education, skill chips, project cards, project deep-dives.
  const lines: string[] = [];

  lines.push(`Name: ${DATA.name}`);
  lines.push(`Role line: ${DATA.role}`);
  lines.push(`Description: ${DATA.description}`);
  lines.push("");
  lines.push("Bio (homepage About):");
  lines.push(DATA.summary);
  lines.push("");

  lines.push("Education:");
  for (const ed of DATA.education) {
    lines.push(`- ${ed.degree} · ${ed.school} · ${ed.start}–${ed.end}`);
  }
  lines.push("");

  lines.push("Skill chips (homepage):");
  for (const group of DATA.skillGroups) {
    const names = group.items.map((s) => s.name).join(", ");
    lines.push(`- ${group.label}: ${names}`);
  }
  lines.push("");

  lines.push("PROJECT CARDS (homepage grid). Each is a real project:");
  for (const p of DATA.projects) {
    lines.push("");
    lines.push(`### ${p.title}`);
    lines.push(`Slug: ${p.slug}`);
    lines.push(`Dates: ${p.dates}`);
    lines.push(`Active: ${p.active ? "yes" : "no"}`);
    lines.push(`Status: ${p.status}`);
    lines.push(`Categories: ${p.categories.join(", ")}`);
    lines.push(`Technologies: ${p.technologies.join(", ")}`);
    lines.push(`Summary: ${p.summary}`);
    lines.push(`Description: ${p.description}`);
  }
  lines.push("");

  lines.push("PROJECT DEEP-DIVES (case-study content for /projects/<slug>):");
  for (const [slug, detail] of Object.entries(PROJECT_DETAILS)) {
    lines.push("");
    lines.push(`### ${slug}`);
    if (detail.problem) lines.push(`Problem: ${detail.problem}`);
    if (detail.approach) lines.push(`Approach: ${detail.approach}`);
    if (detail.stackRationale && detail.stackRationale.length > 0) {
      lines.push("Stack rationale:");
      for (const r of detail.stackRationale) {
        lines.push(`- ${r.tech}: ${r.why}`);
      }
    }
    if (detail.highlights && detail.highlights.length > 0) {
      lines.push("Highlights:");
      for (const h of detail.highlights) lines.push(`- ${h}`);
    }
  }

  // EXTENDED CORPUS: hidden experiences and notes.
  const ext: string[] = [];
  ext.push("Hidden experiences (not shown publicly, real and usable):");
  for (const x of EXTENDED_EXPERIENCE.hiddenExperiences) {
    ext.push("");
    ext.push(`### ${x.title}`);
    ext.push(`Dates: ${x.dates}`);
    if (x.where) ext.push(`Where: ${x.where}`);
    ext.push(`Summary: ${x.summary}`);
    if (x.technologies && x.technologies.length > 0) {
      ext.push(`Technologies: ${x.technologies.join(", ")}`);
    }
    if (x.relevantFor && x.relevantFor.length > 0) {
      ext.push(`Relevant for: ${x.relevantFor.join(", ")}`);
    }
  }
  if (EXTENDED_EXPERIENCE.notes && EXTENDED_EXPERIENCE.notes.length > 0) {
    ext.push("");
    ext.push("Other facts and framing notes:");
    for (const n of EXTENDED_EXPERIENCE.notes) ext.push(`- ${n}`);
  }

  return {
    publicSite: lines.join("\n"),
    extended: ext.join("\n"),
  };
}
