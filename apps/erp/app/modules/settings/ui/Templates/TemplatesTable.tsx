import { Badge, HStack, MenuIcon, MenuItem, SplitButton } from "@carbon/react";
import type { ColumnDef } from "@tanstack/react-table";
import { memo, useCallback, useMemo } from "react";
import {
  LuGauge,
  LuKey,
  LuPencil,
  LuPlus,
  LuShield,
  LuTag,
  LuTrash,
  LuUser
} from "react-icons/lu";
import { Outlet, useNavigate } from "react-router";
import { EmployeeAvatar, Hyperlink, Table } from "~/components";
import { usePermissions, useUrlParams } from "~/hooks";
import type { ApiKey } from "~/modules/settings";
import { usePeople } from "~/stores";
import { path } from "~/utils/path";

type ApiKeysTableProps = {
  data: ApiKey[];
  count: number;
};

function getScopeCount(scopes: Record<string, string[]> | null): number {
  if (!scopes) return 0;
  return Object.keys(scopes).length;
}

function formatRateLimit(limit: number, window: string): string {
  const windowLabels: Record<string, string> = {
    "1m": "/min",
    "1h": "/hr",
    "1d": "/day"
  };
  return `${limit}${windowLabels[window] ?? "/hr"}`;
}

const TemplatesTable = memo(({ data, count }: ApiKeysTableProps) => {
  const navigate = useNavigate();
  const [params] = useUrlParams();
  const permissions = usePermissions();
  const [people] = usePeople();

  const columns = useMemo<ColumnDef<ApiKey>[]>(() => {
    return [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <Hyperlink to={row.original.id!}>{row.original.name}</Hyperlink>
        ),
        meta: {
          icon: <LuTag />
        }
      },
      {
        id: "Category",
        header: "Category",
        cell: ({ row }) => {
          const preview = (row.original as any).keyPreview as string | null;
          return (
            <span className="font-mono text-sm text-muted-foreground">
              {preview ? `crbn_•••${preview}` : "crbn_•••••"}
            </span>
          );
        },
        meta: {
          icon: <LuKey />
        }
      },
      {
        id: "Module",
        header: "Module",
        cell: ({ row }) => {
          const limit = (row.original as any).rateLimit as number;
          const window = (row.original as any).rateLimitWindow as string;
          return (
            <span className="text-sm text-muted-foreground">
              {formatRateLimit(limit ?? 60, window ?? "1m")}
            </span>
          );
        },
        meta: {
          icon: <LuGauge />
        }
      },
      {
        id: "Default",
        header: "Default",
        cell: ({ row }) => {
          const scopes = (row.original as any).scopes as Record<
            string,
            string[]
          > | null;
          const scopeCount = getScopeCount(scopes);
          return (
            <Badge variant="secondary">
              {scopeCount === 0 ? "No Access" : `${scopeCount} permissions`}
            </Badge>
          );
        },
        meta: {
          icon: <LuShield />
        }
      },
      {
        id: "createdBy",
        header: "Created By",
        cell: ({ row }) => {
          return <EmployeeAvatar employeeId={row.original.createdBy} />;
        },
        meta: {
          icon: <LuUser />,
          filter: {
            type: "static",
            options: people.map((employee) => ({
              value: employee.id,
              label: employee.name
            }))
          }
        }
      }
    ];
  }, [people]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: suppressed due to migration
  const renderContextMenu = useCallback(
    (row: (typeof data)[number]) => {
      return (
        <>
          <MenuItem
            onClick={() => {
              navigate(`${path.to.apiKey(row.id!)}?${params?.toString()}`);
            }}
          >
            <MenuIcon icon={<LuPencil />} />
            Edit template
          </MenuItem>
          <MenuItem
            destructive
            onClick={() => {
              navigate(
                `${path.to.deleteApiKey(row.id!)}?${params?.toString()}`
              );
            }}
          >
            <MenuIcon icon={<LuTrash />} />
            Delete template
          </MenuItem>
        </>
      );
    },

    [navigate, params, permissions]
  );

  return (
    <>
      <Table<ApiKey>
        data={data}
        columns={columns}
        count={count ?? 0}
        primaryAction={
          <HStack>
            {permissions.can("update", "users") && (
              <SplitButton
                leftIcon={<LuPlus />}
                // isLoading={
                //   statusFetcher.formAction ===
                //   path.to.purchaseOrderFinalize(orderId)
                // }
                variant="primary"
                // onClick={finalizeDisclosure.onOpen}
                // isDisabled={
                //   !["Draft", "Planned"].includes(
                //     routeData?.purchaseOrder?.status ?? ""
                //   ) ||
                //   routeData?.lines.length === 0 ||
                //   !isSupplierApproved
                // }
                dropdownItems={[
                  {
                    label: "Purchase Order",
                    // icon: <LuPlus />,
                    onClick: () => {
                      navigate(`${path.to.newTemplate}?module=purchase_orders`);
                    }
                    // disabled:
                    //   !["Draft"].includes(
                    //     routeData?.purchaseOrder?.status ?? ""
                    //   ) ||
                    //   routeData?.lines.length === 0 ||
                    //   !isSupplierApproved
                  }
                ]}
              >
                New Template
              </SplitButton>
            )}
          </HStack>
        }
        renderContextMenu={renderContextMenu}
        title="Templates"
      />
      <Outlet />
    </>
  );
});

TemplatesTable.displayName = "TemplatesTable";
export default TemplatesTable;
