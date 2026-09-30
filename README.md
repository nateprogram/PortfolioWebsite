# nate-portfolio

Source for [natewhite.dev](https://natewhite.dev), Nate White's portfolio
site. Next.js 16 App Router, TypeScript, Tailwind, shadcn/ui, and Magic UI,
deployed on Vercel.

Forked from [dillionverma/portfolio](https://github.com/dillionverma/portfolio)
(MIT).

## Local dev

```bash
npm install
npm run dev
```

Dev server runs at http://localhost:3000.

## Where things live

| Path                                   | What's in it                                          |
| -------------------------------------- | ----------------------------------------------------- |
| `src/data/experience.ts`               | Work history. **A new job is one entry here.**        |
| `src/data/resume.ts`                   | The resume as data: headline, summary, skills, projects |
| `src/data/profile.ts`                  | Bio, contact links, skill chips, dock items           |
| `src/data/projects-list.tsx`           | Project cards on the homepage                         |
| `src/data/projects/<slug>.tsx`         | Per-project deep dives (STAR-style case studies)      |
| `src/app/page.tsx`                     | Home: hero, about, experience, projects, skills, education, contact |
| `src/app/resume/page.tsx`              | `/resume`, the resume as a web page (print-ready)     |
| `src/app/resume.pdf/route.tsx`         | `/resume.pdf`, generated from the same data at build  |
| `src/app/projects/[slug]/page.tsx`     | Per-project detail page                               |
| `src/lib/particles.ts`                 | TS port of the Mayhem Engine emitter (hero + playground) |
| `src/components/section/`              | Home-page sections (experience, projects, contact)    |
| `src/app/globals.css`                  | Theme tokens (incl. the `--brand` accent), effects, print styles |
| `public/`                              | Static media. See `public/README.md` for drop-zone layout. |

### Updating the resume

The homepage Experience timeline, `/resume`, `/resume.pdf`, and the ATS
keyword tool's `RESUME_TEXT` all read from `experience.ts` + `resume.ts`.
Edit those, push, and every copy updates on the next deploy. There's no
PDF to re-export by hand. Bump `RESUME.updated` when the content changes.

## Deploying

Push to `main`. Vercel rebuilds and deploys automatically. The custom
domain `natewhite.dev` is configured in the Vercel dashboard.

## License

Template is MIT, see [LICENSE](./LICENSE). Content (bio, project writeups,
images) is all rights reserved to Nate White.
