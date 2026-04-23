"use client";

import { useMemo } from "react";
import Markdown, { type Components } from "react-markdown";
import { ChevronDown, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Splits a markdown body on `{{code:<id>}}` placeholders and interleaves
// matching code snippets as expandable blocks. This is what makes the
// dropdowns sit next to the text that talks about them (user's request)
// instead of piling up at the bottom.
//
// Also provides *visible* beautification for the prose: **bold** gets a
// sky-tinted color + subtle highlighter underline so the bolded lead-ins
// actually stand out (the previous "just make it bold" treatment was
// invisible because `prose` already does that). Inline code becomes a chip,
// blockquotes get a vertical accent, and — when `highlightedHtml` is
// provided — code snippet bodies render with VS Code's Dark+ colors via
// shiki.

export type CodeSnippet = {
  id: string;
  title: string;
  description?: string;
  language: string;
  code: string;
  // Optional pre-rendered shiki HTML. Produced server-side in
  // `src/lib/highlight.ts` and passed down — keeps the shiki bundle out of
  // the client payload.
  highlightedHtml?: string | null;
};

const PLACEHOLDER_RE = /\{\{code:([a-zA-Z0-9_-]+)\}\}/g;

const SILVER_CARD =
  "ring-1 ring-inset ring-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]";
const SILVER_CHIP =
  "ring-1 ring-inset ring-white/[0.05] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]";

// Custom react-markdown component overrides. Object identity is stable
// (defined at module scope) so react-markdown doesn't remount on each
// render of the parent.
const PROSE_COMPONENTS: Components = {
  // Bold gets a *visible* treatment — sky accent color plus a faint
  // highlighter band underneath. This is the change that makes the prose
  // stop looking like "plain text with font-weight: 700" everywhere bold.
  strong: ({ children }) => (
    <strong
      className={cn(
        "font-semibold text-sky-100",
        // highlighter: draw a soft sky-tinted band behind the last 35% of
        // the line-height so it looks like underline-highlight. `box-decoration-clone`
        // keeps the effect continuous when bold wraps across lines.
        "bg-gradient-to-b from-transparent from-60% to-sky-400/15 to-60% box-decoration-clone",
        "px-0.5 rounded-[2px]"
      )}
    >
      {children}
    </strong>
  ),
  em: ({ children }) => (
    <em className="italic text-foreground/90">{children}</em>
  ),
  code: ({ className, children, ...rest }) => {
    const isBlock =
      typeof className === "string" && className.startsWith("language-");
    if (isBlock) {
      return (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    }
    return (
      <code
        className={cn(
          "mx-[0.08em] whitespace-nowrap rounded-md border border-border/70 bg-card/70 px-1.5 py-0.5 font-mono text-[0.86em] text-foreground/90",
          "ring-1 ring-inset ring-white/[0.04]"
        )}
      >
        {children}
      </code>
    );
  },
  ul: ({ children }) => (
    <ul className="my-2 flex list-disc flex-col gap-1 pl-5 marker:text-foreground/40">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 flex list-decimal flex-col gap-1 pl-5 marker:text-muted-foreground/70">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="pl-1 text-pretty leading-relaxed">{children}</li>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="underline decoration-dotted underline-offset-2 text-foreground/90 hover:text-foreground"
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote
      className={cn(
        "my-3 rounded-r-md border-l-2 border-foreground/30 bg-card/40 px-4 py-2 text-pretty italic leading-relaxed text-muted-foreground",
        SILVER_CARD
      )}
    >
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-border/60" />,
};

const PROSE_CLASS =
  "prose max-w-none text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert";

export function InterleavedProse({
  markdown,
  snippets,
}: {
  markdown: string;
  snippets?: ReadonlyArray<CodeSnippet>;
}) {
  const byId = useMemo(() => {
    const m = new Map<string, CodeSnippet>();
    for (const s of snippets ?? []) m.set(s.id, s);
    return m;
  }, [snippets]);

  const parts = useMemo(() => {
    const out: Array<
      | { kind: "text"; text: string; key: string }
      | { kind: "snippet"; snippet: CodeSnippet; key: string }
    > = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    const re = new RegExp(PLACEHOLDER_RE.source, "g");
    let i = 0;
    while ((match = re.exec(markdown)) !== null) {
      const before = markdown.slice(lastIndex, match.index);
      if (before.trim().length > 0) {
        out.push({ kind: "text", text: before, key: `t-${i++}` });
      }
      const snip = byId.get(match[1]);
      if (snip) out.push({ kind: "snippet", snippet: snip, key: `c-${i++}` });
      lastIndex = match.index + match[0].length;
    }
    const tail = markdown.slice(lastIndex);
    if (tail.trim().length > 0) {
      out.push({ kind: "text", text: tail, key: `t-${i++}` });
    }
    return out;
  }, [markdown, byId]);

  // Fast path: no placeholders, just render the whole markdown.
  if (parts.every((p) => p.kind === "text")) {
    return (
      <div className={PROSE_CLASS}>
        <Markdown components={PROSE_COMPONENTS}>{markdown}</Markdown>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {parts.map((p) =>
        p.kind === "text" ? (
          <div key={p.key} className={PROSE_CLASS}>
            <Markdown components={PROSE_COMPONENTS}>{p.text}</Markdown>
          </div>
        ) : (
          <InlineCodeSnippet key={p.key} snippet={p.snippet} />
        )
      )}
    </div>
  );
}

export function InlineCodeSnippet({ snippet }: { snippet: CodeSnippet }) {
  // Quick affordance hint — "4 lines" etc. so people know what they're
  // committing to before they open.
  const lineCount = snippet.code.split("\n").length;

  return (
    <details
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card/40 transition-colors",
        "open:border-foreground/25",
        SILVER_CARD
      )}
    >
      {/* Left accent strip — echoes the silver-gradient dots used in the
          Highlights section so the snippets feel part of the same family. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-zinc-200/60 via-zinc-400/25 to-transparent"
      />
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-3 pl-5 pr-3 py-3 text-sm select-none transition-colors",
          "hover:bg-card/70",
          "[&::-webkit-details-marker]:hidden"
        )}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <ChevronDown
            className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          />
          <Code2
            className="size-3.5 shrink-0 text-muted-foreground/60"
            aria-hidden
          />
          <span className="truncate font-medium text-foreground/95">
            {snippet.title}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-[10px] text-muted-foreground/60">
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-md border border-border bg-background/70 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground",
              SILVER_CHIP
            )}
          >
            {snippet.language}
          </span>
        </span>
      </summary>
      {snippet.description && (
        <div className="border-t border-border/60 bg-background/30 px-5 py-3 text-xs text-pretty leading-relaxed text-muted-foreground">
          {snippet.description}
        </div>
      )}
      {/* Code body. Shiki now emits both Light+ and Dark+ palettes as CSS
          custom properties on every token; `globals.css` flips between
          them based on the `.dark` class and forces the shiki node's own
          `background-color` to `transparent`, so the wrapper's background
          below is what the reader actually sees. We use `bg-muted/50` in
          light mode (a soft off-white that matches the rest of the page)
          and `bg-background/60` in dark mode (a slightly deeper-than-card
          tone that still reads as a distinct code region). */}
      {snippet.highlightedHtml ? (
        <div
          className={cn(
            "overflow-x-auto border-t border-border/60",
            "bg-muted/50 dark:bg-background/60",
            "[&>pre]:m-0 [&>pre]:px-5 [&>pre]:py-3.5 [&>pre]:text-[12px] [&>pre]:leading-relaxed",
            "[&_code]:font-mono"
          )}
          dangerouslySetInnerHTML={{ __html: snippet.highlightedHtml }}
        />
      ) : (
        <pre className="m-0 overflow-x-auto border-t border-border/60 bg-muted/50 dark:bg-background/60 px-5 py-3.5 text-[12px] leading-relaxed">
          <code className="font-mono text-foreground/90">{snippet.code}</code>
        </pre>
      )}
    </details>
  );
}
