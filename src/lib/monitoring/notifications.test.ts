import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { notifyIncidentEvent } from "@/lib/monitoring/notifications";

describe("notifyIncidentEvent", () => {
  const baseWorkspace = {
    workspaceName: "Acme",
    incidentAlertsEnabled: true,
    incidentEmailAlertsEnabled: false,
    maintenanceEmailAlertsEnabled: false,
    discordWebhookUrl: "https://discord.com/api/webhooks/abc/def",
  };

  const baseService = { id: "svc1", name: "API", url: "https://api.example" };
  const baseIncident = {
    id: "inc1",
    title: "Outage",
    status: "investigating" as const,
    severity: "major" as const,
  };

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input.toString();
        if (url.includes("discord.com/api/v10/channels")) {
          return new Response("{}", { status: 200 });
        }
        if (url.includes("discord.com/api/webhooks")) {
          return new Response("{}", { status: 204 });
        }
        return new Response("{}", { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("skips all channels when incident alerts disabled", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    await notifyIncidentEvent({
      event: "created",
      service: baseService,
      incident: baseIncident,
      workspace: {
        ...baseWorkspace,
        incidentAlertsEnabled: false,
        discordBotToken: "bot",
        discordBotChannelId: "chan",
      },
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends Discord bot message when token and channel configured", async () => {
    const fetchMock = fetch as ReturnType<typeof vi.fn>;
    await notifyIncidentEvent({
      event: "created",
      service: baseService,
      incident: baseIncident,
      workspace: {
        ...baseWorkspace,
        discordBotToken: "bot-token",
        discordBotChannelId: "channel-id",
      },
    });
    const calls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(calls.some((u) => u.includes("/channels/channel-id/messages"))).toBe(true);
    expect(calls.some((u) => u.includes("/webhooks/"))).toBe(false);
  });

  it("falls back to webhook when bot fails", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/channels/")) {
        return new Response("nope", { status: 403 });
      }
      if (url.includes("/webhooks/")) {
        return new Response(null, { status: 204 });
      }
      return new Response("{}", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await notifyIncidentEvent({
      event: "created",
      service: baseService,
      incident: baseIncident,
      workspace: {
        ...baseWorkspace,
        discordBotToken: "bot-token",
        discordBotChannelId: "channel-id",
      },
    });

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.some((u) => u.includes("/channels/"))).toBe(true);
    expect(urls.some((u) => u.includes("/webhooks/"))).toBe(true);
  });
});
