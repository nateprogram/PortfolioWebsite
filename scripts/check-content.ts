// Content check: `npm run check:content`. Also runs at the start of
// `npm run build`, so a broken edit to src/data fails the deploy with a
// readable message instead of shipping a broken page or resume.
//
// Errors fail the run. Warnings print but pass. CONTENT.md explains how
// to fix each kind of problem.

import fs from "node:fs";
import path from "node:path";
import {
  DATA,
  EXPERIENCE,
  HOME_EXPERIENCE,
  PROJECT_DETAILS,
  PROJECT_FILTERS,
  RESUME,
  SKILLS,
  type ExperienceEntry,
} from "@/data";

const errors: string[] = [];
const warnings: string[] = [];
const error = (where: string, msg: string) => errors.push(`${where}: ${msg}`);
const warn = (where: string, msg: string) => warnings.push(`${where}: ${msg}`);

const PUBLIC_DIR = path.join(process.cwd(), "public");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_YEAR = new RegExp(`^(${MONTHS.join("|")}) \\d{4}$`);
// "2024", "2023 - 2024", "Apr 2025 - Present"
const DATE_RANGE = new RegExp(
  `^((${MONTHS.join("|")}) )?\\d{4}( - (((${MONTHS.join("|")}) )?\\d{4}|Present))?$`
);
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Writing rules for anything a recruiter reads (from extended-experience.ts).
const AI_TELLS = [
  "leverage", "leveraged", "leveraging", "robust", "comprehensive", "seamless",
  "seamlessly", "delve", "dive deep", "intricate", "crucial", "vital",
  "transformative", "spearhead", "spearheaded", "synergy", "holistic",
  "streamline", "streamlined", "in today's",
];

const monthIndex = (s: string) => {
  const [m, y] = s.split(" ");
  return Number(y) * 12 + MONTHS.indexOf(m);
};

/** A path under /public must exist; remote URLs are taken on trust. */
function checkAsset(where: string, src: string | undefined) {
  if (!src || /^https?:\/\//.test(src)) return;
  if (!src.startsWith("/")) {
    error(where, `"${src}" should start with "/" (paths are relative to public/)`);
    return;
  }
  if (!fs.existsSync(path.join(PUBLIC_DIR, src))) {
    error(where, `file not found: public${src}`);
  }
}

/** Every string inside `value`, with a readable path for messages. */
function* strings(value: unknown, at: string): Generator<[string, string]> {
  if (typeof value === "string") yield [at, value];
  else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* strings(value[i], `${at}[${i}]`);
  } else if (value && typeof value === "object" && !("$$typeof" in value)) {
    for (const [k, v] of Object.entries(value)) {
      // Real code excerpts and icon components aren't prose.
      if (k === "code" || k === "icon") continue;
      yield* strings(v, at.includes(" > ") || at.endsWith("]") ? `${at}.${k}` : `${at} > ${k}`);
    }
  }
}

function checkWriting(value: unknown, at: string, vocabulary: boolean) {
  for (const [where, text] of strings(value, at)) {
    if (text.includes("—")) error(where, "uses an em dash; use a period, comma, or colon");
    if (!vocabulary) continue;
    for (const word of AI_TELLS) {
      if (new RegExp(`\\b${word}\\b`, "i").test(text)) {
        warn(where, `"${word}" reads as AI-written; say what happened instead`);
      }
    }
  }
}

const cardSlugs = new Set(DATA.projects.map((p) => p.slug));
const roleName = (e: ExperienceEntry) => `${e.title} at ${e.company} (${e.start})`;

