import { beforeEach, describe, expect, it, vi } from "vitest";

const requirePermissions = vi.fn();
const getCarbonServiceRole = vi.fn();

vi.mock("@carbon/auth/auth.server", () => ({ requirePermissions }));
vi.mock("@carbon/auth/client.server", () => ({ getCarbonServiceRole }));

function makeServiceRole(downloads: Record<string, ReturnType<typeof vi.fn>>) {
  return {
    storage: {
      from: vi.fn((bucket: string) => ({
        download: downloads[bucket],
        createSignedUrl: vi.fn(async () => ({
          data: null,
          error: { message: "not implemented in unit test" }
        }))
      }))
    }
  };
}

describe("MES /file/preview/:bucket/*", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when bucket != companyId", async () => {
    requirePermissions.mockResolvedValue({ companyId: "company-1" });

    const { loader } = await import("./$bucket.$.tsx");
    const res = await loader({
      request: new Request("http://localhost"),
      params: { bucket: "company-2", "*": "docs/a.pdf" }
    } as any);

    expect(res.status).toBe(403);
    expect(getCarbonServiceRole).not.toHaveBeenCalled();
  });

  it("downloads from the company bucket when present", async () => {
    requirePermissions.mockResolvedValue({ companyId: "company-1" });

    const companyDownload = vi.fn(async () => ({
      data: new Blob(["pdf"]),
      error: null
    }));
    const legacyDownload = vi.fn(async () => ({
      data: null,
      error: { message: "not found" }
    }));

    getCarbonServiceRole.mockReturnValue(
      makeServiceRole({ "company-1": companyDownload, private: legacyDownload })
    );

    const { loader } = await import("./$bucket.$.tsx");
    const res = await loader({
      request: new Request("http://localhost"),
      params: { bucket: "company-1", "*": "docs/a.pdf" }
    } as any);

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(companyDownload).toHaveBeenCalledWith("docs/a.pdf");
    expect(legacyDownload).not.toHaveBeenCalled();
  });

  it("falls back to legacy private bucket (companyId prefix) when needed", async () => {
    requirePermissions.mockResolvedValue({ companyId: "company-1" });

    const companyDownload = vi.fn(async () => ({
      data: null,
      error: { message: "not found" }
    }));
    const legacyDownload = vi.fn(async () => ({
      data: new Blob(["pdf"]),
      error: null
    }));

    getCarbonServiceRole.mockReturnValue(
      makeServiceRole({ "company-1": companyDownload, private: legacyDownload })
    );

    const { loader } = await import("./$bucket.$.tsx");
    const res = await loader({
      request: new Request("http://localhost"),
      params: { bucket: "company-1", "*": "docs/a.pdf" }
    } as any);

    expect(res.status).toBe(200);
    expect(legacyDownload).toHaveBeenCalledWith("company-1/docs/a.pdf");
  });

  it("retries once before failing", async () => {
    vi.useFakeTimers();
    requirePermissions.mockResolvedValue({ companyId: "company-1" });

    const companyDownload = vi
      .fn()
      .mockResolvedValueOnce({ data: null, error: { message: "nope" } })
      .mockResolvedValueOnce({ data: new Blob(["ok"]), error: null });

    const legacyDownload = vi.fn(async () => ({
      data: null,
      error: { message: "nope" }
    }));

    getCarbonServiceRole.mockReturnValue(
      makeServiceRole({ "company-1": companyDownload, private: legacyDownload })
    );

    const { loader } = await import("./$bucket.$.tsx");
    const p = loader({
      request: new Request("http://localhost"),
      params: { bucket: "company-1", "*": "docs/a.pdf" }
    } as any);

    await vi.advanceTimersByTimeAsync(1000);
    const res = await p;
    expect(res.status).toBe(200);
    expect(companyDownload).toHaveBeenCalledTimes(2);
  });
});
