"use client";

// Client UI for /tools/applications.
//
// Single-page CRUD over the application tracker:
//   - Form at the top to add a new application (company + position
//     required; status defaults to "applied").
//   - Table below with inline-editable status (auto-saves on change),
//     a notes-expandable row, and a delete button.
//   - Status counts row at the top so the user can see the pipeline
//     shape at a glance.
//   - Filter chips that hide closed/dormant rows when they're not what
//     the user wants to look at right now.
//
// All mutations go through /api/applications endpoints and update
// local state optimistically.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Loader2,
  Plus,
  Save,
  Target,
  Trash2,
} from "lucide-react";
import BlurFade from "@/components/magicui/blur-fade";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const BLUR_FADE_DELAY = 0.04;

type Status =
  | "applied"
  | "screen"
  | "interview"
  | "offer"
  | "rejected"
  | "withdrawn"
  | "ghosted";

type Application = {
  id: string;
  createdAt: number;
  updatedAt: number;
  company: string;
  position: string;
  status: Status;
  appliedDate?: string;
  jdUrl?: string;
  notes?: string;
  resumeId?: string;
};

const STATUSES: Status[] = [
  "applied",
  "screen",
  "interview",
  "offer",
  "rejected",
  "withdrawn",
  "ghosted",
];

const STATUS_LABEL: Record<Status, string> = {
  applied: "Applied",
  screen: "Screen",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  ghosted: "Ghosted",
};

// Tailwind utility classes for each status. Background-tint + text-color
// pairs that map to the same palette the resume builder uses.
const STATUS_CLASSES: Record<Status, string> = {
  applied:
    "bg-muted/60 text-muted-foreground border border-border",
  screen:
    "bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-900/40",
  interview:
    "bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/40",
  offer:
    "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/40",
  rejected:
    "bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-900/40",
  withdrawn:
    "bg-muted/40 text-muted-foreground/70 border border-border italic",
  ghosted:
    "bg-muted/40 text-muted-foreground/70 border border-border italic",
};

type Filter = "all" | "active" | "closed";

