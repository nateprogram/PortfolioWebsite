"use client";

import { useMemo } from "react";
import Markdown from "react-markdown";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Splits a markdown body on `{{code:<id>}}` placeholders and interleaves
// matching code snippets as expandable blocks. This is what makes the
// dropdowns sit next to the text that talks about them (user's request)
// instead of piling up at the bottom.

export type CodeSnippet = {
  id: string;
  title: string;
  description?: string;
  language: string;
  code: string;
};

const PLACEHOLDER_RE = /\{\{code:([a-zA-Z0-9_-]+)\}\}/g;

const SILVER_CARD =
  "ring-1 ring-inset ring-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]";

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
      <div className="prose max-w-none text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert">
        <Markdown>{markdown}</Markdown>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {parts.map((p) =>
        p.kind === "text" ? (
          <div
            key={p.key}
            className="prose max-w-none text-pretty font-sans leading-relaxed text-muted-foreground dark:prose-invert"
          >
            <Markdown>{p.text}</Markdown>
          </div>
        ) : (
          <InlineCodeSnippet key={p.key} snippet={p.snippet} />
        )
      )}
    </div>
  );
}

export function InlineCodeSnippet({ snippet }: { snippet: CodeSnippet }) {
  return (
    <details
      className={cn(
        "group overflow-hidden rounded-xl border border-border bg-card/40",
        SILVER_CARD
      )}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm select-none hover:bg-card/70 transition-colors [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2 min-w-0">
          <ChevronDown
            className="size-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            aria-hidden
          />
          <span className="font-medium truncate">{snippet.title}</span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground shrink-0">
          {snippet.language}
        </span>
      </summary>
      {snippet.description && (
        <div className="border-t border-border/60 px-4 py-3 text-xs text-pretty leading-relaxed text-muted-foreground">
          {snippet.description}
        </div>
      )}
      <pre className="overflow-x-auto border-t border-border/60 bg-background/50 px-4 py-3 text-[12px] leading-relaxed">
        <code className="font-mono text-foreground/90">{snippet.code}</code>
      </pre>
    </details>
  );
}
