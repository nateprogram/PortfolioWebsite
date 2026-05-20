# `src/lib/ai/` — provider abstraction

One uniform interface (`AIProvider`) over Gemini, Groq, OpenAI, Anthropic, OpenRouter, Cerebras, Mistral, DeepSeek, Together — anything that speaks the OpenAI Chat Completions wire format, plus Gemini natively. Adding a new provider is a one-line edit in [`registry.ts`](./registry.ts) and one env var.

## File map

| File | What's in it |
| --- | --- |
| [`types.ts`](./types.ts) | The `AIProvider` interface, options/result types, and the `ProviderError` class (with a `kind` enum the role-fallback uses to decide whether to retry). |
| [`gemini.ts`](./gemini.ts) | Native Gemini adapter using `@google/generative-ai`. Loosened safety thresholds, JSON-mode support, timeouts, error normalization to ProviderError kinds. |
| [`openai-compat.ts`](./openai-compat.ts) | Generic OpenAI Chat Completions adapter. One implementation, many providers — parameterized by `baseURL`, `apiKey`, and `model`. Handles SSE streaming, JSON mode, timeouts. |
| [`registry.ts`](./registry.ts) | `getProvider(name)` — maps a stable name (e.g. `"groq"`, `"openai"`) to a configured adapter by reading env vars. Returns `null` if the key isn't set so callers can fall through. |
| [`roles.ts`](./roles.ts) | `chainFor(role)` — which providers play which role (`resume-drafter`, `judge`, etc.) and in what order. Each role has a default chain that can be overridden via env var. |
| [`index.ts`](./index.ts) | Public entrypoint. `tryRole(role, action)` walks the chain, swallowing retryable errors. `tryRoleStreaming` is the same for streaming calls. `listConfiguredProviders()` is a diagnostic. |

## Adding a new provider

### If it's OpenAI-compatible (most are)

1. Pick a `ProviderName` (e.g. `"perplexity"`).
2. In [`registry.ts`](./registry.ts), add a case:

   ```typescript
   case "perplexity": {
     const apiKey = process.env.PERPLEXITY_API_KEY;
     if (!apiKey) return null;
     return new OpenAICompatProvider({
       name: "perplexity",
       baseURL: "https://api.perplexity.ai",
       apiKey,
       model: modelOverride ?? "llama-3.1-sonar-large-128k-online",
     });
   }
   ```

3. Add the name to the `ProviderName` union at the top of the file.
4. Set `PERPLEXITY_API_KEY` in `.env.local` (and Vercel).
5. Add it to a role's chain in [`roles.ts`](./roles.ts) or call `getProvider("perplexity")` directly.

That's it — about three lines of config. The OpenAICompatProvider class doesn't need to change.

### If it has its own native API (Anthropic, Cohere, …)

1. Create a new adapter file (e.g. `anthropic-native.ts`) implementing `AIProvider`. Use [`gemini.ts`](./gemini.ts) as a template; adapt it to the SDK / wire format.
2. Wire it up in [`registry.ts`](./registry.ts) the same way.

## Adding a new role

A role is a job the AI does. We currently have three: `resume-drafter`, `cover-letter-drafter`, `judge`. Adding `match-scorer` (hypothetical):

1. Add `"match-scorer"` to the `AIRole` union in [`roles.ts`](./roles.ts).
2. Add a default chain: `"match-scorer": ["cerebras", "groq"]`.
3. Call it from your route:

   ```typescript
   import { tryRole } from "@/lib/ai";

   const result = await tryRole("match-scorer", (p) =>
     p.generate({
       systemPrompt: "…",
       userPrompt: "…",
       responseFormat: "json",
       temperature: 0.1,
     }),
   );
   ```

Override the chain in production without redeploying via
`AI_MATCH_SCORER_CHAIN=openrouter,groq` in Vercel env vars.

## Env vars

| Var | Provider |
| --- | --- |
| `GOOGLE_AI_API_KEY` | gemini-primary |
| `GOOGLE_AI_API_KEY_BACKUP` | gemini-backup |
| `GROQ_API_KEY` | groq |
| `OPENAI_API_KEY` | openai |
| `OPENROUTER_API_KEY` | openrouter |
| `ANTHROPIC_API_KEY` | anthropic-openai-compat |
| `CEREBRAS_API_KEY` | cerebras |
| `MISTRAL_API_KEY` | mistral |
| `DEEPSEEK_API_KEY` | deepseek |
| `TOGETHER_API_KEY` | together |
| `AI_<ROLE>_CHAIN` | override the default chain for a role |

Only the keys you actually use need to be set. Missing keys are skipped silently — the chain just advances to the next provider.

## Current usage

- **Resume drafter** — `src/app/api/resume/route.ts` uses `tryRoleStreaming("resume-drafter", …)`. Swap providers via the `AI_RESUME_DRAFTER_CHAIN` env var or by editing [`roles.ts`](./roles.ts).
- **Cover-letter drafter** — `src/app/api/cover-letter/route.ts` uses `tryRoleStreaming("cover-letter-drafter", …)`. Same swap mechanics.
- **Judge** — `src/app/api/resume/judge/route.ts` calls into `src/lib/resume/judge.ts`, which uses `tryRole("judge", …)`. Swap via `AI_JUDGE_CHAIN=openrouter` etc.

## Design notes

- **Why not just LangChain / AI SDK?** Both are great but pull in 1-2MB of dependencies and lock you into their abstractions. This file is ~500 lines total, no external dependencies beyond the native Google SDK and `fetch`. Easy to read, easy to modify.
- **Why two adapter classes?** Because Gemini's wire format and SDK are weird enough that the generic OpenAI-compat adapter doesn't fit cleanly. Every other provider on the list speaks OpenAI Chat Completions.
- **Why explicit `ProviderError` kinds?** So `tryRole` can tell "rate-limited, try next provider" apart from "API key is wrong, no point trying". Auth errors fail fast; rate limits and 5xx errors advance.