export function ApplicationsClient() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("active");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addCompany, setAddCompany] = useState("");
  const [addPosition, setAddPosition] = useState("");
  const [addStatus, setAddStatus] = useState<Status>("applied");
  const [addAppliedDate, setAddAppliedDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [addJdUrl, setAddJdUrl] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/applications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items?: Application[] };
      setApps(data.items ?? []);
    } catch {
      // ignore — the table just stays empty
    } finally {
      setLoading(false);
    }
  }

  const counts = useMemo(() => {
    const out: Record<Status, number> = {
      applied: 0,
      screen: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0,
      ghosted: 0,
    };
    for (const a of apps) out[a.status]++;
    return out;
  }, [apps]);

  const filtered = useMemo(() => {
    if (filter === "all") return apps;
    if (filter === "active") {
      return apps.filter((a) =>
        ["applied", "screen", "interview", "offer"].includes(a.status),
      );
    }
    return apps.filter((a) =>
      ["rejected", "withdrawn", "ghosted"].includes(a.status),
    );
  }, [apps, filter]);

  async function addApplication() {
    const company = addCompany.trim();
    const position = addPosition.trim();
    if (!company || !position) {
      setErrorMessage("Company and position are both required.");
      return;
    }
    setAdding(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          position,
          status: addStatus,
          appliedDate: addAppliedDate || undefined,
          jdUrl: addJdUrl.trim() || undefined,
          notes: addNotes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setErrorMessage(data.error ?? `Request failed (${res.status})`);
        return;
      }
      const data = (await res.json()) as { item: Application };
      setApps((prev) => [data.item, ...prev]);
      // Reset the form for the next entry, but keep status/appliedDate
      // since the user is often adding multiple at once.
      setAddCompany("");
      setAddPosition("");
      setAddJdUrl("");
      setAddNotes("");
    } catch (err) {
      setErrorMessage(`Network error: ${(err as Error).message}`);
    } finally {
      setAdding(false);
    }
  }

  async function patchApplication(id: string, patch: Partial<Application>) {
    // Optimistic update so the UI feels instant.
    setApps((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a,
      ),
    );
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        // Roll back by re-fetching.
        await refresh();
      }
    } catch {
      await refresh();
    }
  }

  async function deleteApplication(id: string) {
    if (!confirm("Delete this application? This can't be undone.")) return;
    const prev = apps;
    setApps((p) => p.filter((a) => a.id !== id));
    try {
      const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
      if (!res.ok) setApps(prev);
    } catch {
      setApps(prev);
    }
  }

  return (
    <main className="min-h-dvh flex flex-col gap-10">
      <BlurFade delay={BLUR_FADE_DELAY}>
        <Link
          href="/tools/resume"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3 w-3" aria-hidden /> back to resume tool
        </Link>
      </BlurFade>

      <BlurFade delay={BLUR_FADE_DELAY * 2}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-md border border-border bg-card/60">
              <Target className="size-5 text-muted-foreground" aria-hidden />
            </div>
            <div className="flex flex-col gap-0.5">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Applications
              </h1>
              <p className="text-xs font-mono text-muted-foreground">
                {apps.length} total · {counts.applied + counts.screen + counts.interview}{" "}
                active · {counts.offer} offers · {counts.rejected + counts.withdrawn + counts.ghosted}{" "}
                closed
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Track applications through their pipeline. Status changes save
            automatically; notes hold whatever you need to remember about a
            company (recruiter names, deadlines, salary ranges).
          </p>
        </div>
      </BlurFade>

      {/* Filter chips + add button */}
      <BlurFade delay={BLUR_FADE_DELAY * 3}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5 text-xs font-mono">
            <FilterChip
              active={filter === "active"}
              onClick={() => setFilter("active")}
            >
              Active ({counts.applied + counts.screen + counts.interview + counts.offer})
            </FilterChip>
            <FilterChip
              active={filter === "closed"}
              onClick={() => setFilter("closed")}
            >
              Closed ({counts.rejected + counts.withdrawn + counts.ghosted})
            </FilterChip>
            <FilterChip
              active={filter === "all"}
              onClick={() => setFilter("all")}
            >
              All ({apps.length})
            </FilterChip>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setAddOpen((v) => !v)}
          >
            {addOpen ? (
              <>
                <ChevronDown className="size-3.5" aria-hidden />
                Hide add form
              </>
            ) : (
              <>
                <Plus className="size-3.5" aria-hidden />
                Add application
              </>
            )}
          </Button>
        </div>
      </BlurFade>

      {/* Add form */}
      {addOpen && (
        <BlurFade delay={BLUR_FADE_DELAY * 3}>
          <div className="rounded-lg border border-border bg-card/40 p-5 flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <LabeledInput
                label="Company"
                value={addCompany}
                onChange={setAddCompany}
                placeholder="Acme Corp"
                disabled={adding}
              />
              <LabeledInput
                label="Position"
                value={addPosition}
                onChange={setAddPosition}
                placeholder="Senior Backend Engineer"
                disabled={adding}
              />
              <LabeledSelect
                label="Status"
                value={addStatus}
                onChange={(v) => setAddStatus(v as Status)}
                options={STATUSES.map((s) => ({
                  value: s,
                  label: STATUS_LABEL[s],
                }))}
                disabled={adding}
              />
              <LabeledInput
                label="Applied date"
                type="date"
                value={addAppliedDate}
                onChange={setAddAppliedDate}
                disabled={adding}
              />
              <LabeledInput
                label="JD URL (optional)"
                type="url"
                value={addJdUrl}
                onChange={setAddJdUrl}
                placeholder="https://jobs.example.com/postings/12345"
                disabled={adding}
                wide
              />
              <LabeledTextarea
                label="Notes (optional)"
                value={addNotes}
                onChange={setAddNotes}
                placeholder="Recruiter name, salary range, interview deadlines..."
                disabled={adding}
                wide
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                onClick={addApplication}
                disabled={adding || !addCompany.trim() || !addPosition.trim()}
              >
                {adding ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="size-3.5" aria-hidden />
                    Save application
                  </>
                )}
              </Button>
              {errorMessage && (
                <span className="text-sm text-destructive">{errorMessage}</span>
              )}
            </div>
          </div>
        </BlurFade>
      )}

      {/* Table */}
      <BlurFade delay={BLUR_FADE_DELAY * 4}>
        {loading ? (
          <div className="rounded-lg border border-dashed border-border bg-card/20 px-5 py-8 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading applications...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card/20 px-5 py-10 flex flex-col items-center gap-2 text-center">
            <Target className="size-5 text-muted-foreground/60" aria-hidden />
            <p className="text-sm text-muted-foreground">
              {apps.length === 0
                ? "No applications tracked yet. Add one above."
                : `No ${filter} applications. Switch filter to see others.`}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card/20 overflow-hidden">
            {filtered.map((app) => (
              <ApplicationRow
                key={app.id}
                app={app}
                expanded={expandedId === app.id}
                onToggleExpand={() =>
                  setExpandedId(expandedId === app.id ? null : app.id)
                }
                onPatch={(patch) => patchApplication(app.id, patch)}
                onDelete={() => deleteApplication(app.id)}
              />
            ))}
          </ul>
        )}
      </BlurFade>
    </main>
  );
}

