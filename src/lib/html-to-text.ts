// Cheap HTML → plain text. Strips chrome (script/style/svg/nav/footer/
// header/aside/form/button/dialog/menu) blocks, removes comments and
// remaining tags, decodes the common entities, and collapses whitespace.
// Adequate for static job-posting HTML — built for /api/resume/fetch-jd
// but kept in a standalone lib so it can be unit-tested without spinning
// up the route's network stack.
//
// If the page has a `<main>` or `<article>` element, narrows to that
// before stripping — most modern job pages (Greenhouse, Lever, Ashby,
// company careers pages) wrap the JD in one of those. Narrowing first
// keeps unrelated chrome out of the extracted text without us having
// to enumerate every site-specific footer wrapper.

export function htmlToText(html: string): string {
  // 1. Narrow to <main> or <article> when present — much higher signal
  //    than the rest of the page chrome. First match wins.
  const narrowed = narrowToMain(html);

  // 2. Strip the obvious chrome elements (including their inner content).
  //    These almost never contain JD text on a real job posting:
  //    - <nav>: site nav, breadcrumbs, "Other roles" lists
  //    - <header>: top bar with logo, login, search
  //    - <footer>: bottom bar with company links, copyright
  //    - <aside>: sidebars with "Related jobs", "Recruiter contact"
  //    - <form>: the apply form itself (questions / file upload)
  //    - <button>: every CTA on the page ("Apply now", "Save job")
  //    - <dialog>: cookie banners, GDPR popovers
  //    - <menu>: dropdown menus
  let text = narrowed
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, "")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, "")
    .replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, "")
    .replace(/<button\b[^>]*>[\s\S]*?<\/button>/gi, "")
    .replace(/<dialog\b[^>]*>[\s\S]*?<\/dialog>/gi, "")
    .replace(/<menu\b[^>]*>[\s\S]*?<\/menu>/gi, "");

  // 3. Comments.
  text = text.replace(/<!--[\s\S]*?-->/g, "");

  // 4. Preserve line breaks where the HTML had block boundaries.
  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|article|section|ul|ol)>/gi, "\n");

  // 5. Strip remaining tags.
  text = text.replace(/<[^>]+>/g, "");

  // 6. Decode the entities that show up in nearly every page. The
  //    list is intentionally a curated subset — full HTML entity sets
  //    are 2K+ entries and the long tail almost never appears in JD
  //    prose. The numeric &#NNN; / &#xHH; fallbacks below cover the
  //    rest.
  const NAMED_ENTITIES: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    // Punctuation that shows up in typographic JDs.
    ndash: "–",
    mdash: "—",
    hellip: "…",
    lsquo: "‘",
    rsquo: "’",
    ldquo: "“",
    rdquo: "”",
    sbquo: "‚",
    bdquo: "„",
    middot: "·",
    bull: "•",
    // Common symbols.
    copy: "©",
    reg: "®",
    trade: "™",
    deg: "°",
    plusmn: "±",
    times: "×",
    divide: "÷",
  };
  text = text
    .replace(/&([a-zA-Z]+);/g, (raw, name: string) =>
      Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name)
        ? NAMED_ENTITIES[name]
        : raw,
    )
    .replace(/&#(\d+);/g, (_, n) => safeFromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) =>
      safeFromCodePoint(parseInt(n, 16)),
    );

  // 7. Collapse whitespace: many spaces/tabs to one, many blank lines to one.
  text = text
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // 8. Drop trailing nav-link runs: when the bottom of the page settles
  //    into short, capitalized, mostly-single-word lines (the typical
  //    "Privacy · Terms · About · Careers · Contact" footer text), trim
  //    them. Stop as soon as we hit a line that looks like prose.
  text = trimTrailingNavLines(text);

  return text;
}

/**
 * If the input HTML has a `<main>` or `<article>` element, return only
 * its inner HTML. First match wins (main beats article). Returns the
 * original HTML untouched when neither is present or the matched block
 * is suspiciously short (under 200 chars; some pages have empty
 * skeleton `<main>` tags for routing).
 */
function narrowToMain(html: string): string {
  const mainMatch = /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html);
  if (mainMatch && mainMatch[1].length > 200) return mainMatch[1];
  const articleMatch = /<article\b[^>]*>([\s\S]*?)<\/article>/i.exec(html);
  if (articleMatch && articleMatch[1].length > 200) return articleMatch[1];
  return html;
}

/**
 * Heuristic: drop trailing lines that look like footer nav links
 * (≤4 words, mostly title-cased or all-caps, no terminating
 * punctuation). Stops as soon as we encounter a prose-shaped line so
 * we never eat into real JD content. Cap at 30 lines to avoid runaway.
 */
function trimTrailingNavLines(text: string): string {
  const lines = text.split("\n");
  let keep = lines.length;
  let dropped = 0;
  while (keep > 0 && dropped < 30) {
    const line = lines[keep - 1].trim();
    if (line === "") {
      keep--;
      continue;
    }
    if (looksLikeNavLink(line)) {
      keep--;
      dropped++;
      continue;
    }
    break;
  }
  return lines.slice(0, keep).join("\n").trimEnd();
}

function looksLikeNavLink(line: string): boolean {
  if (line.length > 40) return false;
  // Prose usually ends with .?!:;, list items often end with ).
  if (/[.!?:;]$/.test(line)) return false;
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length > 4) return false;
  // Title Case or ALL CAPS or "Word · Word · Word" separators are nav-y.
  const looksTitleCase = words.every(
    (w) => /^[A-Z]/.test(w) || /^[·|/-]+$/.test(w),
  );
  return looksTitleCase;
}

function safeFromCodePoint(n: number): string {
  if (!Number.isFinite(n) || n < 0 || n > 0x10ffff) return "";
  try {
    return String.fromCodePoint(n);
  } catch {
    return "";
  }
}
