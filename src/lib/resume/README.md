# Resume tool — architecture map

Quick reference for navigating the resume-builder code. Update this when files move.

## End-to-end flow

```
 user                     /api/resume                 model
 ─────                    ─────────────                 ─────
  │                          │                           │
  │ paste JD ─► generate     │                           │
  │ ───────────────────────► │                           │
  │                          │ build user prompt         │
  │                          │ (corpus + JD)             │
  │                          │ ───────────────────────►  │ Gemini Flash
  │                          │                           │ streams md
  │  stream md ◄─────────────│ ◄─────────────────────────│
  │                          │
  │ checkResume(md)          │
  │  ↳ hard fails? ─► auto-retry via /api/resume (same loop, retry: {…})
  │  ↳ pass? ─► /api/resume/judge ─► Groq Llama 3.3 70B critic
  │  ↳ judge issues? ─► auto-retry (same loop, with judge findings)
  │
  │ accepted ─► /api/resume/save ─► KV (Upstash Redis)
  │ download ─► /lib/resume/markdown-to-docx (DOCX) or /lib/markdown-to-pdf (print)
```

Max 2 attempts per generation (1 initial + 1 retry). Tuned in `app/tools/resume/builder.tsx` (`MAX_AUTO_ATTEMPTS`).

## Where to look for X

| If you want to change… | Edit |
| --- | --- |
| The system prompt / model instructions | [`prompt.ts`](./prompt.ts) — `SYSTEM_PROMPT` + `buildUserPrompt` |
| The corpus the model sees | [`prompt.ts`](./prompt.ts) — `buildCorpus()`, which reads `src/data/profile.ts`, `src/data/projects-list.tsx`, `src/data/extended-experience.ts` |
| Heuristic quality checks (banlist, dashes, sections, etc.) | [`checks.ts`](./checks.ts) — `checkResume()` and the per-check helpers |
| The Groq / Llama judge prompt | [`judge.ts`](./judge.ts) — `SYSTEM_PROMPT` constant |
| How resumes are saved / fetched / deleted | [`store.ts`](./store.ts) — uses `@vercel/kv` |
| DOCX rendering (fonts, layout, metadata) | [`markdown-to-docx.ts`](./markdown-to-docx.ts) — Calibri 10pt, single column, Word-shaped app.xml |
| The Gemini SDK call (model name, safety, retries) | `src/lib/ai/gemini.ts` — the GeminiProvider adapter. Model + key list configured in `src/lib/ai/registry.ts`; chain order in `src/lib/ai/roles.ts`. |
| Auth gate (the magic-URL unlock cookie) | `src/lib/resume-auth.ts` (one level up; shared) |
| JD URL → text scraping | `src/app/api/resume/fetch-jd/route.ts` + `src/lib/html-to-text.ts` |
| JD-match scoring (Jobscan-like %) | `src/lib/jd-match-score.ts` (one level up) |
| The Builder UI (page itself) | `src/app/tools/resume/builder.tsx` (main component, ~1300 lines), `subcomponents.tsx` (UI pills + panels), `parsers.ts` (pure parsers), `filename.ts` (download names) |

## API routes (`src/app/api/resume/`)

| Route | Purpose |
| --- | --- |
| `route.ts` | `POST` — generate. Takes JD + optional retry context, streams Gemini's markdown back. |
| `save/route.ts` | `POST` — persist an accepted resume to KV. Called once per generation after retries settle. |
| `history/route.ts` | `GET` — list saved resumes (newest first). |
| `[id]/route.ts` | `GET` — fetch one. `DELETE` — remove one. |
| `unlock/route.ts` | `GET ?key=…` — validate the magic key, set the 90-day session cookie. |
| `fetch-jd/route.ts` | `POST` — given a job-posting URL, fetch and extract the JD text. |
| `judge/route.ts` | `POST` — run the Groq/Llama judge pass. Gated by `ENABLE_JUDGE_PASS` env var. |

## Env vars (mirror in Vercel + `.env.local`)

| Var | What it's for |
| --- | --- |
| `GOOGLE_AI_API_KEY` | Primary Gemini key. Required. |
| `GOOGLE_AI_API_KEY_BACKUP` | Fallback Gemini key (separate quota). Optional; route logs warning and proceeds without. |
| `RESUME_TOOL_KEY` | Magic-URL unlock secret. Required to access the tool. |
| `GROQ_API_KEY` | Judge-pass key. Optional; judge silently skips if missing. |
| `ENABLE_JUDGE_PASS` | `"false"` / `"0"` to disable the judge without removing the key. |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` (+ `KV_REST_API_READ_ONLY_TOKEN`, `KV_URL`) | Upstash Redis for save / history. All four optional — saves degrade to no-ops with a console warning. |

## Test scripts (`scripts/`)

| Script | What it does |
| --- | --- |
| `test-checks.mts` | Unit tests for `checks.ts`. No network. Run: `npx tsx scripts/test-checks.mts` |
| `test-html-strip.mts` | Unit tests for `html-to-text.ts`. No network. Run: `npx tsx scripts/test-html-strip.mts` |
| `test-resume.mts` | End-to-end against the local dev server. Requires `npm run dev` running in another terminal. Run: `npx tsx scripts/test-resume.mts scripts/sample-jds/*.txt` |

## Common edits

- **New banned word.** Add to `BANLIST` in [`checks.ts`](./checks.ts). Add a unit test in `scripts/test-checks.mts` if it's load-bearing.
- **Tune retry feedback.** Edit `buildRetryPrompt()` in `src/app/api/resume/route.ts`.
- **Change which Gemini model.** Default model in the `gemini-primary` / `gemini-backup` cases of `src/lib/ai/registry.ts`.
- **Swap to a different drafter (OpenAI / Anthropic / etc).** Set `AI_RESUME_DRAFTER_CHAIN=openrouter,gemini-primary` in env, or edit the default chain in `src/lib/ai/roles.ts`. Add the provider's API key to .env.local first.
- **Adjust the judge's categories.** `SYSTEM_PROMPT` in [`judge.ts`](./judge.ts), and the `ALLOWED_CATEGORIES` set in the same file.
- **Add a new section to the resume layout.** [`prompt.ts`](./prompt.ts) (tell the model), then [`checks.ts`](./checks.ts) (`REQUIRED_SECTIONS` / `ALLOWED_SECTIONS`).
- **Corpus changes (project metrics, dates, dont-claim list).** `src/data/extended-experience.ts` for hidden context, `src/data/profile.ts` for the public bio, `src/data/projects-list.tsx` for the project cards.
