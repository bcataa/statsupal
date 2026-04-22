"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { Service } from "@/lib/models/monitoring";
import { IncidentCard } from "@/components/incidents/incident-card";
import type {
  Incident,
  IncidentEvent,
  IncidentSeverity,
  IncidentStatus,
  MaintenanceWindow,
} from "@/lib/models/monitoring";
import { formatDateTime } from "@/lib/utils/date-time";
import {
  loadOnCall,
  loadTemplates,
  type IssueTemplate,
  type OnCallSlot,
  saveOnCall,
  saveTemplates,
} from "@/lib/issues/local-issues-extras";
import { useAppData } from "@/state/app-data-provider";

const BG = "#0B0F14";
const SURFACE = "rgba(10, 10, 12, 0.6)";

export const ISSUE_TABS = [
  { id: "incidents" as const, label: "Incidents" },
  { id: "maintenance" as const, label: "Maintenance" },
  { id: "notices" as const, label: "Notices" },
  { id: "templates" as const, label: "Templates" },
  { id: "components" as const, label: "Components" },
  { id: "oncall" as const, label: "On-call" },
];

export type IssuesTabId = (typeof ISSUE_TABS)[number]["id"];

function relTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) {
    return "just now";
  }
  const m = Math.floor(sec / 60);
  if (m < 60) {
    return `about ${m}m ago`;
  }
  const h = Math.floor(m / 60);
  if (h < 48) {
    return `about ${h}h ago`;
  }
  const day = Math.floor(h / 24);
  return `about ${day}d ago`;
}

function statusLabel(s: IncidentStatus | string): string {
  return s.replace(/^\w/, (c) => c.toUpperCase());
}

function sevStyle(sev: IncidentSeverity): { label: string; className: string } {
  if (sev === "critical") {
    return { label: "CRITICAL", className: "bg-rose-500/20 text-rose-200 ring-1 ring-rose-500/30" };
  }
  if (sev === "major") {
    return { label: "MAJOR OUTAGE", className: "bg-rose-600/20 text-rose-100 ring-1 ring-rose-500/25" };
  }
  return { label: "MINOR", className: "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/25" };
}

type StatusFilter = "all" | "active" | "resolved";

function IssuesIcon({ resolved }: { resolved: boolean }) {
  if (resolved) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40" aria-hidden>
        ✓
      </span>
    );
  }
  return (
    <span
      className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 text-amber-200"
      aria-hidden
    >
      !
    </span>
  );
}

