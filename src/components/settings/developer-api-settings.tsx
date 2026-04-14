"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { formatDateTime } from "@/lib/utils/date-time";
import { API_SCOPES, type ApiScope } from "@/lib/developer-api/scopes";

type ApiKeyRow = {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at: string | null;
  created_at: string;
};

export function DeveloperApiSettings() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<Set<ApiScope>>(
    () => new Set(["read:status", "read:incidents"]),
  );
  const [creating, setCreating] = useState(false);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/developer/keys", { credentials: "include" });
      const data = (await res.json()) as { success?: boolean; keys?: ApiKeyRow[]; message?: string };
      if (!res.ok || !data.success) {
        setError(data.message ?? "Could not load API keys.");
        setKeys([]);
        return;
      }
      setKeys(data.keys ?? []);
    } catch {
      setError("Could not load API keys.");
      setKeys([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  const toggleScope = (s: ApiScope) => {
    setSelectedScopes((prev) => {
      const next = new Set(prev);
      if (next.has(s)) {
        next.delete(s);
      } else {
        next.add(s);
      }
      return next;
    });
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setNewKeySecret(null);
    try {
      const res = await fetch("/api/developer/keys", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          scopes: Array.from(selectedScopes),
        }),
      });
      const data = (await res.json()) as {
        success?: boolean;
        key?: string;
        message?: string;
      };
      if (!res.ok || !data.success || !data.key) {
        setError(data.message ?? "Could not create key.");
        return;
      }
      setNewKeySecret(data.key);
      setName("");
      await loadKeys();
    } catch {
      setError("Could not create key.");
    } finally {
      setCreating(false);
    }
  };

  const onRevoke = async (id: string) => {
    if (!window.confirm("Revoke this API key? Integrations using it will stop working.")) {
      return;
    }
    setRevokingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/developer/keys/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { success?: boolean; message?: string };
      if (!res.ok || !data.success) {
        setError(data.message ?? "Could not revoke key.");
        return;
      }
      await loadKeys();
    } catch {
      setError("Could not revoke key.");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-900">Developer API</h3>
      <p className="mt-1 text-sm text-zinc-500">
        Create scoped keys to call Statsupal from scripts, CI, or internal tools. Keys are shown in
        full only once—store them safely. Use{" "}
        <code className="rounded bg-zinc-100 px-1 text-xs">Authorization: Bearer &lt;key&gt;</code> on
        public API routes.
      </p>
      <p className="mt-2">
        <Link
          href="/developer-docs"
          className="text-sm font-medium text-violet-700 underline-offset-2 hover:underline"
        >
          Open API &amp; AI guide
        </Link>
        <span className="text-sm text-zinc-500"> — copy-ready examples and error help.</span>
      </p>

      {error ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {newKeySecret ? (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <p className="text-sm font-semibold text-amber-950">Copy your new key now</p>
          <p className="mt-1 text-xs text-amber-900/90">
            This is the only time the full secret is shown. It is stored hashed on our servers.
          </p>
          <code className="mt-2 block break-all rounded-lg bg-white px-3 py-2 text-xs text-zinc-900">
            {newKeySecret}
          </code>
          <CopyButton
            text={newKeySecret}
            label="Copy key to clipboard"
            copiedLabel="Copied"
            className="mt-2 inline-flex rounded-lg border border-amber-400/60 bg-amber-100/80 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-200/80"
          />
          <button
            type="button"
            onClick={() => setNewKeySecret(null)}
            className="ml-4 mt-2 text-xs font-medium text-zinc-600 underline"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <form className="mt-6 space-y-4 border-t border-zinc-100 pt-6" onSubmit={onCreate}>
        <p className="text-sm font-medium text-zinc-800">Create a new key</p>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Label</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. CI pipeline"
            className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-400 focus:ring-2"
            maxLength={120}
          />
        </div>
        <fieldset>
          <legend className="text-sm font-medium text-zinc-700">Scopes</legend>
          <p className="mt-1 text-xs text-zinc-500">
            Grant only what each integration needs. Write scopes can change your workspace data.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {API_SCOPES.map((s) => (
              <label
                key={s}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedScopes.has(s)}
                  onChange={() => toggleScope(s)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <code className="text-xs text-zinc-800">{s}</code>
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={creating || !name.trim() || selectedScopes.size === 0}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {creating ? "Creating…" : "Generate API key"}
        </button>
      </form>

      <div className="mt-8 border-t border-zinc-100 pt-6">
        <p className="text-sm font-medium text-zinc-800">Active keys</p>
        {loading ? (
          <p className="mt-3 text-sm text-zinc-500">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No active keys yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {keys.map((k) => (
              <li
                key={k.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-900">{k.name}</p>
                  <p className="mt-0.5 font-mono text-xs text-zinc-500">{k.key_prefix}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Scopes: {k.scopes?.join(", ") || "—"}
                    <br />
                    Last used: {k.last_used_at ? formatDateTime(k.last_used_at) : "Never"}
                    <br />
                    Created: {formatDateTime(k.created_at)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void onRevoke(k.id)}
                  disabled={revokingId === k.id}
                  className="shrink-0 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-800 hover:bg-rose-50 disabled:opacity-60"
                >
                  {revokingId === k.id ? "Revoking…" : "Revoke"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
