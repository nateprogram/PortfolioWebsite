#!/usr/bin/env -S npx tsx
// scripts/test-html-strip.mts
//
// Unit test for the HTML → text stripper that powers /api/resume/fetch-jd.
// Runs synthetic job-page HTML through htmlToText and asserts that
// nav / footer / cookie banners / apply forms are stripped while real
// JD content survives. No network, no dev server.
//
// Usage: npx tsx scripts/test-html-strip.mts

import * as mod from "../src/lib/html-to-text.ts";
// Node 22's strip-types treats .ts as CJS — exports come back under
// `.default`. Same workaround as test-resume.mts.
type HtmlMod = { htmlToText: (html: string) => string };
const htmlToText: HtmlMod["htmlToText"] =
  (mod as unknown as { default?: HtmlMod } & HtmlMod).default?.htmlToText ??
  (mod as unknown as HtmlMod).htmlToText;

const cases: Array<{
  name: string;
  html: string;
  /** Substrings that MUST appear in the output. */
  expectIncludes: string[];
  /** Substrings that MUST NOT appear in the output. */
  expectExcludes: string[];
}> = [
  {
    name: "Greenhouse-style page with main + nav + footer + apply form",
    html: `
<!DOCTYPE html>
<html>
<head><title>Senior Backend Engineer | Acme Corp</title><style>.foo{color:red}</style></head>
<body>
  <header>
    <nav>
      <ul><li>About</li><li>Careers</li><li>Press</li><li>Contact</li></ul>
      <button>Sign in</button>
    </nav>
  </header>
  <dialog open>
    <p>We use cookies. Accept all?</p>
    <button>Accept</button><button>Reject</button>
  </dialog>
  <main>
    <h1>Senior Backend Engineer</h1>
    <p>Acme Corp · San Francisco · Full-time</p>
    <h2>About the role</h2>
    <p>We're hiring a Senior Backend Engineer to build our payment processing platform.</p>
    <h2>Requirements</h2>
    <ul>
      <li>5+ years of backend experience in Go or Rust.</li>
      <li>Deep familiarity with PostgreSQL and event-driven architectures.</li>
    </ul>
  </main>
  <aside>
    <h3>Other open roles</h3>
    <ul><li>Frontend Engineer</li><li>SRE</li><li>Designer</li></ul>
  </aside>
  <form id="apply-form">
    <label>Name<input type="text" /></label>
    <label>Resume<input type="file" /></label>
    <button type="submit">Apply now</button>
  </form>
  <footer>
    <ul><li>Privacy</li><li>Terms</li><li>Press</li><li>About</li></ul>
    <p>© 2026 Acme Corp</p>
  </footer>
  <script>tracking('hi')</script>
</body>
</html>`,
    expectIncludes: [
      "Senior Backend Engineer",
      "Acme Corp",
      "payment processing platform",
      "Go or Rust",
      "PostgreSQL",
      "event-driven",
    ],
    expectExcludes: [
      // header / nav / login chrome
      "Sign in",
      // cookie banner
      "We use cookies",
      "Accept all",
      // apply form
      "Apply now",
      "Resume",
      // aside (sidebar of other roles)
      "Frontend Engineer",
      "SRE",
      // footer
      "© 2026",
      // script content
      "tracking",
    ],
  },
  {
    name: "Page without <main> — trailing nav links should still get trimmed",
    html: `<!doctype html>
<html><body>
  <h1>Software Engineer, Platform</h1>
  <p>We are looking for a Software Engineer to join the Platform team.</p>
  <p>Strong Python and SQL required.</p>
  <div class="footer-links">
    <ul>
      <li>Privacy</li>
      <li>Terms</li>
      <li>About</li>
      <li>Careers</li>
    </ul>
  </div>
</body></html>`,
    expectIncludes: [
      "Software Engineer, Platform",
      "Platform team",
      "Python and SQL",
    ],
    expectExcludes: [
      // The bottom nav lines, trimmed by trimTrailingNavLines.
      "\nPrivacy\nTerms\nAbout\nCareers",
    ],
  },
  {
    name: "Decodes common entities and preserves &amp; in tech names",
    html: `<main>
      <h1>Frontend Engineer</h1>
      <p>You'll work with React &amp; TypeScript.</p>
      <p>Salary: $120k&ndash;$180k.</p>
    </main>`,
    expectIncludes: ["React & TypeScript", "Frontend Engineer"],
    expectExcludes: ["&amp;", "&ndash;"],
  },
];

let passed = 0;
let failed = 0;

for (const c of cases) {
  const out = htmlToText(c.html);
  const failures: string[] = [];
  for (const must of c.expectIncludes) {
    if (!out.includes(must)) failures.push(`MISSING expected: ${JSON.stringify(must)}`);
  }
  for (const mustNot of c.expectExcludes) {
    if (out.includes(mustNot))
      failures.push(`PRESENT but shouldn't be: ${JSON.stringify(mustNot)}`);
  }
  if (failures.length === 0) {
    console.log(`✅ ${c.name}`);
    passed++;
  } else {
    console.log(`❌ ${c.name}`);
    for (const f of failures) console.log(`     ${f}`);
    console.log(`     --- actual output ---`);
    console.log(
      out
        .split("\n")
        .map((l) => `     | ${l}`)
        .join("\n"),
    );
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
