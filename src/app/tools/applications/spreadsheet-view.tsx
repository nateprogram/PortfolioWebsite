"use client";

// The Gmail-fed spreadsheet. A dense, sortable table of every tracked
// application. Rows are created by the Gmail ingest pipeline; here you can
// re-sort, search, fix a misclassified status inline, delete junk, and
// export the whole thing to CSV.

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Download,
  ExternalLink,
  Mail,
  Search,
  Trash2,
} from "lucide-react";
import type { Application, ApplicationStatus } from "@/lib/applications-store";
import { STATUS_CLASSES, STATUS_LABEL, STATUSES } from "./status";

type SortKey =
  | "company"
  | "position"
  | "status"
  | "sourceDetail"
  | "appliedDate"
  | "updatedAt";
type SortDir = "asc" | "desc";

// Status rank for sensible sorting (pipeline order, not alphabetical).
const STATUS_RANK: Record<ApplicationStatus, number> = {
  interested: 0,
  applied: 1,
  interview: 2,
  offer: 3,
  rejected: 4,
};

export function SpreadsheetView({
  apps,
  onPatch,
  onDelete,
}: {
  apps: Application[];
  onPatch: (id: string, patch: Partial<Application>) => void;
  onDelete: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | "all">(
    "all",
  );
  const [sortKey, setSortKey] = useState<SortKey>("updatedAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let r = apps;
    if (statusFilter !== "all") r = r.filter((a) => a.status === statusFilter);
    if (q) {
      r = r.filter(
        (a) =>
          a.company.toLowerCase().includes(q) ||
          a.position.toLowerCase().includes(q) ||
          (a.sourceDetail ?? "").toLowerCase().includes(q),
      );
    }
    const sorted = [...r].sort((a, b) => cmp(a, b, sortKey));
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [apps, query, statusFilter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "updatedAt" || key === "appliedDate" ? "desc" : "asc");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground"
              aria-hidden
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search company / role..."
              className="rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-sm w-56 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ApplicationStatus | "all")
            }
            className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">All statuses ({apps.length})</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]} ({apps.filter((a) => a.status === s).length})
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => exportCsv(rows)}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
        >
          <Download className="size-3.5" aria-hidden />
          Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border bg-card/20">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border text-left">
              <Th label="Company" col="company" {...{ sortKey, sortDir, toggleSort }} />
              <Th label="Role" col="position" {...{ sortKey, sortDir, toggleSort }} />
              <Th label="Status" col="status" {...{ sortKey, sortDir, toggleSort }} />
              <Th label="Note" col="sourceDetail" {...{ sortKey, sortDir, toggleSort }} />
              <Th label="Applied" col="appliedDate" {...{ sortKey, sortDir, toggleSort }} />
              <Th label="Updated" col="updatedAt" {...{ sortKey, sortDir, toggleSort }} />
              <th className="px-3 py-2 w-px" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-10 text-center text-sm text-muted-foreground"
                >
                  {apps.length === 0
                    ? "No applications yet. Once the Gmail scan runs, jobs you've applied to show up here."
                    : "No rows match your search / filter."}
                </td>
              </tr>
            ) : (
              rows.map((app) => (
                <tr
                  key={app.id}
                  className="border-b border-border/60 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-3 py-2 font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      {app.source === "gmail" && (
                        <Mail
                          className="size-3 text-muted-foreground flex-shrink-0"
                          aria-label="From Gmail"
                        />
                      )}
                      {app.emailLink ? (
                        <a
                          href={app.emailLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline inline-flex items-center gap-1"
                        >
                          {app.company}
                          <ExternalLink className="size-3 opacity-50" aria-hidden />
                        </a>
                      ) : (
                        app.company
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{app.position}</td>
                  <td className="px-3 py-2">
                    <select
                      value={app.status}
                      onChange={(e) =>
                        onPatch(app.id, {
                          status: e.target.value as ApplicationStatus,
                        })
                      }
                      className={`text-xs font-mono rounded-md px-2 py-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${STATUS_CLASSES[app.status]}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground max-w-[18ch] truncate">
                    {app.sourceDetail ?? ""}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono text-muted-foreground tabular-nums whitespace-nowrap">
                    {fmtDate(app.appliedDate)}
                  </td>
                  <td className="px-3 py-2 text-xs font-mono text-muted-foreground tabular-nums whitespace-nowrap">
                    {fmtDate(app.updatedAt)}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => onDelete(app.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1 rounded-md hover:bg-destructive/5"
                      title="Delete this row"
                      aria-label="Delete row"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] font-mono text-muted-foreground/70">
        {rows.length} of {apps.length} shown · deleting a Gmail-sourced row is
        temporary; the next scan re-adds it unless you apply the
        JobTracker/Ignored label in Gmail.
      </p>
    </div>
  );
}

function Th({
  label,
  col,
  sortKey,
  sortDir,
  toggleSort,
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  toggleSort: (k: SortKey) => void;
}) {
  const active = sortKey === col;
  return (
    <th className="px-3 py-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground whitespace-nowrap">
      <button
        type="button"
        onClick={() => toggleSort(col)}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="size-3" aria-hidden />
          ) : (
            <ArrowDown className="size-3" aria-hidden />
          )
        ) : (
          <ChevronsUpDown className="size-3 opacity-40" aria-hidden />
        )}
      </button>
    </th>
  );
}

// ----- helpers -------------------------------------------------------------

function cmp(a: Application, b: Application, key: SortKey): number {
  switch (key) {
    case "status":
      return STATUS_RANK[a.status] - STATUS_RANK[b.status];
    case "updatedAt":
      return a.updatedAt - b.updatedAt;
    case "appliedDate":
      return (a.appliedDate ?? "").localeCompare(b.appliedDate ?? "");
    case "sourceDetail":
      return (a.sourceDetail ?? "").localeCompare(b.sourceDetail ?? "");
    default:
      return a[key].localeCompare(b[key]);
  }
}

function fmtDate(value?: string | number): string {
  if (value == null || value === "") return "—";
  const d = typeof value === "number" ? new Date(value) : new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString([], {
    year: "2-digit",
    month: "short",
    day: "numeric",
  });
}

function exportCsv(rows: Application[]) {
  const headers = [
    "Company",
    "Role",
    "Status",
    "Note",
    "Applied",
    "Updated",
    "Source",
    "Email Link",
  ];
  const lines = [headers.join(",")];
  for (const a of rows) {
    lines.push(
      [
        a.company,
        a.position,
        STATUS_LABEL[a.status],
        a.sourceDetail ?? "",
        a.appliedDate ?? "",
        new Date(a.updatedAt).toISOString().slice(0, 10),
        a.source ?? "manual",
        a.emailLink ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `applications-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvCell(v: string): string {
  // Quote if the cell contains a comma, quote, or newline; escape quotes.
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
