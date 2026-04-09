import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimitStore } from "@/lib/rate-limit/ip-rate-limit";

vi.mock("@/lib/supabase/admin", () => {
  const upsert = vi.fn(async () => ({ error: null }));
  const maybeSingle = vi.fn(async () => ({
    data: { id: "workspace-uuid-1" },
    error: null,
  }));
  return {
    createAdminClient: () => ({
      from(table: string) {
        if (table === "workspaces") {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle,
              }),
            }),
          };
        }
        if (table === "alert_subscribers") {
          return { upsert };
        }
        throw new Error(`unexpected table ${table}`);
      },
    }),
  };
});

import { POST } from "./route";

describe("POST /api/status/subscribe", () => {
  beforeEach(() => {
    resetRateLimitStore();
  });

  afterEach(() => {
    resetRateLimitStore();
    vi.clearAllMocks();
  });

  it("returns 400 when email invalid", async () => {
    const req = new Request("http://localhost/api/status/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectSlug: "demo", email: "not-an-email" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(false);
  });

  it("returns 200 when subscription saved", async () => {
    const req = new Request("http://localhost/api/status/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "203.0.113.10",
      },
      body: JSON.stringify({
        projectSlug: "main-status-page",
        email: "user@example.com",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);
  });

  it("returns 429 when rate limited", async () => {
    const makeReq = () =>
      new Request("http://localhost/api/status/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.99",
        },
        body: JSON.stringify({
          projectSlug: "main-status-page",
          email: "user@example.com",
        }),
      });

    for (let i = 0; i < 40; i += 1) {
      await POST(makeReq());
    }
    const blocked = await POST(makeReq());
    expect(blocked.status).toBe(429);
  });
});
