# Editing the site's content

Everything on natewhite.dev, the `/resume` page, and the downloadable
`/resume.pdf` is generated from plain data files in `src/data/`. You edit
data, never the pages. Each fact lives in exactly one place, so a change
shows up everywhere it appears on the next deploy.

After any edit, run:

```bash
npm run check:content
```

It takes a couple of seconds and tells you, in plain words, if something
doesn't line up (details at the bottom). `npm run build` runs it too, so a
broken edit can't deploy.

## Where each thing lives

| You want to change...                                   | Edit                                   |
| ------------------------------------------------------- | -------------------------------------- |
| Name, location, email, LinkedIn/GitHub links            | `src/data/profile.ts`                  |
| Education (homepage and resume)                         | `src/data/profile.ts` → `education`    |
| Homepage bio and hero line                              | `src/data/profile.ts` → `description`, `summary` |
| Homepage skill chips                                    | `src/data/profile.ts` → `skillGroups`  |
| A job (homepage timeline, resume, PDF)                  | `src/data/experience.ts`               |
| Resume headline, summary, skills, phone                 | `src/data/resume.ts` → `RESUME`        |
| Which projects are on the resume, and their bullets     | `src/data/resume.ts` → `PROJECT_PICKS` |
| A project card on the homepage                          | `src/data/projects-list.tsx`           |
| A project's full write-up page (`/projects/<slug>`)     | `src/data/projects/<slug>.tsx`         |
| Images and videos                                       | `public/` (see `public/README.md`)     |

The hero's "Now ·" line follows the first job in `experience.ts` with
`end: null`, so a new job updates it with no extra edit.

## Recipes

### Change a resume detail

- **Moved, new email, new LinkedIn URL:** change it once in `profile.ts`.
  The homepage, `/resume`, and the PDF all read it from there.
- **Headline, summary, skills, phone:** `resume.ts`, in the `RESUME`
  object.
- Bump `updated` in `RESUME` (for example `"Nov 2026"`); `/resume`
  shows it as "Updated Nov 2026".

### Add or edit a job

Add an entry at the **top** of `EXPERIENCE` in `experience.ts` (the list
is newest first, and the check enforces that):

```ts
{
  company: "Company, Inc.",
  companyUrl: "https://company.com",
  title: "Software Engineer",
  location: "Chicago, IL",
  start: "Jan 2027",          // "Mon YYYY"
  end: null,                  // null = Present; or "Aug 2027"
  blurb: "One line about the company, shown on the homepage only.",
  bullets: [
    "What you built or changed, with a number if there is one.",
  ],
  tags: ["Tool", "Certification"],
  projectSlug: "my-project",  // optional: links "Case study" to /projects/my-project
},
```

That one entry appears on the homepage timeline, on `/resume`, and in
the PDF.

The resume always lists **every** job. The homepage highlights jobs,
and it can show fewer but never more. To keep a job on the resume but
off the homepage, add `onHome: false`. There's no way to put a job on
the homepage without it also being on the resume.

When a job ends, set `end` to its last month, like `end: "Mar 2027"`.

### Add a project card

Add an entry to `ENTRIES` in `projects-list.tsx`. Its position in the
list is its position on the homepage.

```ts
{
  title: "My Project",
  slug: "my-project",              // lowercase-with-dashes; the page is /projects/my-project
  dates: "2026",                   // "2026", "2025 - 2026", or "Apr 2025 - Present"
  active: true,
  categories: ["Full-Stack"],      // from project-filters.ts: AI/ML, Full-Stack, Games, Systems
  summary: "Two or three sentences for the card.",
  description: "A longer paragraph for the top of the project page.",
  technologies: ["TypeScript", "Next.js"],
  links: [],                       // or [{ type: "Website", href: "https://...", icon: <Icons.globe className="size-3" /> }]
  image: "/projects/my-project/hero.png",  // optional; put the file in public/projects/my-project/
},
```

Media is optional. Without an image the card draws a generated cover.
`shots` (2-3 phone screenshots) and `video` (+ a `poster` still) are
also supported; see the comment at the top of the file.

`"Games"` projects are automatically drawn in the Game Grid's orange.

### Add a full write-up for a project

1. Create `src/data/projects/my-project.tsx`:

   ```ts
   import type { ProjectDetail } from "../types";

   export const myProject: ProjectDetail = {
     problem: "What it set out to solve.",
     approach: "Key decisions, as markdown.",
     highlights: ["Scope or outcome, with numbers."],
     figures: [
       { src: "/projects/my-project/screen.png", alt: "What the image shows.", caption: "Optional." },
     ],
   };
   ```

   Every field is optional; `types.ts` documents the rest (code
   snippets, stack rationale, phone galleries).

2. Register it in `src/data/project-details.ts`: one import line and one
   `"my-project": myProject,` line.

### Put a project on the resume

Add it to `PROJECT_PICKS` in `resume.ts` by slug. The name and dates
come from its card, so they can't disagree with the homepage:

```ts
{
  slug: "my-project",
  tagline: "Short description",
  stack: "TypeScript, Next.js",
  bullets: ["What you did, with a number."],
},
```

Add `name: "..."` to use a shorter name than the card's title. For a
project with no card on the site, leave out `slug` and give `name`
and `dates` yourself.

### Add a homepage skill chip

Add it to a group in `skillGroups` in `profile.ts` (an icon component
from `src/components/ui/svgs/`). It must also appear in the resume's
`skills` in `resume.ts`; the check enforces that, for the same reason
as jobs.

## What the check enforces

**Errors** stop `npm run check:content` and the build:

- Every job on the homepage is on the resume, and every homepage skill
  chip is in the resume's skills.
- Jobs are newest first, dates look like `"Jul 2026"`, and nothing ends
  before it starts.
- Every slug a job or the resume points at has a project card, and
  every write-up in `project-details.ts` has a card too.
- Card slugs are unique, categories match a filter, and card dates look
  like `"2024"`, `"2023 - 2024"`, or `"Apr 2025 - Present"`.
- Every image, video, poster, and screenshot path exists under `public/`.
- `{{code:id}}` markers in a write-up match a code snippet's `id`.
- No em dashes in anything a visitor or recruiter reads.
- The PDF fits on one page. This one is checked by `npm run build`,
  when the PDF is generated.

**Warnings** print but don't block:

- A current job with no bullets yet.
- Resume wording that reads as AI-written (leverage, robust, seamless,
  spearheaded, and similar).
- A video with no poster, or a hidden project nothing links to.

If the PDF runs long, trim a bullet or drop a project from
`PROJECT_PICKS`. Check the printed `/resume` page too (Print button):
it uses the same sizes as the PDF.
