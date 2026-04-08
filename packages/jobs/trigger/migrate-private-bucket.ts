import { getCarbonServiceRole } from "@carbon/auth/client.server";
import { logger, task } from "@trigger.dev/sdk/v3";

const PAGE_SIZE = 100;
const CONCURRENCY = 10;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

export const migratePrivateBucket = task({
  id: "migrate-private-bucket",
  maxDuration: 3600,
  retry: { maxAttempts: 1 },

  run: async (payload: { dryRun?: boolean; companyId?: string }) => {
    const { dryRun = true, companyId: targetCompanyId } = payload;
    const client = getCarbonServiceRole();

    logger.info("Starting migration", { dryRun, targetCompanyId });

    const { data: companies,error: companyError } = await client
      .from("company")
      .select("id")
      .order("id");

      if (companyError) throw new Error(`Failed to list companies: ${companyError.message}`);

    if (!companies?.length) {
      logger.info("No companies found");
      return { migrated: 0, failed: 0, skipped: 0 }
      }

    const companiesToMigrate = targetCompanyId
      ? companies.filter((c) => c.id === targetCompanyId)
      : companies;

    if (targetCompanyId && companiesToMigrate.length === 0) {
      logger.warn(`targetCompanyId "${targetCompanyId}" not found`);
      return { migrated: 0, failed: 0, skipped: 0 };
    }

    const { data: buckets } = await client.storage.listBuckets();
    const bucketSet = new Set(buckets?.map((b) => b.id));

    let total = { migrated: 0, failed: 0, skipped: 0 };

    for (const company of companiesToMigrate) {
      const result = await migrateCompany(client, company.id, dryRun, bucketSet);
      total.migrated += result.migrated;
      total.failed += result.failed;
      total.skipped += result.skipped;

      logger.info(`Company ${company.id} complete`, result);
    }

    return total;
  },
});

async function migrateCompany(
  client: Awaited<ReturnType<typeof getCarbonServiceRole>>,
  companyId: string,
  dryRun: boolean,
  bucketSet: Set<string>
) {
  if (!bucketSet.has(companyId)) {
    logger.warn(`Bucket ${companyId} missing`);
    return { migrated: 0, failed: 0, skipped: 1 };
  }

  let migrated = 0;
  let failed = 0;
  let skipped = 0;
  let offset = 0;

  while (true) {
    const { data: files, error } = await client.storage
      .from("private")
      .list(companyId, { limit: PAGE_SIZE, offset });

    if (error) {
      logger.error("List failed", { companyId, offset, error });
      failed++;
      break;
    }

    if (!files?.length) break;

    // Process page in parallel with concurrency control
    const results = await runWithConcurrency(files, CONCURRENCY, async (file) => {
      return processFileOrFolder(client, companyId, file, companyId, "", dryRun);
    });

    for (const res of results) {
      migrated += res.migrated;
      failed += res.failed;
      skipped += res.skipped;
    }

    logger.info(`Progress ${companyId}`, {
      offset,
      processed: offset + files.length,
    });

    if (files.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return { migrated, failed, skipped };
}

/**
 * Concurrency controller (like p-limit but inline)
 */
async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  let i = 0;

  async function worker() {
    while (i < items.length) {
      const current = items[i++];
      results.push(await fn(current));
    }
  }

  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

/**
 * Retry with exponential backoff
 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= MAX_RETRIES) throw err;

      const delay = BASE_DELAY_MS * 2 ** attempt;
      logger.warn(`Retrying in ${delay}ms`, { attempt });

      await new Promise((r) => setTimeout(r, delay));
      attempt++;
    }
  }
}

async function processFileOrFolder(
  client: Awaited<ReturnType<typeof getCarbonServiceRole>>,
  companyId: string,
  file: any,
  fullPrefix: string,
  destPrefix: string,
  dryRun: boolean
): Promise<{ migrated: number; failed: number; skipped: number }> {
  let migrated = 0;
  let failed = 0;
  let skipped = 0;

  // Folder
  if (file.metadata === null) {
    const nextPrefix = `${fullPrefix}/${file.name}`;
    const nextDest = destPrefix ? `${destPrefix}/${file.name}` : file.name;

    const { data: subFiles } = await client.storage
      .from("private")
      .list(nextPrefix, { limit: PAGE_SIZE });

    if (!subFiles) return { migrated, failed: failed + 1, skipped };

    const results = await runWithConcurrency(subFiles, CONCURRENCY, async (sub) =>
      processFileOrFolder(client, companyId, sub, nextPrefix, nextDest, dryRun)
    );

    for (const r of results) {
      migrated += r.migrated;
      failed += r.failed;
      skipped += r.skipped;
    }

    return { migrated, failed, skipped };
  }

  // File
  const sourcePath = `${fullPrefix}/${file.name}`;
  const destPath = destPrefix ? `${destPrefix}/${file.name}` : file.name;

  const result = await withRetry(() =>
    migrateFile(client, companyId, sourcePath, destPath, dryRun)
  );

  if (result === "ok") migrated++;
  else if (result === "skip") skipped++;
  else failed++;

  return { migrated, failed, skipped };
}

async function migrateFile(
  client: Awaited<ReturnType<typeof getCarbonServiceRole>>,
  companyId: string,
  sourcePath: string,
  destPath: string,
  dryRun: boolean
): Promise<"ok" | "skip" | "fail"> {
  logger.log(`[${dryRun ? "DRY RUN" : "MIGRATE"}] ${sourcePath} → ${destPath}`);

  if (dryRun) return "ok";

  const { data: exists } = await client.storage.from(companyId).exists(destPath);
  if (exists) return "skip";

  const { error: copyError } = await client.storage
    .from("private")
    .copy(sourcePath, destPath, { destinationBucket: companyId });

  if (copyError) return "fail";

  await client.storage.from("private").remove([sourcePath]);

  return "ok";
}