// SERVER-ONLY: which providers play which roles in the app.
//
// A "role" is a job the AI does (drafting a resume, critiquing a
// resume, matching a JD, …). Each role has an ordered list of
// providers — the first one with an API key set wins; on failure
// the chain advances to the next. Override the default chain with
// an env var if you want to A/B without code changes.

import type { ProviderName } from "./registry";

export type AIRole =
  | "resume-drafter" // /api/resume streaming
  | "cover-letter-drafter" // /api/cover-letter streaming
  | "judge"; // /api/resume/judge — Groq + Llama 3.3 70B by default

/**
 * Default chains, used when no `AI_<ROLE>_CHAIN` env override is set.
 * Comma-separated list of ProviderName values.
 */
const DEFAULT_CHAINS: Record<AIRole, ProviderName[]> = {
  "resume-drafter": ["gemini-primary", "gemini-backup"],
  "cover-letter-drafter": ["gemini-primary", "gemini-backup"],
  judge: ["groq"],
};

/**
 * Resolve the chain for a given role. Honors an env override of the
 * form `AI_RESUME_DRAFTER_CHAIN=openrouter,groq` so you can A/B
 * without editing this file. Falls back to DEFAULT_CHAINS otherwise.
 */
export function chainFor(role: AIRole): ProviderName[] {
  const envKey = `AI_${role.toUpperCase().replace(/-/g, "_")}_CHAIN`;
  const override = process.env[envKey];
  if (!override) return DEFAULT_CHAINS[role];
  const parsed = override
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as ProviderName[];
  return parsed.length > 0 ? parsed : DEFAULT_CHAINS[role];
}