// ----- sub-components -------------------------------------------------------

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-md border transition-colors ${
        active
          ? "border-foreground/30 bg-foreground/5 text-foreground"
          : "border-border bg-transparent text-muted-foreground hover:bg-muted/30"
      }`}
    >
      {children}
    </button>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  wide?: boolean;
}) {
  return (
    <label
      className={`flex flex-col gap-1 ${wide ? "sm:col-span-2" : ""}`}
    >
      <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      />
    </label>
  );
}

function LabeledTextarea({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  wide,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  wide?: boolean;
}) {
  return (
    <label
      className={`flex flex-col gap-1 ${wide ? "sm:col-span-2" : ""}`}
    >
      <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={3}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm font-mono leading-relaxed resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      />
    </label>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ApplicationRow({
  app,
  expanded,
  onToggleExpand,
  onPatch,
  onDelete,
}: {
  app: Application;
  expanded: boolean;
  onToggleExpand: () => void;
  onPatch: (patch: Partial<Application>) => void;
  onDelete: () => void;
}) {
  // Local edit state for notes. The parent passes `key={app.id}` so
  // React remounts this row when the user switches to a different
  // application, which naturally resets these. Keeping a useEffect
  // here would race with the user's typing and wipe unsaved drafts
  // every time the parent re-renders.
  const [notesDraft, setNotesDraft] = useState(app.notes ?? "");
  const [notesDirty, setNotesDirty] = useState(false);

  const dateLabel = app.appliedDate
    ? new Date(app.appliedDate).toLocaleDateString([], {
        year: "2-digit",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <li className="flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
        <button
          type="button"
          onClick={onToggleExpand}
          className="flex-1 flex items-center gap-2 text-left min-w-0"
        >
          {expanded ? (
            <ChevronDown
              className="size-3.5 text-muted-foreground flex-shrink-0"
              aria-hidden
            />
          ) : (
            <ChevronRight
              className="size-3.5 text-muted-foreground flex-shrink-0"
              aria-hidden
            />
          )}
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-sm font-medium truncate">{app.company}</span>
            <span className="text-xs text-muted-foreground truncate">
              {app.position}
            </span>
          </div>
        </button>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[11px] font-mono text-muted-foreground tabular-nums hidden sm:inline">
            {dateLabel}
          </span>
          <select
            value={app.status}
            onChange={(e) => onPatch({ status: e.target.value as Status })}
            className={`text-xs font-mono rounded-md px-2 py-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${STATUS_CLASSES[app.status]}`}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-md hover:bg-destructive/5"
            title="Delete this application"
            aria-label="Delete application"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </div>

      {/* Expanded row: editable date, notes, JD link */}
      {expanded && (
        <div className="px-4 pb-4 pt-1 flex flex-col gap-3 bg-muted/10 border-t border-border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:items-end">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                Applied date
              </span>
              <input
                type="date"
                value={app.appliedDate ?? ""}
                onChange={(e) =>
                  onPatch({ appliedDate: e.target.value || undefined })
                }
                className="rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                JD URL
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="url"
                  value={app.jdUrl ?? ""}
                  onChange={(e) =>
                    onPatch({ jdUrl: e.target.value || undefined })
                  }
                  placeholder="https://..."
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                {app.jdUrl && (
                  <a
                    href={app.jdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted/30"
                    aria-label="Open job posting in new tab"
                  >
                    <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                )}
              </div>
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                Notes
              </span>
              {notesDirty && (
                <button
                  type="button"
                  onClick={() => {
                    onPatch({ notes: notesDraft || undefined });
                    setNotesDirty(false);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  <Check className="size-3" aria-hidden />
                  save
                </button>
              )}
            </div>
            <textarea
              value={notesDraft}
              onChange={(e) => {
                setNotesDraft(e.target.value);
                setNotesDirty(e.target.value !== (app.notes ?? ""));
              }}
              onBlur={() => {
                if (notesDirty) {
                  onPatch({ notes: notesDraft || undefined });
                  setNotesDirty(false);
                }
              }}
              rows={4}
              placeholder="Recruiter name, deadlines, salary range, interview notes..."
              className="rounded-md border border-border bg-background px-3 py-2 text-sm font-mono leading-relaxed resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
            <Badge variant="outline" className="gap-1 py-0 px-1.5 h-5 text-[10px]">
              <Building2 className="size-2.5" aria-hidden />
              {app.company}
            </Badge>
            <Badge variant="outline" className="gap-1 py-0 px-1.5 h-5 text-[10px]">
              <Briefcase className="size-2.5" aria-hidden />
              {app.position}
            </Badge>
            <span className="ml-auto">
              created {new Date(app.createdAt).toLocaleDateString()} ·
              updated {new Date(app.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </li>
  );
}
