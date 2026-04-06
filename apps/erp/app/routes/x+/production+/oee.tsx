import { requirePermissions } from "@carbon/auth/auth.server";
import {
  Badge,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Combobox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuIcon,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  HStack,
  IconButton,
  Loading,
  Skeleton,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  VStack
} from "@carbon/react";
import type { ChartConfig } from "@carbon/react/Chart";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent
} from "@carbon/react/Chart";
import { today } from "@internationalized/date";
import type { DateRange } from "@react-types/datepicker";
import { useEffect, useMemo, useState } from "react";
import { CSVLink } from "react-csv";
import {
  LuChevronDown,
  LuClipboardList,
  LuEllipsisVertical,
  LuFile,
  LuGauge,
  LuShieldCheck,
  LuZap
} from "react-icons/lu";
import type { LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { DateSelect, Empty } from "~/components";
import type { loader as oeeLoader } from "~/routes/api+/production.oee";
import type { Handle } from "~/utils/handle";
import { path } from "~/utils/path";

export const handle: Handle = {
  breadcrumb: "OEE",
  to: path.to.oee
};

const OEE_KPIS = [
  { key: "oee", label: "OEE" },
  { key: "availability", label: "Availability" },
  { key: "performance", label: "Performance" },
  { key: "quality", label: "Quality" }
] as const;

type OEEKey = (typeof OEE_KPIS)[number]["key"];

const oeeChartConfig = {
  oee: { label: "OEE", color: "hsl(var(--chart-1))" },
  availability: { label: "Availability", color: "hsl(var(--chart-2))" },
  performance: { label: "Performance", color: "hsl(var(--chart-3))" },
  quality: { label: "Quality", color: "hsl(var(--chart-4))" }
} satisfies ChartConfig;

function formatPeriod(period: string): string {
  // Day: "2024-03-29" → "Mar 29"
  if (period.length === 10) {
    const [y, mo, d] = period.split("-").map(Number);
    return new Date(Date.UTC(y, mo - 1, d)).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  }
  // Month: "2024-03" → "Mar"
  if (period.length === 7) {
    const [y, mo] = period.split("-").map(Number);
    return new Date(y, mo - 1, 1).toLocaleDateString("en-US", {
      month: "short"
    });
  }
  return period;
}

function fmt(value: number): string {
  return `${value.toFixed(1)}%`;
}

function OEEBadge({ value }: { value: number }) {
  const color =
    value >= 85
      ? "text-success"
      : value >= 60
        ? "text-chart-5"
        : "text-destructive";
  return <span className={color}>{fmt(value)}</span>;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const { client, companyId } = await requirePermissions(request, {
    view: "production",
    role: "employee"
  });

  const { data: workCenters } = await client
    .from("workCenter")
    .select("id, name")
    .eq("companyId", companyId)
    .eq("active", true)
    .order("name");

  return { workCenters: workCenters ?? [] };
}

export default function OEEDashboard() {
  const { workCenters } = useLoaderData<typeof loader>();

  const [interval, setInterval] = useState("month");
  const [workCenterId, setWorkCenterId] = useState("all");
  const [selectedKpi, setSelectedKpi] = useState<OEEKey>("oee");
  const [dateRange, setDateRange] = useState<DateRange | null>(() => {
    const end = today("UTC");
    const start = end.add({ months: -1 });
    return { start, end };
  });

  const fetcher = useFetcher<typeof oeeLoader>();
  const isFetching = fetcher.state !== "idle" || !fetcher.data;

  const workCenterOptions = useMemo(
    () => [
      { label: "All Work Centers", value: "all" },
      ...workCenters.map((wc) => ({ label: wc.name, value: wc.id }))
    ],
    [workCenters]
  );

  const selectedKpiData =
    OEE_KPIS.find((k) => k.key === selectedKpi) ?? OEE_KPIS[0];

  // biome-ignore lint/correctness/useExhaustiveDependencies: don't include load function
  useEffect(() => {
    if (!dateRange?.start || !dateRange?.end) return;
    const params = new URLSearchParams({
      start: dateRange.start.toString(),
      end: dateRange.end.toString(),
      interval
    });
    if (workCenterId !== "all") params.set("workCenterId", workCenterId);
    fetcher.load(`${path.to.api.oee}?${params.toString()}`);
  }, [dateRange, interval, workCenterId]);

  const onIntervalChange = (value: string) => {
    const end = today("UTC");
    if (value === "week") {
      setDateRange({ start: end.add({ days: -7 }), end });
    } else if (value === "month") {
      setDateRange({ start: end.add({ months: -1 }), end });
    } else if (value === "quarter") {
      setDateRange({ start: end.add({ months: -3 }), end });
    } else if (value === "year") {
      setDateRange({ start: end.add({ years: -1 }), end });
    }
    setInterval(value);
  };

  const data = fetcher.data;
  const trend = data?.trend ?? [];
  const perWorkCenter = data?.perWorkCenter ?? [];

  const oee = data?.oee ?? 0;
  const availability = data?.availability ?? 0;
  const performance = data?.performance ?? 0;
  const quality = data?.quality ?? 0;

  const csvData = useMemo(() => {
    if (!trend.length) return [];
    return [
      ["Period", "OEE", "Availability", "Performance", "Quality"],
      ...trend.map((row) => [
        row.period,
        row.oee.toFixed(1),
        row.availability.toFixed(1),
        row.performance.toFixed(1),
        row.quality.toFixed(1)
      ])
    ];
  }, [trend]);

  const csvFilename = useMemo(() => {
    const start = dateRange?.start.toString();
    const end = dateRange?.end.toString();
    return `OEE_${start}_to_${end}.csv`;
  }, [dateRange]);
  return (
    <div className="flex flex-col gap-4 w-full p-4 h-[calc(100dvh-var(--header-height))] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-full scrollbar-thumb-muted-foreground">
      {/* KPI Cards */}
      <div className="grid w-full gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex-row gap-2">
            <LuGauge className="text-muted-foreground" />
            <CardTitle>OEE</CardTitle>
          </CardHeader>
          <CardContent>
            {isFetching ? (
              <Skeleton className="h-12 w-[80px]" />
            ) : (
              <h3 className="text-5xl font-medium tracking-tighter">
                <OEEBadge value={oee} />
              </h3>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Overall Equipment Effectiveness
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row gap-2">
            <LuShieldCheck className="text-muted-foreground" />
            <CardTitle>Availability</CardTitle>
          </CardHeader>
          <CardContent>
            {isFetching ? (
              <Skeleton className="h-12 w-[80px]" />
            ) : (
              <h3 className="text-5xl font-medium tracking-tighter">
                <OEEBadge value={availability} />
              </h3>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Uptime vs planned time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row gap-2">
            <LuZap className="text-muted-foreground" />
            <CardTitle>Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {isFetching ? (
              <Skeleton className="h-12 w-[80px]" />
            ) : (
              <h3 className="text-5xl font-medium tracking-tighter">
                <OEEBadge value={performance} />
              </h3>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Ideal vs actual machine time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row gap-2">
            <LuClipboardList className="text-muted-foreground" />
            <CardTitle>Quality</CardTitle>
          </CardHeader>
          <CardContent>
            {isFetching ? (
              <Skeleton className="h-12 w-[80px]" />
            ) : (
              <h3 className="text-5xl font-medium tracking-tighter">
                <OEEBadge value={quality} />
              </h3>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Good units / total units produced
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <HStack className="justify-between items-center">
          <CardHeader>
            <div className="flex w-full justify-start items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    {selectedKpiData.label}
                    <LuChevronDown className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start">
                  <DropdownMenuRadioGroup
                    value={selectedKpi}
                    onValueChange={(v) => setSelectedKpi(v as OEEKey)}
                  >
                    {OEE_KPIS.map((kpi) => (
                      <DropdownMenuRadioItem key={kpi.key} value={kpi.key}>
                        {kpi.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>

              <Combobox
                asButton
                value={workCenterId}
                onChange={setWorkCenterId}
                options={workCenterOptions}
                size="sm"
                className="font-medium text-sm min-w-[160px]"
              />
            </div>
          </CardHeader>
          <CardAction className="flex-row items-center gap-2">
            <DateSelect
              value={interval}
              onValueChange={onIntervalChange}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <IconButton
                  variant="secondary"
                  icon={<LuEllipsisVertical />}
                  aria-label="More"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <CSVLink
                    data={csvData}
                    filename={csvFilename}
                    className="flex flex-row items-center gap-2"
                  >
                    <DropdownMenuIcon icon={<LuFile />} />
                    Export CSV
                  </CSVLink>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        </HStack>
        <CardContent className="flex-col gap-4">
          <VStack className="pl-[3px]" spacing={0}>
            {isFetching ? (
              <div className="flex flex-col gap-0.5">
                <Skeleton className="h-8 w-[80px]" />
                <Skeleton className="h-4 w-[40px]" />
              </div>
            ) : (
              <>
                <p className="text-3xl font-medium tracking-tighter">
                  <OEEBadge value={data?.[selectedKpi] ?? 0} />
                </p>
                <Badge
                  variant={
                    (data?.[selectedKpi] ?? 0) >= 85
                      ? "green"
                      : (data?.[selectedKpi] ?? 0) >= 60
                        ? "yellow"
                        : "red"
                  }
                >
                  {(data?.[selectedKpi] ?? 0) >= 85
                    ? "World Class"
                    : (data?.[selectedKpi] ?? 0) >= 60
                      ? "Average"
                      : "Needs Improvement"}
                </Badge>
              </>
            )}
          </VStack>
          <Loading
            isLoading={isFetching}
            className="h-[30dvw] md:h-[23dvw] w-full"
          >
            {trend.length === 0 ? (
              <div className="flex items-center justify-center h-[30dvw] md:h-[23dvw] min-h-[280px]">
                <Empty />
              </div>
            ) : (
              <ChartContainer
                config={oeeChartConfig}
                className="aspect-auto h-[30dvw] md:h-[23dvw] w-full"
              >
                <LineChart accessibilityLayer data={trend}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={formatPeriod}
                    minTickGap={32}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={formatPeriod}
                        formatter={(value, name) =>
                          `${name} - ${fmt(value as number)}`
                        }
                      />
                    }
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line
                    dataKey="oee"
                    stroke="red"
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    dataKey="availability"
                    stroke="green"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    dataKey="performance"
                    stroke="yellow"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={false}
                    isAnimationActive={false}
                  />
                  <Line
                    dataKey="quality"
                    stroke="blue"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ChartContainer>
            )}
          </Loading>
        </CardContent>
      </Card>
      {!isFetching && perWorkCenter.length > 0 && workCenterId === "all" && (
        <Card>
          <CardHeader>
            <CardTitle>By Work Center</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <Thead>
                <Tr>
                  <Th>Work Center</Th>
                  <Th>Planned (hrs)</Th>
                  <Th>Availability</Th>
                  <Th>Performance</Th>
                  <Th>Quality</Th>
                  <Th>OEE</Th>
                </Tr>
              </Thead>
              <Tbody>
                {perWorkCenter.map((wc) => (
                  <Tr key={wc.id}>
                    <Td className="font-medium">{wc.name}</Td>
                    <Td>{wc.plannedHours}h</Td>
                    <Td>
                      <OEEBadge value={wc.availability} />
                    </Td>
                    <Td>
                      <OEEBadge value={wc.performance} />
                    </Td>
                    <Td>
                      <OEEBadge value={wc.quality} />
                    </Td>
                    <Td className="font-semibold">
                      <OEEBadge value={wc.oee} />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
