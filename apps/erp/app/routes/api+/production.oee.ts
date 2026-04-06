import { requirePermissions } from "@carbon/auth/auth.server";
import type { LoaderFunctionArgs } from "react-router";
import { makeDurations } from "~/utils/duration";

const HOURS_PER_WORKDAY = 8;
const DAY_MAP = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday"
] as const;

type ShiftRow = {
  locationId: string;
  startTime: string;
  endTime: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
};

type DispatchRow = {
  workCenterId: string | null;
  actualStartTime: string | null;
  actualEndTime: string | null;
  duration: number | null;
};

type EventRow = {
  jobOperationId: string;
  workCenterId: string | null;
  duration: number | null;
  startTime: string;
  endTime: string | null;
};

type JobOpRow = {
  id: string;
  workCenterId: string | null;
  machineTime: number;
  machineUnit: string;
  operationQuantity: number | null;
  quantityComplete: number | null;
  quantityScrapped: number | null;
  quantityReworked: number | null;
};

/**
 * Calculates total planned production minutes for a work center over a date range.
 *
 * Walks day-by-day through the range. For each day, checks which shifts are
 * active on that day-of-week and sums their (endTime - startTime) duration.
 *
 * Example: Mon-Fri shift 07:00–15:00 over 3 months ≈ 65 days × 480 min = 31,200 min (520 hrs)
 *
 * Fallback: if no shifts are linked to the work center's location, assumes
 * HOURS_PER_WORKDAY (8h) for every Mon–Fri day in the range.
 */
