#!/usr/bin/env -S npx tsx
// scripts/test-checks.mts
//
// Unit tests for the resume-checks library. Focuses on edge cases that
// are easy to regress: credential-overstatement scoping, banlist
// boundaries, section-header detection, etc.
//
// Run with: npx tsx scripts/test-checks.mts

import * as mod from "../src/lib/resume/checks.ts";
type ChecksMod = typeof import("../src/lib/resume/checks");
const checkResume: ChecksMod["checkResume"] =
  (mod as unknown as { default?: ChecksMod } & ChecksMod).default?.checkResume ??
  (mod as unknown as ChecksMod).checkResume;

const VALID_HEADER_AND_SECTIONS = `[META]
company: Example Corp
position: Backend Engineer
[/META]

## ATS Keywords

* TypeScript
* PostgreSQL
* Redis

---

# NATE WHITE
Backend Engineer | TypeScript and Postgres specialist building idempotency layers
Redmond, WA | (425) 518-1209 | NateWhite.dev@gmail.com
linkedin.com/in/nathan-white-799765218 | github.com/nateprogram | natewhite.dev

## Summary
2026 BS CS candidate at DigiPen with two backend internships and a launched LLC product.

## Education
**BS Computer Science** | DigiPen Institute of Technology | Redmond, WA | 2022 - 2026

## Skills
**Languages:** TypeScript, Python, C++
**Frameworks & Libraries:** Node.js, Next.js
**Tools & Infrastructure:** Git, Docker, Vercel
**Databases:** PostgreSQL, Redis

## Experience
**Founder & Engineer** | Veltarium Software LLC | Redmond, WA | Apr 2025 - Present
- Built a cross-platform scheduling app on Next.js and Capacitor, shipping to web and mobile from a single TypeScript codebase.
- Designed a 19-model Prisma schema with composite-key upserts to enforce RSVP integrity at the database level.
- Wrote 40+ API route handlers covering league sync, roster management, and an internal player marketplace.

## Projects
**StockAI** | Python, FastAPI, PyTorch | 2024 - 2026
- Built a live ML research platform feeding 23 scrapers into a MultiHeadLSTM model that predicts 10 timeframes.
- Implemented a 3-tier storage architecture using SQLite plus Parquet for hot and cold access patterns.
`;

type Test = {
  name: string;
  build: () => string;
  expectHard?: string[]; // substrings of issue IDs that MUST appear
  expectNoHard?: string[]; // substrings of issue IDs that MUST NOT appear
};

const tests: Test[] = [
  {
    name: "Clean resume passes all checks",
    build: () => VALID_HEADER_AND_SECTIONS,
    expectNoHard: ["banlist", "tricolon", "openers", "section"],
  },
  {
    name: "Banned word ensure is caught",
    build: () =>
      VALID_HEADER_AND_SECTIONS.replace(
        "Designed a 19-model Prisma schema with composite-key upserts to enforce RSVP integrity at the database level.",
        "Designed a 19-model Prisma schema with composite-key upserts to ensure RSVP integrity at the database level.",
      ),
    expectHard: ["banlist:ensure"],
  },
  {
    name: "Em dash anywhere is caught",
    build: () =>
      VALID_HEADER_AND_SECTIONS.replace(
        "BS CS candidate at DigiPen",
        "BS CS candidate at DigiPen — class of 2026",
      ),
    expectHard: ["dashes:em"],
  },
];

let passed = 0;
let failed = 0;
for (const t of tests) {
  const md = t.build();
  const r = checkResume(md);
  const hardIds = r.hardFails.map((i) => i.id);

  const failures: string[] = [];
  for (const sub of t.expectHard ?? []) {
    if (!hardIds.some((id) => id.includes(sub))) {
      failures.push(`expected hard id containing ${JSON.stringify(sub)} but got: ${hardIds.join(", ") || "(none)"}`);
    }
  }
  for (const sub of t.expectNoHard ?? []) {
    const hit = hardIds.find((id) => id.includes(sub));
    if (hit) {
      const issue = r.hardFails.find((i) => i.id === hit);
      failures.push(
        `did NOT expect hard id containing ${JSON.stringify(sub)} but got: ${hit} (${issue?.message ?? ""})`,
      );
    }
  }

  if (failures.length === 0) {
    console.log(`✅ ${t.name}`);
    passed++;
  } else {
    console.log(`❌ ${t.name}`);
    for (const f of failures) console.log(`     ${f}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
