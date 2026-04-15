"use client";

import Link from "next/link";
import { CopyButton } from "@/components/ui/copy-button";
import { API_SCOPES } from "@/lib/developer-api/scopes";

type DeveloperApiDocsProps = {
  baseUrl: string;
};

function CodeBlock({ code, label }: { code: string; label: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-inner">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          {label}
        </span>
        <CopyButton
          text={code}
          label="Copy"
          copiedLabel="Copied"
          className="rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-200 hover:bg-zinc-700"
        />
      </div>
      <pre className="max-h-[min(24rem,50vh)] overflow-auto p-3 text-[11px] leading-relaxed text-zinc-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

const QUICK_TEST_SUCCESS = `{
  "ok": true,
  "services": [
    {
      "id": "9b2f…",
      "name": "Website",
      "status": "operational",
      "is_published": true,
      "last_checked": "2026-04-07T10:15:00.000Z"
    }
  ]
}`;

export function DeveloperApiDocs({ baseUrl }: DeveloperApiDocsProps) {
  const quickTestCurl = `curl "${baseUrl}/api/public/status" \\
  -H "Authorization: Bearer YOUR_API_KEY"`;

  const curlStatus = `curl -sS "${baseUrl}/api/public/status" \\
  -H "Authorization: Bearer YOUR_API_KEY_HERE"`;

  const curlIncidentsGet = `curl -sS "${baseUrl}/api/public/incidents" \\
  -H "Authorization: Bearer YOUR_API_KEY_HERE"`;

  const curlIncidentsPost = `curl -sS -X POST "${baseUrl}/api/public/incidents" \\
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Brief title","affectedServiceId":"YOUR_SERVICE_ID","severity":"minor","status":"investigating"}'`;

  const jsStatus = `const r = await fetch("${baseUrl}/api/public/status", {
  headers: { Authorization: "Bearer YOUR_API_KEY_HERE" },
});
const data = await r.json();
if (!r.ok) console.error(data.error, data.code);
else console.log(data);`;

  const jsIncidents = `const r = await fetch("${baseUrl}/api/public/incidents", {
  headers: { Authorization: "Bearer YOUR_API_KEY_HERE" },
});
const data = await r.json();
if (!r.ok) console.error(data.error, data.code);
else console.log(data);`;

  const jsAiAssist = `// Uses your logged-in session (cookies)—not the API key.
const r = await fetch("${baseUrl}/api/ai/incident-assist", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    incidentId: "YOUR_INCIDENT_ID",
    action: "summarize", // or "draft_public_update"
  }),
});
const data = await r.json();
if (!r.ok) console.error(data.error, data.code);
else console.log(data.text);`;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 pb-12">
      <header className="space-y-3">
        <div className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[11px] font-semibold tracking-wide text-violet-800">
          STATSUPAL · Developer
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 md:text-3xl">
          {"API & AI guide"}
        </h1>
        <p className="text-sm leading-relaxed text-zinc-600">
          Connect scripts and tools to your workspace, and use optional AI for incident wording. Nothing
          here changes how monitoring runs. API keys only read or write data you allow.
        </p>
      </header>

      <section className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900">Quick test</h2>
        <p className="mt-3 text-sm text-zinc-600">
          Replace <code className="rounded bg-white/80 px-1 font-mono text-xs">YOUR_API_KEY</code> (needs{" "}
          <code className="rounded bg-white/80 px-1 text-xs">read:status</code>):
        </p>
        <div className="mt-3">
          <CodeBlock label="Terminal" code={quickTestCurl} />
        </div>
        <p className="mt-3 text-sm text-zinc-700">
          If this returns JSON, your API key works.
        </p>
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Example success</p>
        <pre className="mt-2 overflow-x-auto rounded-xl border border-emerald-200/80 bg-white p-3 text-[11px] leading-relaxed text-zinc-800">
          <code>{QUICK_TEST_SUCCESS}</code>
        </pre>
        <p className="mt-3 text-xs text-zinc-500">Takes about 5 seconds to test.</p>
      </section>

      <div className="space-y-3">
        <p className="text-sm">
          <Link
            href="/settings"
            className="font-medium text-violet-700 underline-offset-2 hover:underline"
          >
            ← Back to Settings
          </Link>
          <span className="mx-2 text-zinc-300">·</span>
          <Link
            href="/incidents"
            className="font-medium text-violet-700 underline-offset-2 hover:underline"
          >
            Incidents
          </Link>
        </p>
      </div>

      <section
        id="getting-started"
        className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-zinc-900">Getting started</h2>
        <p className="mt-2 text-sm text-zinc-600">
          You do not need to be a developer to use the basics—think of an API key as a password that
          lets a trusted tool see your status or open incidents on your behalf.
        </p>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm text-zinc-700">
          <li>
            Open <strong>Settings</strong> and scroll to <strong>Developer API</strong>.
          </li>
          <li>
            Give the key a name you will recognize (for example “Nightly script”), tick only the
            permissions you need, then create it. <strong>Copy the key immediately</strong>—we only
            show the full secret once.
          </li>
          <li>
            Paste the key into your tool as{" "}
            <code className="rounded bg-zinc-100 px-1 font-mono text-xs">Authorization: Bearer …</code>{" "}
            on the URLs below. If something fails, check the{" "}
            <a href="#errors" className="font-medium text-violet-700 hover:underline">
              common errors
            </a>{" "}
            section.
          </li>
        </ol>
      </section>

      <section
        id="api-keys"
        className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-zinc-900">Creating an API key</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Keys are created in the app (not via the API). Each key has <strong>scopes</strong> so you can
          limit what integrations can do.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-700">
          <li>
            <strong>Read</strong> scopes: fetch status, incidents, or uptime JSON.
          </li>
          <li>
            <strong>Write</strong> scopes: create incidents or maintenance (use carefully).
          </li>
        </ul>
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">All scopes</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {API_SCOPES.map((s) => (
            <code
              key={s}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-800"
            >
              {s}
            </code>
          ))}
        </div>
        <p className="mt-4 text-sm text-zinc-600">
          Manage keys anytime in{" "}
          <Link href="/settings" className="font-medium text-violet-700 hover:underline">
            Settings → Developer API
          </Link>
          .
        </p>
      </section>

      <section
        id="public-api"
        className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-zinc-900">Public HTTP API</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Base URL for your workspace: <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs">{baseUrl}</code>
          . Replace <code className="font-mono text-xs">YOUR_API_KEY_HERE</code> and{" "}
          <code className="font-mono text-xs">YOUR_SERVICE_ID</code> in the examples.
        </p>

        <div className="mt-8 space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              GET <code className="font-mono text-xs text-violet-700">/api/public/status</code>
            </h3>
            <p className="mt-1 text-xs text-zinc-500">Scope: read:status</p>
            <div className="mt-3 space-y-3">
              <CodeBlock label="curl" code={curlStatus} />
              <CodeBlock label="JavaScript (fetch)" code={jsStatus} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              GET <code className="font-mono text-xs text-violet-700">/api/public/incidents</code>
            </h3>
            <p className="mt-1 text-xs text-zinc-500">Scope: read:incidents</p>
            <div className="mt-3 space-y-3">
              <CodeBlock label="curl" code={curlIncidentsGet} />
              <CodeBlock label="JavaScript (fetch)" code={jsIncidents} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              POST <code className="font-mono text-xs text-violet-700">/api/public/incidents</code>
            </h3>
            <p className="mt-1 text-xs text-zinc-500">Scope: write:incidents · JSON body</p>
            <div className="mt-3">
              <CodeBlock label="curl" code={curlIncidentsPost} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900">
              GET <code className="font-mono text-xs text-violet-700">/api/public/uptime</code>
            </h3>
            <p className="mt-1 text-xs text-zinc-500">Scope: read:uptime</p>
            <div className="mt-3">
              <CodeBlock
                label="curl"
                code={`curl -sS "${baseUrl}/api/public/uptime" \\
  -H "Authorization: Bearer YOUR_API_KEY_HERE"`}
              />
            </div>
          </div>

          <p className="text-sm text-zinc-600">
            <strong>Maintenance windows:</strong>{" "}
            <code className="font-mono text-xs text-violet-700">POST /api/public/maintenance</code> with
            scope <code className="rounded bg-zinc-100 px-1 text-xs">write:maintenance</code> (JSON body:
            title, startsAt, endsAt, affectedServiceIds). Same Bearer auth as above.
          </p>
        </div>
      </section>

      <section
        id="restart-agent"
        className="scroll-mt-24 rounded-2xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-zinc-900">Server restart agent (your infrastructure)</h2>
        <p className="mt-2 text-sm text-zinc-700">
          Configure outbound webhooks under <strong>Settings → Automations</strong>. Statsupal sends JSON{" "}
          POSTs only—it never runs SSH, Docker, or PM2 on your machines. To auto-restart after a{" "}
          <code className="rounded bg-white/80 px-1 text-xs">service_down</code> event, run a tiny HTTP
          listener on your server that verifies <code className="rounded bg-white/80 px-1 text-xs">x-statsupal-signature</code>{" "}
          and then executes your restart command locally.
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Use the same shared secret in Statsupal and in your agent. Signature = hex(HMAC-SHA256(raw body,
          secret)). Add a local cooldown so overlapping webhooks do not restart in a tight loop.
        </p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-amber-900/80">Example (Node.js + Express)</p>
        <div className="mt-2">
          <CodeBlock
            label="restart-agent.example.cjs"
            code={`// Run on YOUR server only. Set STATSUPAL_WEBHOOK_SECRET to match Automations secret.
const crypto = require("crypto");
const express = require("express");
const { exec } = require("child_process");

const SECRET = process.env.STATSUPAL_WEBHOOK_SECRET || "";
const PORT = process.env.PORT || 8787;
let lastRestart = 0;
const COOLDOWN_MS = 5 * 60 * 1000;

function verifySig(rawBody, sigHeader) {
  if (!SECRET || !sigHeader) return false;
  const h = crypto.createHmac("sha256", SECRET).update(rawBody, "utf8").digest("hex");
  try {
    const a = Buffer.from(h, "utf8");
    const b = Buffer.from(String(sigHeader).trim(), "utf8");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch { return false; }
}

const app = express();
app.use(express.raw({ type: "application/json" }));

app.post("/statsupal-webhook", (req, res) => {
  const raw = req.body instanceof Buffer ? req.body.toString("utf8") : String(req.body || "");
  const sig = req.headers["x-statsupal-signature"];
  if (!verifySig(raw, sig)) return res.status(401).send("bad signature");
  let body;
  try { body = JSON.parse(raw); } catch { return res.status(400).send("bad json"); }
  if (body.event !== "service_down") return res.status(200).send("ignored");

  const now = Date.now();
  if (now - lastRestart < COOLDOWN_MS) return res.status(200).send("cooldown");
  lastRestart = now;

  // Pick ONE: pm2, docker, systemd, etc. — runs on this machine only.
  exec("pm2 restart all", (err) => { if (err) console.error(err); });
  // exec("docker restart my_container", ...);

  res.status(200).send("ok");
});

app.listen(PORT, () => console.log("restart agent on", PORT));`}
          />
        </div>
        <p className="mt-3 text-xs text-zinc-600">
          Expose <code className="rounded bg-white px-1">https://your-host/statsupal-webhook</code> (TLS
          recommended) and paste that URL into an automation rule with trigger{" "}
          <strong>Service goes down</strong>.
        </p>
      </section>

      <section
        id="ai-assistant"
        className="scroll-mt-24 rounded-2xl border border-violet-100 bg-violet-50/40 p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-zinc-900">AI incident assistant</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-700">
          AI helps with <strong>wording only</strong> (summaries, draft status posts). It does{" "}
          <strong>not</strong> change whether a service is up or down and does not fix external sites.
          Your host must set server-side environment variables—see{" "}
          <Link href="/settings" className="font-medium text-violet-800 hover:underline">
            Settings → AI assistant
          </Link>
          .
        </p>
        <p className="mt-3 text-sm text-zinc-700">
          In the dashboard, open <strong>Incidents</strong> and use{" "}
          <strong>Generate summary</strong> or <strong>Draft status update</strong> on a card.
        </p>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-violet-800/80">
          Programmatic use (browser session)
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          This route expects you to be signed in (cookies)—not the Developer API key.
        </p>
        <div className="mt-3">
          <CodeBlock label="JavaScript (fetch, same origin)" code={jsAiAssist} />
        </div>
      </section>

      <section
        id="errors"
        className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-zinc-900">Common API errors</h2>
        <p className="mt-2 text-sm text-zinc-600">
          JSON responses include an <code className="rounded bg-zinc-100 px-1 text-xs">error</code> message
          and a <code className="rounded bg-zinc-100 px-1 text-xs">code</code> your automation can branch on.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200">
          <table className="w-full min-w-[20rem] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">What it means</th>
                <th className="px-3 py-2">What to do</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              <tr>
                <td className="px-3 py-2 font-mono text-xs">auth_required</td>
                <td className="px-3 py-2">No Bearer token (or it is empty).</td>
                <td className="px-3 py-2">Add Authorization: Bearer stu_live_…</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">invalid_api_key</td>
                <td className="px-3 py-2">Wrong format, revoked, or unknown key.</td>
                <td className="px-3 py-2">Create or copy a fresh key in Settings.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">insufficient_scope</td>
                <td className="px-3 py-2">Key is valid but missing a permission.</td>
                <td className="px-3 py-2">
                  Check <code className="text-xs">required_scope</code> in the response; enable that scope on a new key.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">rate_limited</td>
                <td className="px-3 py-2">Too many requests in a short window.</td>
                <td className="px-3 py-2">
                  Wait; use <code className="text-xs">retry_after_seconds</code> or the Retry-After header.
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">ai_not_configured</td>
                <td className="px-3 py-2">Server has no AI API key / provider.</td>
                <td className="px-3 py-2">Set STATSUPAL_AI_* env vars on the server.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-xs">ai_error</td>
                <td className="px-3 py-2">AI provider failed or bad request.</td>
                <td className="px-3 py-2">Retry later; check server logs if it persists.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