// ---------------------------------------------------------------- experience
{
  const at = "experience.ts";
  const seen = new Set<string>();
  EXPERIENCE.forEach((e, i) => {
    const where = `${at} > ${roleName(e)}`;
    for (const key of ["company", "title", "location", "start"] as const) {
      if (!e[key]?.trim()) error(where, `missing ${key}`);
    }
    if (!MONTH_YEAR.test(e.start)) error(where, `start "${e.start}" should look like "Jul 2026"`);
    if (e.end !== null && !MONTH_YEAR.test(e.end)) {
      error(where, `end "${e.end}" should look like "Aug 2021", or null for Present`);
    }
    if (e.end !== null && MONTH_YEAR.test(e.start) && MONTH_YEAR.test(e.end) && monthIndex(e.end) < monthIndex(e.start)) {
      error(where, "ends before it starts");
    }
    if (e.companyUrl && !/^https:\/\//.test(e.companyUrl)) error(where, "companyUrl should start with https://");
    if (e.projectSlug && !cardSlugs.has(e.projectSlug)) {
      error(where, `projectSlug "${e.projectSlug}" has no card in projects-list.tsx`);
    }
    const key = `${e.company}|${e.title}|${e.start}`;
    if (seen.has(key)) error(where, "listed twice");
    seen.add(key);
    if (e.end === null && e.bullets.length === 0) {
      warn(where, "current role has no bullets yet; add 2-3 in experience.ts");
    }
    // Newest first: current roles, then by end date, then by start date.
    const prev = EXPERIENCE[i - 1];
    if (prev && MONTH_YEAR.test(e.start) && MONTH_YEAR.test(prev.start)) {
      const rank = (x: ExperienceEntry) => [x.end === null ? Infinity : monthIndex(x.end), monthIndex(x.start)];
      const [pe, ps] = rank(prev);
      const [ce, cs] = rank(e);
      if (ce > pe || (ce === pe && cs > ps)) {
        error(where, `should come before ${roleName(prev)} (newest first)`);
      }
    }
  });
  if (HOME_EXPERIENCE.length === 0) warn(at, "every role has onHome: false, so the homepage timeline is empty");
}

// ----------------------------------------------------- homepage vs. resume
{
  // The resume can hold more than the homepage, never less.
  const onResume = new Set(RESUME.experience.map((e) => `${e.company}|${e.title}|${e.start}`));
  for (const e of HOME_EXPERIENCE) {
    if (!onResume.has(`${e.company}|${e.title}|${e.start}`)) {
      error(`resume.ts`, `${roleName(e)} is on the homepage but missing from the resume`);
    }
  }
}

// -------------------------------------------------------------------- skills
{
  const at = "skills.ts";
  const ids = new Set<string>();
  for (const s of SKILLS) {
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.id)) error(`${at} > ${s.name}`, `id "${s.id}" should be lowercase-with-dashes`);
    if (ids.has(s.id)) error(`${at} > ${s.name}`, `id "${s.id}" is used twice`);
    ids.add(s.id);
  }
  // The resume's skills are built from the same list; make sure nobody
  // swapped in a hand-written copy.
  const resumeSkills = RESUME.skills.flatMap((g) => g.items.split(", "));
  for (const s of SKILLS) {
    if (!resumeSkills.includes(s.name)) error("resume.ts > skills", `"${s.name}" is in skills.ts but not on the resume`);
  }
  const noProof = SKILLS.filter((s) => s.projects.length === 0 && s.roles.length === 0);
  if (noProof.length > 0) {
    warn(
      at,
      `nothing on the site shows: ${noProof.map((s) => s.name).join(", ")}. ` +
        "Fine to keep (plain chip); to link it, add it to a card's technologies or a job's tags"
    );
  }
}

