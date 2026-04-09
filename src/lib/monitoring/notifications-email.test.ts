import { beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = {
      send: (...args: unknown[]) => sendMock(...args),
    };
  },
}));

import { sendIncidentEmail } from "@/lib/monitoring/notifications";

describe("sendIncidentEmail (Resend)", () => {
  beforeEach(() => {
    sendMock.mockReset();
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_FROM_EMAIL = "alerts@example.com";
  });

  it("throws and does not swallow provider errors", async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { message: "Invalid domain", statusCode: 403 },
    });
    await expect(
      sendIncidentEmail({
        to: "a@b.com",
        subject: "S",
        title: "T",
        description: "D",
        status: "DOWN",
        serviceName: "API",
      }),
    ).rejects.toThrow(/Invalid domain/);
  });

  it("completes when Resend accepts the message", async () => {
    sendMock.mockResolvedValue({ data: { id: "email_1" }, error: null });
    await sendIncidentEmail({
      to: "a@b.com",
      subject: "S",
      title: "T",
      description: "D",
      status: "RESOLVED",
      serviceName: "API",
    });
    expect(sendMock).toHaveBeenCalledTimes(1);
  });
});