export function IssuesConsole() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const valid = ISSUE_TABS.some((t) => t.id === tabParam);
  const tab: IssuesTabId = valid && tabParam ? (tabParam as IssuesTabId) : "incidents";

  const setTab = useCallback(
    (id: IssuesTabId) => {
      const p = new URLSearchParams(searchParams.toString());
      p.set("tab", id);
      router.replace(`/incidents?${p.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const {
    workspace,
    services,
    incidents,
    incidentEvents,
    maintenanceWindows,
    isHydrated,
    openCreateIncidentModal,
    openAddServiceModal,
    createMaintenanceWindow,
    deleteMaintenanceWindow,
    updateIncidentStatus,
    resolveIncident,
    deleteIncident,
    appendIncidentManualUpdate,
    updateService,
  } = useAppData();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingIncidentId, setDeletingIncidentId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [mntOpen, setMntOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [templateModal, setTemplateModal] = useState<null | { mode: "create" } | { mode: "edit"; t: IssueTemplate }>(null);
  const [onCallModal, setOnCallModal] = useState(false);

  const [mntTitle, setMntTitle] = useState("");
  const [mntDesc, setMntDesc] = useState("");
  const [mntStart, setMntStart] = useState("");
  const [mntEnd, setMntEnd] = useState("");
  const [mntBusy, setMntBusy] = useState(false);

  const [noticeIncidentId, setNoticeIncidentId] = useState("");
  const [noticeBody, setNoticeBody] = useState("");

  const [tmpl, setTmpl] = useState<IssueTemplate[]>([]);
  const [onCalls, setOnCalls] = useState<OnCallSlot[]>([]);

  useEffect(() => {
    if (!isHydrated || !workspace.id) {
      return;
    }
    setTmpl(loadTemplates(workspace.id));
    setOnCalls(loadOnCall(workspace.id));
  }, [isHydrated, workspace.id]);

  const filteredIncidents = useMemo(() => {
    let list = [...incidents].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    if (filter === "active") {
      list = list.filter((i) => i.status !== "resolved");
    } else if (filter === "resolved") {
      list = list.filter((i) => i.status === "resolved");
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((i) => i.title.toLowerCase().includes(q));
    }
    return list;
  }, [incidents, filter, search]);

  const serviceName = useCallback(
    (id: string) => services.find((s) => s.id === id)?.name ?? "Service",
    [services],
  );

  const noticesFeed = useMemo(() => {
    const byIncident = new Map(incidents.map((i) => [i.id, i]));
    const q = search.trim().toLowerCase();
    const rows: { e: IncidentEvent; incident: Incident }[] = [];
    for (const e of [...incidentEvents].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )) {
      if (!["manual_update", "resolved", "status_changed", "created"].includes(e.eventType)) {
        continue;
      }
      const incident = byIncident.get(e.incidentId);
      if (!incident) {
        continue;
      }
      if (q) {
        if (
          !e.message.toLowerCase().includes(q) &&
          !incident.title.toLowerCase().includes(q)
        ) {
          continue;
        }
      }
      rows.push({ e, incident });
    }
    return rows;
  }, [incidentEvents, incidents, search]);

  const onAddPrimary = () => {
    if (tab === "incidents") {
      openCreateIncidentModal();
    } else if (tab === "maintenance") {
      setMntOpen(true);
    } else if (tab === "notices") {
      setNoticeOpen(true);
    } else if (tab === "templates") {
      setTemplateModal({ mode: "create" });
    } else if (tab === "components") {
      openAddServiceModal();
    } else {
      setOnCallModal(true);
    }
  };

  const addLabel = useMemo(() => {
    const map: Record<IssuesTabId, string> = {
      incidents: "Add incident",
      maintenance: "Add maintenance",
      notices: "Add notice",
      templates: "Add template",
      components: "Add component",
      oncall: "Add schedule",
    };
    return map[tab];
  }, [tab]);

  const onSubmitMaintenance = async (e: FormEvent) => {
    e.preventDefault();
    if (!mntTitle.trim() || !mntStart || !mntEnd) {
      return;
    }
    try {
      setMntBusy(true);
      await createMaintenanceWindow({
        title: mntTitle.trim(),
        description: mntDesc.trim() || undefined,
        startsAt: new Date(mntStart).toISOString(),
        endsAt: new Date(mntEnd).toISOString(),
        affectedServiceIds: [],
      });
      setMntOpen(false);
      setMntTitle("");
      setMntDesc("");
      setMntStart("");
      setMntEnd("");
    } catch (err) {
      console.error(err);
    } finally {
      setMntBusy(false);
    }
  };

  const onSubmitNotice = (e: FormEvent) => {
    e.preventDefault();
    if (!noticeIncidentId || !noticeBody.trim()) {
      return;
    }
    appendIncidentManualUpdate(noticeIncidentId, noticeBody);
    setNoticeOpen(false);
    setNoticeBody("");
  };

  if (!isHydrated) {
    return (
      <div
        className="mx-auto w-full max-w-5xl animate-pulse rounded-[1.5rem] border border-white/10 p-6 sm:p-8"
        style={{ background: SURFACE }}
      >
        <div className="h-6 w-48 rounded-lg bg-zinc-800" />
        <div className="mt-1 h-4 w-2/3 max-w-md rounded bg-zinc-800/60" />
        <div className="mt-6 h-2 rounded-full bg-gradient-to-r from-emerald-500/40 to-cyan-500/30" />
        <div className="mt-6 h-40 rounded-xl bg-zinc-800/70" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div
        className="overflow-hidden rounded-[1.5rem] border border-white/[0.08] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_24px_64px_-24px_rgba(0,0,0,0.85),0_0_80px_-32px_rgba(139,92,246,0.12)]"
        style={{ background: SURFACE }}
      >
        <div className="border-b border-white/[0.06] px-3 py-3 sm:px-5 sm:py-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="no-scrollbar -mx-0.5 flex min-w-0 flex-wrap items-center gap-1.5 overflow-x-auto pb-0.5 sm:gap-2 sm:pb-0">
              {ISSUE_TABS.map(({ id, label }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    className={[
                      "shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition sm:text-[13px]",
                      active
                        ? "border-violet-500/45 bg-violet-500/10 text-violet-100 shadow-[0_0_24px_-8px_rgba(139,92,246,0.45)]"
                        : "border-transparent text-zinc-500 hover:border-white/10 hover:text-zinc-200",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2">
              {tab === "components" ? (
                <Link
                  href="/services"
                  className="hidden text-xs text-zinc-500 underline-offset-2 hover:text-zinc-300 hover:underline sm:inline"
                >
                  View monitors
                </Link>
              ) : null}
              <button
                type="button"
                onClick={onAddPrimary}
                className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/90 py-1.5 pl-4 pr-1.5 text-sm font-medium text-zinc-100 transition hover:border-violet-400/35 hover:shadow-[0_0_20px_-8px_rgba(139,92,246,0.35)]"
              >
                <span className="max-w-[11rem] truncate sm:max-w-none">{addLabel}</span>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold leading-none text-zinc-900 transition group-hover:bg-zinc-100">
                  +
                </span>
              </button>
            </div>
          </div>
        </div>
        <div
          className="h-1.5 w-full bg-gradient-to-r from-emerald-500/85 via-teal-400/80 to-cyan-500/75"
          aria-hidden
        />
        <div className="px-2 py-3 sm:px-4 sm:py-5">
          {actionError ? (
            <p className="mb-3 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {actionError}
            </p>
          ) : null}

          {tab === "incidents" ? (
            <IncidentsTableSection
              search={search}
              onSearch={setSearch}
              filter={filter}
              onFilter={setFilter}
              totalIncidents={incidents.length}
              filteredIncidents={filteredIncidents}
              expandedId={expandedId}
              onToggleRow={(id) => setExpandedId((x) => (x === id ? null : id))}
              serviceName={serviceName}
              incidentEvents={incidentEvents}
              updateIncidentStatus={updateIncidentStatus}
              resolveIncident={resolveIncident}
              onCreateIncident={openCreateIncidentModal}
              onDelete={async (id: string) => {
                setActionError(null);
                setDeletingIncidentId(id);
                try {
                  await deleteIncident(id);
                } catch (err) {
                  setActionError(
                    err instanceof Error ? err.message : "Could not delete incident.",
                  );
                } finally {
                  setDeletingIncidentId(null);
                }
              }}
              deletingIncidentId={deletingIncidentId}
            />
          ) : null}

          {tab === "maintenance" ? (
            <MaintenanceSection
              search={search}
              onSearch={setSearch}
              items={maintenanceWindows}
              serviceName={serviceName}
              onDelete={deleteMaintenanceWindow}
            />
          ) : null}

          {tab === "notices" ? (
            <NoticesSection search={search} onSearch={setSearch} feed={noticesFeed} />
          ) : null}

          {tab === "templates" ? (
            <TemplatesSection
              search={search}
              onSearch={setSearch}
              items={tmpl}
              onItemsChange={(next) => {
                setTmpl(next);
                saveTemplates(workspace.id, next);
              }}
              onAdd={() => setTemplateModal({ mode: "create" })}
              onEdit={(t) => setTemplateModal({ mode: "edit", t })}
            />
          ) : null}

          {tab === "components" ? (
            <ComponentsSection
              search={search}
              onSearch={setSearch}
              services={services}
              updateService={updateService}
            />
          ) : null}

          {tab === "oncall" ? (
            <OnCallSection
              search={search}
              onSearch={setSearch}
              items={onCalls}
              onItemsChange={(next) => {
                setOnCalls(next);
                saveOnCall(workspace.id, next);
              }}
              onAdd={() => setOnCallModal(true)}
            />
          ) : null}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-4 text-xs text-zinc-500">
            <Link
              href="/onboarding/wizard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/50 px-3 py-2 font-medium text-zinc-400 transition hover:border-violet-500/30 hover:text-zinc-200"
            >
              <span className="text-amber-400" aria-hidden>
                ⚡
              </span>
              Onboard
            </Link>
            <Link
              href="/product"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-950/50 px-3 py-2 font-medium text-zinc-400 transition hover:border-emerald-500/30 hover:text-zinc-200"
            >
              <span aria-hidden className="text-emerald-400/90">
                ↑
              </span>
              Upgrade
            </Link>
          </div>
        </div>
      </div>

      {mntOpen ? (
        <MaintenanceFormModal
          onClose={() => setMntOpen(false)}
          title={mntTitle}
          setTitle={setMntTitle}
          desc={mntDesc}
          setDesc={setMntDesc}
          start={mntStart}
          setStart={setMntStart}
          end={mntEnd}
          setEnd={setMntEnd}
          busy={mntBusy}
          onSubmit={onSubmitMaintenance}
        />
      ) : null}

      {noticeOpen ? (
        <NoticeFormModal
          onClose={() => setNoticeOpen(false)}
          incidents={incidents}
          selectedId={noticeIncidentId}
          onSelectId={setNoticeIncidentId}
          body={noticeBody}
          onBody={setNoticeBody}
          onSubmit={onSubmitNotice}
        />
      ) : null}

      {templateModal ? (
        <TemplateFormModal
          key={templateModal.mode === "edit" ? templateModal.t.id : "new-tmpl"}
          mode={templateModal.mode}
          initial={templateModal.mode === "edit" ? templateModal.t : null}
          onClose={() => setTemplateModal(null)}
          onSave={(item) => {
            setTmpl((prev) => {
              let next: IssueTemplate[];
              if (templateModal.mode === "create") {
                next = [item, ...prev];
              } else {
                next = prev.map((x) => (x.id === item.id ? item : x));
              }
              saveTemplates(workspace.id, next);
              return next;
            });
            setTemplateModal(null);
          }}
        />
      ) : null}

      {onCallModal ? (
        <OnCallFormModal
          onClose={() => setOnCallModal(false)}
          onSave={(slot) => {
            setOnCalls((prev) => {
              const next = [slot, ...prev];
              saveOnCall(workspace.id, next);
              return next;
            });
            setOnCallModal(false);
          }}
        />
      ) : null}
    </div>
  );
}

function IncidentsTableSection({
  search,
  onSearch,
  filter,
  onFilter,
  totalIncidents,
  filteredIncidents,
  expandedId,
  onToggleRow,
  serviceName,
  incidentEvents,
  updateIncidentStatus,
  resolveIncident,
  onCreateIncident,
  onDelete,
  deletingIncidentId,
}: {
  search: string;
  onSearch: (v: string) => void;
  filter: StatusFilter;
  onFilter: (f: StatusFilter) => void;
  totalIncidents: number;
  filteredIncidents: Incident[];
  expandedId: string | null;
  onToggleRow: (id: string) => void;
  serviceName: (id: string) => string;
  incidentEvents: IncidentEvent[];
  updateIncidentStatus: (id: string, s: IncidentStatus) => void;
  resolveIncident: (id: string, summary?: string) => void;
  onCreateIncident: () => void;
  onDelete: (id: string) => Promise<void>;
  deletingIncidentId: string | null;
}) {
  const searchRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["all", "All"],
              ["active", "Active"],
              ["resolved", "Resolved"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              onClick={() => onFilter(k)}
              className={[
                "rounded-full px-2.5 py-1 text-[11px] font-medium transition",
                filter === k
                  ? "bg-violet-500/15 text-violet-100 ring-1 ring-violet-500/30"
                  : "text-zinc-500 hover:text-zinc-300",
              ].join(" ")}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search incidents…"
              className="w-full min-w-[8rem] rounded-lg border border-white/[0.08] bg-[#0a0a0a] py-1.5 pl-2.5 pr-7 text-xs text-zinc-200 placeholder:text-zinc-600 sm:w-52"
            />
            <span className="pointer-events-none absolute right-2 top-1.5 text-zinc-500" aria-hidden>
              ⌕
            </span>
          </div>
        </div>
      </div>

      {filteredIncidents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-zinc-950/30 py-14 text-center">
          <p className="text-sm font-medium text-zinc-300">
            {totalIncidents === 0
              ? "No incidents yet"
              : "No incidents match this view"}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {totalIncidents === 0
              ? "Create an incident to track impact, post updates, and keep your status page in sync."
              : "Try another filter or clear search."}
          </p>
          {totalIncidents === 0 ? (
            <button
              type="button"
              onClick={onCreateIncident}
              className="mt-5 rounded-full border border-violet-500/40 bg-violet-500/10 px-5 py-2.5 text-sm font-medium text-violet-100 transition hover:border-violet-400/50 hover:bg-violet-500/20"
            >
              Create your first incident
            </button>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-zinc-950/20">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                <th className="w-10 py-2.5 pl-2 pr-0" />
                <th className="py-2.5 pr-2">Incident</th>
                <th className="py-2.5 pr-2">Details</th>
                <th className="min-w-[7rem] py-2.5 text-right">Started</th>
                <th className="w-24 py-2.5 pr-2 text-right">
                  <span className="sr-only">List tools</span>
                  <div className="inline-flex items-center justify-end gap-0.5">
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
                      aria-label="Focus search"
                      onClick={() => searchRef.current?.focus()}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                        <circle cx="11" cy="11" r="7" />
                        <path d="M20 20l-3-3" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-zinc-500 transition hover:bg-white/5 hover:text-zinc-200"
                      aria-label="More list actions (coming soon)"
                      title="More options (coming soon)"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <circle cx="5" cy="12" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="19" cy="12" r="1.5" />
                      </svg>
                    </button>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((inc) => {
                const resolved = inc.status === "resolved";
                const sev = sevStyle(inc.severity);
                return (
                  <Fragment key={inc.id}>
                    <tr
                      className="group border-b border-white/[0.04] transition duration-200 hover:bg-violet-500/[0.06]"
                    >
                      <td className="px-1.5 py-2.5 align-middle">
                        <IssuesIcon resolved={resolved} />
                      </td>
                      <td className="max-w-[14rem] py-2.5 align-top">
                        <button
                          type="button"
                          onClick={() => onToggleRow(inc.id)}
                          className="text-left font-medium text-zinc-100 group-hover:text-white"
                        >
                          {inc.title}
                        </button>
                        <p className="text-xs text-zinc-500">{statusLabel(inc.status)}</p>
                      </td>
                      <td className="max-w-xs py-2.5 align-top">
                        <span
                          className={[
                            "inline-block rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide",
                            sev.className,
                          ].join(" ")}
                        >
                          {sev.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap py-2.5 text-right text-xs tabular-nums text-zinc-500">
                        {relTime(inc.startedAt)}
                      </td>
                      <td className="py-2.5 pr-2 text-right align-middle text-zinc-500 group-hover:text-violet-300/90" aria-hidden>
                        ›
                      </td>
                    </tr>
                    {expandedId === inc.id ? (
                      <tr className="bg-zinc-950/50">
                        <td colSpan={5} className="border-b border-white/[0.06] p-0">
                          <div className="p-2 sm:p-3">
                            <IncidentCard
                              incident={inc}
                              timelineEvents={incidentEvents
                                .filter((e) => e.incidentId === inc.id)
                                .sort(
                                  (a, b) =>
                                    new Date(b.createdAt).getTime() -
                                    new Date(a.createdAt).getTime(),
                                )}
                              serviceName={serviceName(inc.affectedServiceId)}
                              onUpdateStatus={updateIncidentStatus}
                              onResolve={resolveIncident}
                              onDelete={onDelete}
                              isDeleting={deletingIncidentId === inc.id}
                            />
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MaintenanceSection({
  search,
  onSearch,
  items,
  serviceName,
  onDelete,
}: {
  search: string;
  onSearch: (v: string) => void;
  items: MaintenanceWindow[];
  serviceName: (id: string) => string;
  onDelete: (id: string) => Promise<void>;
}) {
  const q = search.trim().toLowerCase();
  const list = items
    .filter((w) => !q || w.title.toLowerCase().includes(q))
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search…"
          className="w-full max-w-xs rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-1.5 text-xs text-zinc-200"
        />
      </div>
      {list.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">No maintenance windows. Add one to plan work.</p>
      ) : (
        <ul className="space-y-1">
          {list.map((w) => (
            <li
              key={w.id}
              className="flex flex-col gap-1 rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 transition hover:border-cyan-500/25 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-zinc-100">{w.title}</p>
                <p className="text-xs text-zinc-500">
                  {formatDateTime(w.startsAt)} – {formatDateTime(w.endsAt)}
                </p>
                {w.affectedServiceIds.length > 0 ? (
                  <p className="text-[11px] text-zinc-600">
                    Affects: {w.affectedServiceIds.map(serviceName).join(", ")}
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-200">
                  {w.status}
                </span>
                <button
                  type="button"
                  className="text-xs text-rose-400/90 hover:underline"
                  onClick={() => {
                    if (window.confirm("Delete this maintenance window?")) {
                      void onDelete(w.id);
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NoticesSection({
  search,
  onSearch,
  feed,
}: {
  search: string;
  onSearch: (v: string) => void;
  feed: { e: IncidentEvent; incident: Incident }[];
}) {
  return (
    <div>
      <p className="mb-2 text-xs text-zinc-500">
        Updates posted on incidents and shown on your communications timeline.
      </p>
      <div className="mb-3 flex justify-end">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search…"
          className="w-full max-w-xs rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-1.5 text-xs text-zinc-200"
        />
      </div>
      {feed.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">No notice-style updates yet. Use Add notice after an incident exists.</p>
      ) : (
        <ul className="space-y-2">
          {feed.map(({ e, incident }) => (
            <li
              key={e.id}
              className="rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2.5 text-sm"
            >
              <p className="font-medium text-zinc-200">{incident.title}</p>
              <p className="mt-1 text-zinc-400">{e.message}</p>
              <p className="mt-1 text-xs text-zinc-600">
                {e.eventType} · {relTime(e.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TemplatesSection({
  search,
  onSearch,
  items,
  onItemsChange,
  onAdd,
  onEdit,
}: {
  search: string;
  onSearch: (v: string) => void;
  items: IssueTemplate[];
  onItemsChange: (next: IssueTemplate[]) => void;
  onAdd: () => void;
  onEdit: (t: IssueTemplate) => void;
}) {
  const q = search.trim().toLowerCase();
  const list = items.filter((t) => !q || t.title.toLowerCase().includes(q) || t.body.toLowerCase().includes(q));
  return (
    <div>
      <p className="mb-2 text-xs text-amber-200/60">Templates are stored in this browser for quick drafts. Sync to a database may come later.</p>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search…"
          className="w-full max-w-xs rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-1.5 text-xs text-zinc-200"
        />
        <button
          type="button"
          onClick={onAdd}
          className="text-xs text-cyan-400 hover:underline"
        >
          + New
        </button>
      </div>
      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">No templates. Create one to reuse copy for incidents or maintenance.</p>
      ) : (
        <ul className="space-y-1.5">
          {list.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-lg border border-white/[0.08] px-3 py-2">
              <div>
                <p className="text-sm text-zinc-200">{t.title}</p>
                <p className="text-[10px] text-zinc-600">{t.kind}</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="text-xs text-cyan-400" onClick={() => onEdit(t)}>Edit</button>
                <button
                  type="button"
                  className="text-xs text-rose-400/90"
                  onClick={() => {
                    if (window.confirm("Delete this template?")) {
                      onItemsChange(items.filter((x) => x.id !== t.id));
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ComponentsSection({
  search,
  onSearch,
  services,
  updateService,
}: {
  search: string;
  onSearch: (v: string) => void;
  services: Service[];
  updateService: (input: {
    id: string;
    name: string;
    url: string;
    checkType: Service["checkType"];
    checkInterval: string;
    timeoutMs: number;
    failureThreshold: number;
    retryCount: number;
    description?: string;
    isPublished?: boolean;
  }) => Promise<void>;
}) {
  const q = search.trim().toLowerCase();
  const list = services.filter((s) => !q || s.name.toLowerCase().includes(q) || s.url.toLowerCase().includes(q));
  return (
    <div>
      <p className="mb-2 text-xs text-zinc-500">Components map to your monitored services. Manage monitors in the Monitors page or toggle public visibility here.</p>
      <div className="mb-3 flex justify-end">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search…"
          className="w-full max-w-xs rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-1.5 text-xs text-zinc-200"
        />
      </div>
      {list.length === 0 ? (
        <p className="py-6 text-sm text-zinc-500">No services yet. Add a monitor to see components.</p>
      ) : (
        <ul className="space-y-1">
          {list.map((s) => (
            <li
              key={s.id}
              className="flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-[#0a0a0a] px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium text-zinc-100">{s.name}</p>
                <p className="text-xs text-zinc-500">{s.url}</p>
                <p className="text-[10px] uppercase text-zinc-600">Status: {s.status}</p>
              </div>
              <label className="flex items-center gap-2 text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={s.isPublished}
                  onChange={(e) => {
                    void updateService({
                      id: s.id,
                      name: s.name,
                      url: s.url,
                      checkType: s.checkType,
                      checkInterval: s.checkInterval,
                      timeoutMs: s.timeoutMs,
                      failureThreshold: s.failureThreshold,
                      retryCount: s.retryCount,
                      description: s.description,
                      isPublished: e.target.checked,
                    });
                  }}
                />
                Public on status page
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function OnCallSection({
  search,
  onSearch,
  items,
  onAdd,
  onItemsChange,
}: {
  search: string;
  onSearch: (v: string) => void;
  items: OnCallSlot[];
  onAdd: () => void;
  onItemsChange: (next: OnCallSlot[]) => void;
}) {
  const q = search.trim().toLowerCase();
  const list = items.filter(
    (x) => !q || x.name.toLowerCase().includes(q) || x.contact.toLowerCase().includes(q),
  );
  return (
    <div>
      <p className="mb-2 text-xs text-amber-200/60">On-call slots are stored in this browser for now; calendar integrations may be added later.</p>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search…"
          className="w-full max-w-xs rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-1.5 text-xs text-zinc-200"
        />
        <button type="button" onClick={onAdd} className="text-xs text-cyan-400">+ New</button>
      </div>
      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">No on-call schedule yet.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-zinc-200">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-zinc-500">
                  {formatDateTime(s.startsAt)} – {formatDateTime(s.endsAt)} · {s.contact}
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-rose-400"
                onClick={() => onItemsChange(items.filter((i) => i.id !== s.id))}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MaintenanceFormModal({
  onClose,
  title,
  setTitle,
  desc,
  setDesc,
  start,
  setStart,
  end,
  setEnd,
  busy,
  onSubmit,
}: {
  onClose: () => void;
  title: string;
  setTitle: (s: string) => void;
  desc: string;
  setDesc: (s: string) => void;
  start: string;
  setStart: (s: string) => void;
  end: string;
  setEnd: (s: string) => void;
  busy: boolean;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close" />
      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-md space-y-3 rounded-2xl border border-white/[0.08] p-4 shadow-xl"
        style={{ backgroundColor: BG }}
      >
        <h3 className="text-lg font-semibold text-zinc-100">New maintenance</h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-2 text-sm"
          required
        />
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Description (optional)"
          className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-2 text-sm"
          rows={2}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <label className="text-xs text-zinc-500">Starts</label>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-0.5 w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-1.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500">Ends</label>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-0.5 w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-1.5 text-sm"
              required
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm text-zinc-500">Cancel</button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-cyan-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            {busy ? "Saving…" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

function NoticeFormModal({
  onClose,
  incidents,
  selectedId,
  onSelectId,
  body,
  onBody,
  onSubmit,
}: {
  onClose: () => void;
  incidents: Incident[];
  selectedId: string;
  onSelectId: (id: string) => void;
  body: string;
  onBody: (s: string) => void;
  onSubmit: (e: FormEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close" />
      <form
        onSubmit={onSubmit}
        className="relative z-10 w-full max-w-md space-y-3 rounded-2xl border border-white/[0.08] p-4"
        style={{ backgroundColor: BG }}
      >
        <h3 className="text-lg font-semibold text-zinc-100">Post notice</h3>
        <p className="text-xs text-zinc-500">Adds a manual update to an incident&rsquo;s timeline (and persists to the database).</p>
        <select
          value={selectedId}
          onChange={(e) => onSelectId(e.target.value)}
          className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-2 text-sm"
          required
        >
          <option value="" disabled>
            Select incident
          </option>
          {incidents.map((i) => (
            <option key={i.id} value={i.id}>
              {i.title} ({i.status})
            </option>
          ))}
        </select>
        <textarea
          value={body}
          onChange={(e) => onBody(e.target.value)}
          placeholder="Message to subscribers and timeline"
          className="min-h-24 w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-2 text-sm"
          required
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm text-zinc-500">Cancel</button>
          <button type="submit" className="rounded-lg bg-cyan-600 px-3 py-1.5 text-sm text-white">Post</button>
        </div>
      </form>
    </div>
  );
}

function TemplateFormModal({
  mode,
  initial,
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  initial: IssueTemplate | null;
  onClose: () => void;
  onSave: (t: IssueTemplate) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [kind, setKind] = useState<"incident" | "maintenance">(initial?.kind ?? "incident");
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 w-full max-w-md space-y-3 rounded-2xl border border-white/[0.08] p-4" style={{ backgroundColor: BG }}>
        <h3 className="text-lg font-semibold text-zinc-100">{mode === "create" ? "New template" : "Edit template"}</h3>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-2 text-sm" placeholder="Title" />
        <select value={kind} onChange={(e) => setKind(e.target.value as "incident" | "maintenance")} className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-2 text-sm">
          <option value="incident">Incident</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-28 w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-2 text-sm" placeholder="Template body" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm text-zinc-500">Cancel</button>
          <button
            type="button"
            onClick={() => {
              const now = new Date().toISOString();
              const id = initial?.id ?? `tmp_${Math.random().toString(36).slice(2, 10)}`;
              onSave({
                id,
                title: title.trim() || "Untitled",
                body,
                kind,
                createdAt: initial?.createdAt ?? now,
                updatedAt: now,
              });
            }}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function OnCallFormModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (s: OnCallSlot) => void;
}) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [contact, setContact] = useState("");
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={onClose} aria-label="Close" />
      <div className="relative z-10 w-full max-w-md space-y-3 rounded-2xl border border-white/[0.08] p-4" style={{ backgroundColor: BG }}>
        <h3 className="text-lg font-semibold text-zinc-100">On-call block</h3>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-2 text-sm" placeholder="Label" />
        <div className="grid gap-2 sm:grid-cols-2">
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-1.5 text-sm" />
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-1.5 text-sm" />
        </div>
        <input value={contact} onChange={(e) => setContact(e.target.value)} className="w-full rounded-lg border border-white/[0.08] bg-[#0a0a0a] px-2 py-2 text-sm" placeholder="Contact (email, phone, Slack)" />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="text-sm text-zinc-500">Cancel</button>
          <button
            type="button"
            onClick={() => {
              onSave({
                id: `oc_${Math.random().toString(36).slice(2, 10)}`,
                name: name || "On-call",
                startsAt: start ? new Date(start).toISOString() : new Date().toISOString(),
                endsAt: end ? new Date(end).toISOString() : new Date().toISOString(),
                contact: contact || "—",
                createdAt: new Date().toISOString(),
              });
            }}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