// ------------------------------------------------------------------ projects
{
  const at = "projects-list.tsx";
  const filterValues = new Set<string>(
    PROJECT_FILTERS.flatMap((f) => ("matches" in f ? [f.matches] : []))
  );
  const seen = new Set<string>();
  const linkedFromExperience = new Set(EXPERIENCE.map((e) => e.projectSlug));
  for (const p of DATA.projects) {
    const where = `${at} > ${p.title}`;
    if (!SLUG.test(p.slug)) error(where, `slug "${p.slug}" should be lowercase-with-dashes`);
    if (seen.has(p.slug)) error(where, `slug "${p.slug}" is used twice`);
    seen.add(p.slug);
    if (!DATE_RANGE.test(p.dates)) {
      error(where, `dates "${p.dates}" should look like "2024", "2023 - 2024", or "Apr 2025 - Present"`);
    }
    if (!p.summary.trim()) error(where, "missing summary (the card text)");
    if (!p.description.trim()) error(where, "missing description");
    if (p.categories.length === 0) error(where, "needs at least one category");
    for (const c of p.categories) {
      if (!filterValues.has(c)) {
        error(where, `category "${c}" isn't a filter in project-filters.ts (${[...filterValues].join(", ")})`);
      }
    }
    checkAsset(`${where} > image`, p.image);
    checkAsset(`${where} > video`, p.video);
    checkAsset(`${where} > poster`, p.poster);
    p.shots?.forEach((s, i) => checkAsset(`${where} > shots[${i}]`, s));
    if (p.video && !p.poster) warn(where, "video has no poster; the card is blank until it scrolls into view");
    for (const l of p.links) {
      if (!/^(https?:\/\/|mailto:|\/)/.test(l.href)) error(`${where} > links`, `"${l.href}" isn't a URL`);
    }
    if (p.hideFromGrid && !linkedFromExperience.has(p.slug)) {
      warn(where, "hideFromGrid is set and no experience entry links to it, so nothing on the site leads to its page");
    }
  }
}

// --------------------------------------------------------------- deep dives
{
  const at = "project-details.ts";
  for (const [slug, d] of Object.entries(PROJECT_DETAILS)) {
    const where = `projects/${slug}.tsx`;
    if (!cardSlugs.has(slug)) error(at, `"${slug}" has no card in projects-list.tsx, so its page never builds`);
    d.figures?.forEach((f, i) => {
      if ("src" in f) checkAsset(`${where} > figures[${i}]`, f.src);
      if ("phones" in f) f.phones.forEach((ph, j) => checkAsset(`${where} > figures[${i}].phones[${j}]`, ph.src));
    });
    const ids = new Set<string>();
    for (const c of d.codeSnippets ?? []) {
      if (ids.has(c.id)) error(where, `code snippet id "${c.id}" is used twice`);
      ids.add(c.id);
    }
    for (const m of (d.approach ?? "").matchAll(/\{\{code:([^}]+)\}\}/g)) {
      if (!ids.has(m[1])) error(where, `approach references {{code:${m[1]}}} but no snippet has that id`);
    }
    checkWriting(d, where, false);
  }
}

// -------------------------------------------------------------------- resume
{
  const at = "resume.ts > projects";
  for (const p of RESUME.projects) {
    if (p.slug && !cardSlugs.has(p.slug)) error(at, `"${p.slug}" has no card in projects-list.tsx`);
    if (!p.dates) error(`${at} > ${p.name}`, "has no dates");
  }
  if (!MONTH_YEAR.test(RESUME.updated)) error("resume.ts", `updated "${RESUME.updated}" should look like "Oct 2026"`);
}

// ------------------------------------------------------------------- writing
for (const e of EXPERIENCE) checkWriting(e, `experience.ts > ${roleName(e)}`, true);
checkWriting(
  { headline: RESUME.headline, summary: RESUME.summary, skills: RESUME.skills, projects: RESUME.projects },
  "resume.ts",
  true
);
checkWriting(
  DATA.projects.map(({ title, summary, description }) => ({ title, summary, description })),
  "projects-list.tsx",
  false
);
checkWriting({ description: DATA.description, summary: DATA.summary }, "profile.ts", false);

// The one-page rule for resume.pdf is enforced where the PDF is built:
// src/app/resume.pdf/route.tsx fails `next build` if it runs long.

// ------------------------------------------------------------------- report
for (const w of warnings) console.warn(`  warn   ${w}`);
for (const e of errors) console.error(`  error  ${e}`);
if (errors.length > 0) {
  console.error(`\nContent check failed: ${errors.length} error(s). See CONTENT.md.`);
  process.exit(1);
}
console.log(
  `Content check passed: ${EXPERIENCE.length} roles (${HOME_EXPERIENCE.length} on the homepage), ` +
    `${DATA.projects.length} project cards, ${Object.keys(PROJECT_DETAILS).length} deep dives` +
    (warnings.length ? `, ${warnings.length} warning(s)` : "") +
    "."
);
