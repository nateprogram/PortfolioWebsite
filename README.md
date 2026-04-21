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
| `src/data/resume.tsx`                  | All personal content: name, bio, skills, projects, PROJECT_DETAILS |
| `src/app/page.tsx`                     | Home page layout (hero, about, education, skills, projects, contact) |
| `src/app/projects/[slug]/page.tsx`     | Per-project detail page (STAR-format case study)      |
| `src/components/section/`              | Home-page sections (projects, contact)                |
| `src/components/ui/svgs/`              | Brand logos for skills section (Simple Icons, CC0)    |
| `src/app/globals.css`                  | Theme tokens, global styles                           |
| `public/`                              | Static media. See `public/README.md` for drop-zone layout. |

Most edits start in `src/data/resume.tsx`. The home page and detail pages
both pull from the `DATA` export there.

## Deploying

Push to `main`. Vercel rebuilds and deploys automatically. The custom
domain `natewhite.dev` is configured in the Vercel dashboard.

## License

Template is MIT, see [LICENSE](./LICENSE). Content (bio, project writeups,
images) is all rights reserved to Nate White.
