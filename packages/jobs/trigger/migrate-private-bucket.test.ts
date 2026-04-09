import { describe, expect, it, vi } from "vitest";

vi.mock("@trigger.dev/sdk/v3", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
  },
  task: (config: any) => config,
}));

vi.mock("@carbon/auth/client.server", () => ({
  getCarbonServiceRole: vi.fn(),
}));

import { __testing } from "./migrate-private-bucket";

function createClient(stubs?: {
  list?: (prefix: string) => Promise<{ data: any[] | null; error?: any }>;
  exists?: (bucket: string, path: string) => Promise<{ data: boolean }>;
  copy?: (
    sourcePath: string,
    destPath: string,
    opts: any
  ) => Promise<{ error: any }>;
  remove?: (paths: string[]) => Promise<any>;
}) {
  const list = vi.fn(async (prefix: string) => {
    return stubs?.list ? await stubs.list(prefix) : { data: [] };
  });

  const exists = vi.fn(async (_destPath: string) => {
    return { data: false };
  });

  const copy = vi.fn(async (sourcePath: string, destPath: string, opts: any) => {
    return stubs?.copy ? await stubs.copy(sourcePath, destPath, opts) : { error: null };
  });

  const remove = vi.fn(async (paths: string[]) => {
    return stubs?.remove ? await stubs.remove(paths) : {};
  });

  const storage = {
    from: vi.fn((bucket: string) => {
      if (bucket === "private") {
        return {
          list,
          copy,
          remove,
        };
      }
      return {
        exists: (destPath: string) =>
          stubs?.exists ? stubs.exists(bucket, destPath) : exists(destPath),
      };
    }),
  };

  return { storage, __mocks: { list, exists, copy, remove } };
}

describe("migrate-private-bucket", () => {
  it("runWithConcurrency processes all items", async () => {
    const results = await __testing.runWithConcurrency(
      [1, 2, 3, 4, 5],
      2,
      async (n) => n * 2
    );

    expect(new Set(results)).toEqual(new Set([2, 4, 6, 8, 10]));
  });

  it("withRetry retries then succeeds", async () => {
    vi.useFakeTimers();
    let attempts = 0;

    const p = __testing.withRetry(async () => {
      attempts++;
      if (attempts < 3) throw new Error("boom");
      return "ok";
    });

    await vi.runAllTimersAsync();
    await expect(p).resolves.toBe("ok");
    expect(attempts).toBe(3);
  });

  it("withRetry fails after max retries", async () => {
    vi.useFakeTimers();
    let attempts = 0;

    const p = __testing.withRetry(async () => {
      attempts++;
      throw new Error("nope");
    });

    const expectation = expect(p).rejects.toThrow("nope");
    await vi.runAllTimersAsync();
    await expectation;
    expect(attempts).toBe(4);
  });

  it("migrateFile returns ok in dryRun without touching storage", async () => {
    const client = createClient();
    const result = await __testing.migrateFile(
      client as any,
      "company-1",
      "company-1/a.pdf",
      "a.pdf",
      true
    );
    expect(result).toBe("ok");
    expect(client.storage.from).not.toHaveBeenCalled();
  });

  it("migrateFile skips if destination exists", async () => {
    const client = createClient({
      exists: async () => ({ data: true }),
    });

    const result = await __testing.migrateFile(
      client as any,
      "company-1",
      "company-1/a.pdf",
      "a.pdf",
      false
    );

    expect(result).toBe("skip");
    expect(client.__mocks.copy).not.toHaveBeenCalled();
    expect(client.__mocks.remove).not.toHaveBeenCalled();
  });

  it("migrateFile fails if copy fails", async () => {
    const client = createClient({
      copy: async () => ({ error: { message: "copy failed" } }),
    });

    const result = await __testing.migrateFile(
      client as any,
      "company-1",
      "company-1/a.pdf",
      "a.pdf",
      false
    );

    expect(result).toBe("fail");
    expect(client.__mocks.remove).not.toHaveBeenCalled();
  });

  it("migrateFile copies to destination bucket then removes source", async () => {
    const client = createClient();

    const result = await __testing.migrateFile(
      client as any,
      "company-1",
      "company-1/a.pdf",
      "a.pdf",
      false
    );

    expect(result).toBe("ok");
    expect(client.__mocks.copy).toHaveBeenCalledWith("company-1/a.pdf", "a.pdf", {
      destinationBucket: "company-1",
    });
    expect(client.__mocks.remove).toHaveBeenCalledWith(["company-1/a.pdf"]);
  });

  it("processFileOrFolder recurses folders and counts migrated files (dryRun)", async () => {
    const companyId = "company-1";
    const filesByPrefix = new Map<string, any[]>();
    filesByPrefix.set(`${companyId}/root`, [
      { name: "file1.txt", metadata: { size: 1 } },
      { name: "sub", metadata: null },
    ]);
    filesByPrefix.set(`${companyId}/root/sub`, [{ name: "file2.txt", metadata: { size: 1 } }]);

    const client = createClient({
      list: async (prefix) => ({ data: filesByPrefix.get(prefix) ?? [] }),
    });

    const result = await __testing.processFileOrFolder(
      client as any,
      companyId,
      { name: "root", metadata: null },
      companyId,
      "",
      true
    );

    expect(result).toEqual({ migrated: 2, failed: 0, skipped: 0 });
  });

  it("migrateCompany skips when destination bucket is missing", async () => {
    const client = createClient();
    const result = await __testing.migrateCompany(
      client as any,
      "company-1",
      true,
      new Set()
    );
    expect(result).toEqual({ migrated: 0, failed: 0, skipped: 1 });
  });

  it("migrateCompany counts a failure if listing errors", async () => {
    const companyId = "company-1";
    const client = createClient({
      list: async (_prefix) => ({ data: null, error: { message: "list failed" } }),
    });

    const result = await __testing.migrateCompany(
      client as any,
      companyId,
      true,
      new Set([companyId])
    );

    expect(result).toEqual({ migrated: 0, failed: 1, skipped: 0 });
  });
});