function calcPlannedMinutes(
  shifts: ShiftRow[],
  startDate: Date,
  endDate: Date
): number {
  if (shifts.length === 0) {
    // No shift calendar linked — use 8h/day Mon-Fri as a safe default
    let days = 0;
    const d = new Date(startDate);
    while (d <= endDate) {
      const dow = d.getUTCDay();
      if (dow >= 1 && dow <= 5) days++;
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return days * HOURS_PER_WORKDAY * 60;
  }

  let total = 0;
  const d = new Date(startDate);
  while (d <= endDate) {
    const day = DAY_MAP[d.getUTCDay()]; // e.g. "monday", "tuesday"
    for (const shift of shifts) {
      if (!shift[day]) continue; // shift doesn't run on this day-of-week
      // Parse "HH:MM:SS" time strings and convert to total minutes
      const [sh, sm] = shift.startTime.split(":").map(Number);
      const [eh, em] = shift.endTime.split(":").map(Number);
      total += eh * 60 + em - (sh * 60 + sm);
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return total;
}

/**
 * Calculates total downtime minutes from maintenance dispatches.
 *
 * Only dispatches with oeeImpact = 'Down' or 'Planned' are passed in (filtered
 * at the query level). These represent time the machine was unavailable.
 *
 * Prefers actual timestamps (actualStartTime/actualEndTime) for precision.
 * Falls back to the stored `duration` field if timestamps are missing.
 *
 * Example: a 2-hour breakdown → 120 downtime minutes → reduces Availability.
 */
function calcDowntimeMinutes(dispatches: DispatchRow[]): number {
  return dispatches.reduce((sum, d) => {
    if (d.actualStartTime && d.actualEndTime) {
      // Use real timestamps — most accurate
      return (
        sum +
        (new Date(d.actualEndTime).getTime() -
          new Date(d.actualStartTime).getTime()) /
          60000 // ms → minutes
      );
    }
    // Fallback: duration field (stored in minutes per MES convention)
    return sum + (d.duration ?? 0);
  }, 0);
}

/**
 * Calculates total actual machine time in seconds from production events.
 *
 * Only 'Machine' type events are passed in (filtered at the query level).
 * These are created by operators pressing Start/Stop Machine in MES.
 *
 * `productionEvent.duration` is stored in seconds (displayed as duration * 1000 ms
 * in the UI). Falls back to computing from timestamps if duration is null
 * (e.g. an event that is still running or was never properly closed).
 *
 * This is the denominator of the Performance calculation (run time).
 */
function calcActualMachineSeconds(events: EventRow[]): number {
  return events.reduce((sum, e) => {
    if (e.duration != null) return sum + e.duration; // stored in seconds
    // Fallback: derive from start/end timestamps
    if (e.endTime) {
      return (
        sum +
        (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 1000 // ms → seconds
      );
    }
    return sum; // still-running event with no endTime — skip
  }, 0);
}

/**
 * Calculates total ideal (target) machine time in seconds from job operations.
 *
 * Uses makeDurations() which converts jobOperation.machineTime × operationQuantity
 * into milliseconds, accounting for the machineUnit (Hours/Piece, Minutes/Piece, etc).
 *
 * Example: machineTime=0.5, machineUnit='Hours/Piece', operationQuantity=10
 *   → 0.5h × 10 pieces = 5h = 18,000 seconds of ideal machine time
 *
 * This is the numerator of the Performance calculation. Comparing ideal vs actual
 * shows whether the machine ran at its rated speed during the run time.
 */
function calcIdealMachineSeconds(ops: JobOpRow[]): number {
  return ops.reduce((sum, op) => {
    const { machineDuration } = makeDurations(op); // returns milliseconds
    return sum + machineDuration / 1000; // ms → seconds
  }, 0);
}

/**
 * Calculates quality rate as a percentage (0–100).
 *
 * Quality = Good Units / Total Units Produced
 *   where Good Units = quantityComplete
 *   and   Total Units = quantityComplete + quantityScrapped + quantityReworked
 *
 * Reworked parts count against quality because they required extra labour —
 * they were not good on the first pass.
 *
 * Example: 8 complete, 2 scrapped, 0 reworked → 8/10 = 80%
 *
 * Defaults to 100% when no quantity data exists (no production recorded yet).
 */
function calcQuality(ops: JobOpRow[]): number {
  const complete = ops.reduce((s, op) => s + (op.quantityComplete ?? 0), 0);
  const scrapped = ops.reduce((s, op) => s + (op.quantityScrapped ?? 0), 0);
  const reworked = ops.reduce((s, op) => s + (op.quantityReworked ?? 0), 0);
  const total = complete + scrapped + reworked;
  return total > 0 ? (complete / total) * 100 : 100; // default 100% if no data
}

/** Clamps a percentage to the 0–100 range. Prevents display values above 100%. */
function clamp(value: number): number {
  return Math.min(100, Math.max(0, value));
}

/**
 * Combines the three OEE factors into a single result object.
 *
 * OEE = Availability × Performance × Quality
 *
 * Availability = (Planned - Downtime) / Planned
 *   → What fraction of scheduled time was the machine actually available?
 *
 * Performance = Ideal Machine Time / Run Time
 *   → When running, did it produce at the rated (ideal) cycle time?
 *   → Run time = planned minutes - downtime (converted to seconds)
 *   → Ideal time = sum of (machineTime × quantity) per job operation
 *
 * Quality = Good Units / Total Units
 *   → Of everything produced, how much was good on the first pass?
 *
 * All three factors are expressed as percentages (0–100).
 * The final OEE is also 0–100 (e.g. 0.85 × 0.92 × 0.98 × 100 = 76.6%).
 *
 * World-class OEE is considered ≥ 85%.
 */
function calcOEE(
  plannedMinutes: number,
  downtimeMinutes: number,
  idealSeconds: number,
  actualSeconds: number,
  quality: number
): { availability: number; performance: number; quality: number; oee: number } {
  // Availability: how much of planned time was usable (not lost to downtime)
  const availability =
    plannedMinutes > 0
      ? clamp(((plannedMinutes - downtimeMinutes) / plannedMinutes) * 100)
      : 0;

  // Run time = planned time minus downtime, converted to seconds for comparison
  // with productionEvent.duration which is stored in seconds
  const runSeconds = (plannedMinutes - downtimeMinutes) * 60;

  // Performance: ideal cycle time vs actual run time
  // < 100% means the machine ran slower than its rated speed
  const performance =
    runSeconds > 0 ? clamp((idealSeconds / runSeconds) * 100) : 0;

  const q = clamp(quality);

  // OEE: multiply all three factors (convert from % to decimal, then back to %)
  const oee = (availability / 100) * (performance / 100) * (q / 100) * 100;

  return { availability, performance, quality: q, oee };
}

/** Returns "YYYY-MM-DD" (day) or "YYYY-MM" (month) bucket key for a date. */
function bucketKey(date: Date, useDay: boolean): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  if (!useDay) return `${y}-${m}`;
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    view: "production"
  });

  const url = new URL(request.url);
  const params = url.searchParams;
  const start = params.get("start");
  const end = params.get("end");
  const workCenterId = params.get("workCenterId"); // null = all

  if (!start || !end) {
    return {
      availability: 0,
      performance: 0,
      quality: 0,
      oee: 0,
      trend: [],
      perWorkCenter: []
    };
  }

  // Match the pattern used in sales API: append T23:59:59 so the end date is inclusive
  // of all events that happened during that day (e.g. 2026-04-05 11:19:00 would otherwise
  // be excluded by a bare "2026-04-05" which coerces to midnight 00:00:00).
  const endWithTime = end.includes("T") ? end : `${end}T23:59:59`;

  const startDate = new Date(start);
  const endDate = new Date(endWithTime);
  const daysBetween = (endDate.getTime() - startDate.getTime()) / 86400000;
  // < 60 days → day-level buckets; >= 60 days → month-level (matches sales dashboard pattern)
  const useDay = daysBetween < 60;

  // 1. Work centers
  let wcQuery = client
    .from("workCenter")
    .select("id, name, locationId")
    .eq("companyId", companyId)
    .eq("active", true);
  if (workCenterId) wcQuery = wcQuery.eq("id", workCenterId);
  const { data: rawWorkCenters } = await wcQuery;
  const workCenters = rawWorkCenters ?? [];

  const workCenterIds = workCenters.map((wc) => wc.id);
  const locationIds = [
    ...new Set(
      workCenters.map((wc) => wc.locationId).filter(Boolean) as string[]
    )
  ];
  // Build locationId → shifts map
  const { data: allShifts = [] } = await client
    .from("shift")
    .select(
      "locationId, startTime, endTime, monday, tuesday, wednesday, thursday, friday, saturday, sunday"
    )
    .eq("companyId", companyId)
    .eq("active", true)
    .in("locationId", locationIds.length > 0 ? locationIds : [""]);

  const shiftsByLocation = new Map<string, ShiftRow[]>();
  for (const shift of allShifts as ShiftRow[]) {
    if (!shiftsByLocation.has(shift.locationId)) {
      shiftsByLocation.set(shift.locationId, []);
    }
    shiftsByLocation.get(shift.locationId)!.push(shift);
  }

  // 2. Maintenance downtime (Down + Planned OEE impact)
  const { data: allDowntime = [] } = await client
    .from("maintenanceDispatch")
    .select("workCenterId, actualStartTime, actualEndTime, duration")
    .eq("companyId", companyId)
    .in("oeeImpact", ["Down", "Planned"])
    .in("workCenterId", workCenterIds)
    .gte("actualStartTime", start)
    .lte("actualStartTime", endWithTime);

  // 3. Machine production events
  const { data: allEvents = [] } = await client
    .from("productionEvent")
    .select("jobOperationId, workCenterId, duration, startTime, endTime")
    .eq("companyId", companyId)
    .eq("type", "Machine")
    .in("workCenterId", workCenterIds)
    .gte("startTime", start)
    .lte("startTime", endWithTime);

  // 4. Job operations for those events
  const jobOpIds = [
    ...new Set(
      (allEvents as EventRow[]).map((e) => e.jobOperationId).filter(Boolean)
    )
  ];

  const { data: allJobOps = [] } =
    jobOpIds.length > 0
      ? await client
          .from("jobOperation")
          .select(
            "id, workCenterId, machineTime, machineUnit, operationQuantity, quantityComplete, quantityScrapped, quantityReworked"
          )
          .in("id", jobOpIds)
      : { data: [] };

  // --- Aggregate: overall metrics ---

  let totalPlanned = 0;
  let totalDowntime = 0;

  for (const wc of workCenters) {
    const shifts = wc.locationId
      ? (shiftsByLocation.get(wc.locationId) ?? [])
      : [];
    totalPlanned += calcPlannedMinutes(shifts, startDate, endDate);
  }

  totalDowntime = calcDowntimeMinutes(allDowntime as DispatchRow[]);
  const totalActualSeconds = calcActualMachineSeconds(allEvents as EventRow[]);
  const totalIdealSeconds = calcIdealMachineSeconds(allJobOps as JobOpRow[]);
  const overallQuality = calcQuality(allJobOps as JobOpRow[]);

  const overall = calcOEE(
    totalPlanned,
    totalDowntime,
    totalIdealSeconds,
    totalActualSeconds,
    overallQuality
  );

  // --- Per-work-center breakdown ---

  const perWorkCenter = workCenters.map((wc) => {
    const shifts = wc.locationId
      ? (shiftsByLocation.get(wc.locationId) ?? [])
      : [];
    const planned = calcPlannedMinutes(shifts, startDate, endDate);

    const wcDowntime = calcDowntimeMinutes(
      (allDowntime as DispatchRow[]).filter((d) => d.workCenterId === wc.id)
    );
    const wcEvents = (allEvents as EventRow[]).filter(
      (e) => e.workCenterId === wc.id
    );
    const wcJobOpIds = new Set(wcEvents.map((e) => e.jobOperationId));
    const wcJobOps = (allJobOps as JobOpRow[]).filter((op) =>
      wcJobOpIds.has(op.id)
    );

    const actualSeconds = calcActualMachineSeconds(wcEvents);
    const idealSeconds = calcIdealMachineSeconds(wcJobOps);
    const quality = calcQuality(wcJobOps);
    console.log({ planned, wcDowntime, idealSeconds, actualSeconds, quality });

    const metrics = calcOEE(
      planned,
      wcDowntime,
      idealSeconds,
      actualSeconds,
      quality
    );

    return {
      id: wc.id,
      name: wc.name,
      plannedHours: Math.round(planned / 60),
      ...metrics
    };
  });

  // --- Trend data ---

  // Build all buckets in range
  const buckets = new Map<
    string,
    {
      planned: number;
      downtime: number;
      idealSeconds: number;
      actualSeconds: number;
      jobOpIds: Set<string>;
    }
  >();

  const fillBuckets = (startD: Date, endD: Date) => {
    const d = new Date(startD);
    while (d <= endD) {
      const key = bucketKey(d, useDay);
      if (!buckets.has(key)) {
        buckets.set(key, {
          planned: 0,
          downtime: 0,
          idealSeconds: 0,
          actualSeconds: 0,
          jobOpIds: new Set()
        });
      }
      d.setUTCDate(d.getUTCDate() + 1);
    }
  };
  fillBuckets(startDate, endDate);

  // Planned per bucket per work center
  for (const wc of workCenters) {
    const shifts = wc.locationId
      ? (shiftsByLocation.get(wc.locationId) ?? [])
      : [];
    const d = new Date(startDate);
    while (d <= endDate) {
      const key = bucketKey(d, useDay);
      const bucket = buckets.get(key);
      if (!bucket) {
        d.setUTCDate(d.getUTCDate() + 1);
        continue;
      }
      const day = DAY_MAP[d.getUTCDay()];
      if (shifts.length === 0) {
        // fallback: 8h if Mon-Fri
        if (d.getUTCDay() >= 1 && d.getUTCDay() <= 5) {
          bucket.planned += HOURS_PER_WORKDAY * 60;
        }
      } else {
        for (const shift of shifts) {
          if (!shift[day]) continue;
          const [sh, sm] = shift.startTime.split(":").map(Number);
          const [eh, em] = shift.endTime.split(":").map(Number);
          bucket.planned += eh * 60 + em - (sh * 60 + sm);
        }
      }
      d.setUTCDate(d.getUTCDate() + 1);
    }
  }

  // Downtime per bucket
  for (const d of allDowntime as DispatchRow[]) {
    if (!d.actualStartTime) continue;
    const key = bucketKey(new Date(d.actualStartTime), useDay);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.downtime += calcDowntimeMinutes([d]);
  }

  // Events per bucket
  for (const e of allEvents as EventRow[]) {
    const key = bucketKey(new Date(e.startTime), useDay);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.actualSeconds += calcActualMachineSeconds([e]);
    bucket.jobOpIds.add(e.jobOperationId);
  }

  // Build job ops per bucket, then compute metrics.
  // - No planned time AND no activity (pure weekend/holiday) → null so the chart
  //   connects smoothly across it instead of zigzagging to zero.
  // - No planned time BUT activity exists (e.g. machine ran on a Sunday) → show it;
  //   use actual seconds as planned so availability = 100% (unscheduled production).
  const trend = Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, bucket]) => {
      const hasActivity =
        bucket.actualSeconds > 0 ||
        bucket.downtime > 0 ||
        bucket.jobOpIds.size > 0;

      if (bucket.planned === 0 && !hasActivity) {
        return {
          period,
          availability: 0,
          performance: 0,
          quality: 0,
          oee: 0
        };
      }

      const bucketOps = (allJobOps as JobOpRow[]).filter((op) =>
        bucket.jobOpIds.has(op.id)
      );
      const idealSeconds = calcIdealMachineSeconds(bucketOps);
      const quality = calcQuality(bucketOps);
      // For unscheduled days, treat actual run time as planned so availability = 100%
      const plannedMinutes =
        bucket.planned > 0 ? bucket.planned : bucket.actualSeconds / 60;
      const metrics = calcOEE(
        plannedMinutes,
        bucket.downtime,
        idealSeconds,
        bucket.actualSeconds,
        quality
      );

      return { period, ...metrics };
    });

  return {
    ...overall,
    trend,
    perWorkCenter
  };
}
