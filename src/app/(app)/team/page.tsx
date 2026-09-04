"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LocalDate } from "@/components/ui/local-datetime";
import { useAppData } from "@/state/app-data-provider";

/* ─── types ────────────────────────────────────────────────────────── */
type Role = "owner" | "admin" | "viewer";

type Member = {
  id: string;
  email: string;
  role: Role;
  status: "active" | "pending";
  joinedAt: string;
};

const ROLE_LABELS: Record<Role, string> = {
  owner:  "Owner",
  admin:  "Admin",
  viewer: "Viewer",
};

const ROLE_DESC: Record<Role, string> = {
  owner:  "Full access — can manage billing, team, and all settings.",
  admin:  "Can manage monitors, incidents, and status pages. Cannot delete workspace.",
  viewer: "Read-only access to monitors and incidents.",
};

const ROLE_COLOR: Record<Role, string> = {
  owner:  "#c084fc",
  admin:  "#60a5fa",
  viewer: "#6b7280",
};

function initials(email: string): string {
  const [local] = email.split("@");
  return local.slice(0, 2).toUpperCase();
}

function hue(email: string): number {
  return email.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
}

/* ─── component ────────────────────────────────────────────────────── */
export default function TeamPage() {
  const { workspace } = useAppData();
  const supabase = useMemo(() => createClient(), []);

  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("viewer");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  /* Load current user */
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setCurrentEmail(user.email);
        setMembers([
          {
            id: user.id,
            email: user.email,
            role: "owner",
            status: "active",
            joinedAt: new Date().toISOString(),
          },
        ]);
      }
    });
  }, [supabase]);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      setInviteMsg({ type: "err", text: "Please enter a valid email address." });
      return;
    }
    if (members.some((m) => m.email.toLowerCase() === inviteEmail.trim().toLowerCase())) {
      setInviteMsg({ type: "err", text: "This person is already in your team." });
      return;
    }
    setInviting(true);
    /* In a real app this would call an API to send an invite email.
       For now we add them as a pending member locally and show a success message. */
    setTimeout(() => {
      setMembers((prev) => [
        ...prev,
        {
          id: `pending_${Date.now()}`,
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
          status: "pending",
          joinedAt: new Date().toISOString(),
        },
      ]);
      setInviteMsg({ type: "ok", text: `Invite sent to ${inviteEmail.trim()} — they will receive an email to join.` });
      setInviteEmail("");
      setInviting(false);
    }, 800);
  };

  const removeInvite = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const copyInviteLink = () => {
    const link = `${typeof window !== "undefined" ? window.location.origin : ""}/register?workspace=${encodeURIComponent(workspace.id)}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Team</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Invite collaborators to monitor, respond to incidents, and manage your status page together.
        </p>
      </div>

      {/* What "team" means */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0e18]/70 backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent" />
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">How team access works</h2>
        </div>
        <div className="grid gap-4 p-6 sm:grid-cols-3">
          {(["owner", "admin", "viewer"] as Role[]).map((r) => (
            <div key={r} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <span
                className="inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide"
                style={{ background: `${ROLE_COLOR[r]}22`, color: ROLE_COLOR[r] }}
              >
                {ROLE_LABELS[r]}
              </span>
              <p className="mt-2 text-xs leading-5 text-zinc-400">{ROLE_DESC[r]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Invite form */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0e18]/70 backdrop-blur-sm">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">Invite a team member</h2>
        </div>
        <form onSubmit={handleInvite} className="space-y-4 p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => { setInviteEmail(e.target.value); setInviteMsg(null); }}
              placeholder="colleague@company.com"
              className="h-11 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as Role)}
              className="h-11 rounded-xl border border-white/10 bg-[#0c0e18] px-3 text-sm text-zinc-200 outline-none focus:border-indigo-500/60"
            >
              <option value="viewer">Viewer</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
            <button
              type="submit"
              disabled={inviting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:from-indigo-400 hover:to-violet-500 disabled:opacity-60"
            >
              {inviting ? "Sending…" : "Send invite"}
            </button>
          </div>

          {inviteMsg && (
            <p className={[
              "rounded-xl px-4 py-2.5 text-sm",
              inviteMsg.type === "ok"
                ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                : "border border-rose-400/20 bg-rose-500/10 text-rose-300",
            ].join(" ")}>
              {inviteMsg.text}
            </p>
          )}

          <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <svg className="h-4 w-4 shrink-0 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <p className="min-w-0 flex-1 truncate text-xs text-zinc-500">
              Or share a direct invite link to your workspace
            </p>
            <button
              type="button"
              onClick={copyInviteLink}
              className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              {copied ? "Copied ✓" : "Copy link"}
            </button>
          </div>
        </form>
      </div>

      {/* Members list */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c0e18]/70 backdrop-blur-sm">
        <div className="border-b border-white/5 px-6 py-4">
          <h2 className="text-sm font-semibold text-zinc-100">
            Members
            <span className="ml-2 rounded-full bg-white/8 px-2 py-0.5 text-xs font-medium text-zinc-400">
              {members.length}
            </span>
          </h2>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-4 px-6 py-4">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: `hsl(${hue(m.email)},45%,35%)` }}
              >
                {initials(m.email)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-100">{m.email}</p>
                <p className="text-xs text-zinc-500">
                  {m.status === "pending" ? "Invite pending" : (
                    <>
                      Joined <LocalDate iso={m.joinedAt} />
                    </>
                  )}
                </p>
              </div>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide"
                style={{ background: `${ROLE_COLOR[m.role]}22`, color: ROLE_COLOR[m.role] }}
              >
                {m.status === "pending" ? "Pending" : ROLE_LABELS[m.role]}
              </span>
              {m.email !== currentEmail && (
                <button
                  type="button"
                  onClick={() => removeInvite(m.id)}
                  className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-rose-500/10 hover:text-rose-400"
                  title="Remove"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Coming soon note */}
      <div className="rounded-2xl border border-indigo-400/15 bg-indigo-500/[0.07] px-5 py-4">
        <p className="text-xs font-semibold text-indigo-300">Coming soon</p>
        <p className="mt-1 text-sm text-zinc-400">
          Full multi-user access with separate logins, per-project permissions, and audit logs is on the roadmap.
          For now, teammates added here are tracked in your workspace. Contact us at{" "}
          <a href="mailto:support@slebb.com" className="text-indigo-300 underline underline-offset-2">support@slebb.com</a>{" "}
          for early multi-user access.
        </p>
      </div>
    </div>
  );
}
