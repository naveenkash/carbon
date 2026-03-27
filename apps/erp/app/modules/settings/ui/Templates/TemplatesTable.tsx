import {
  Badge,
  HStack,
  MenuIcon,
  MenuItem,
  SplitButton,
  useDisclosure
} from "@carbon/react";
import type { ColumnDef } from "@tanstack/react-table";
import { memo, useCallback, useMemo, useState } from "react";
import {
  LuCheck,
  LuCopy,
  LuFileText,
  LuLayers,
  LuPencil,
  LuPlus,
  LuStar,
  LuTag,
  LuTrash,
  LuUser
} from "react-icons/lu";
import { Outlet, useFetcher, useNavigate } from "react-router";
import { EmployeeAvatar, Hyperlink, Table } from "~/components";
import { ConfirmDelete } from "~/components/Modals";
import { usePermissions, useUrlParams } from "~/hooks";
import type { Template } from "~/modules/settings";
import { usePeople } from "~/stores";
import { REGISTERED_TEMPLATES } from "~/utils/field-registry";
import { path } from "~/utils/path";

type TemplatesTableProps = {
  data: Template[];
  count: number;
};

const TemplatesTable = memo(({ data, count }: TemplatesTableProps) => {
  const navigate = useNavigate();
  const [params] = useUrlParams();
  const permissions = usePermissions();
  const [people] = usePeople();
  const fetcher = useFetcher();

  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const deleteTemplateModal = useDisclosure();

  const columns = useMemo<ColumnDef<Template>[]>(() => {
    return [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <Hyperlink to={path.to.template(row.original.id)}>
            {row.original.name}
          </Hyperlink>
        ),
        meta: { icon: <LuFileText /> }
      },
      {
        accessorKey: "module",
        header: "Module",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.module}</span>
        ),
        meta: { icon: <LuLayers /> }
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.category ?? "—"}
          </span>
        ),
        meta: { icon: <LuTag /> }
      },
      {
        accessorKey: "isDefault",
        header: "Default",
        cell: ({ row }) =>
          row.original.isDefault ? (
            <Badge variant="secondary">Default</Badge>
          ) : null,
        meta: { icon: <LuStar /> }
      },
      {
        id: "createdBy",
        header: "Created By",
        cell: ({ row }) => (
          <EmployeeAvatar employeeId={row.original.createdBy} />
        ),
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
    (row: Template) => (
      <>
        <MenuItem
          onClick={() =>
            navigate(`${path.to.template(row.id!)}?${params?.toString()}`)
          }
        >
          <MenuIcon icon={<LuPencil />} />
          Edit template
        </MenuItem>
        <MenuItem
          onClick={() =>
            fetcher.submit(
              {},
              { method: "post", action: path.to.duplicateTemplate(row.id!) }
            )
          }
        >
          <MenuIcon icon={<LuCopy />} />
          Duplicate template
        </MenuItem>
        <MenuItem
          disabled={row.isDefault}
          onClick={() => {
            console.log(row.id);
            fetcher.submit(
              {},
              { method: "post", action: path.to.setDefaultTemplate(row.id!) }
            );
          }}
        >
          <MenuIcon icon={<LuCheck />} />
          {row.isDefault ? "Default" : "Set as default"}
        </MenuItem>
        <MenuItem
          destructive
          onClick={() => {
            setSelectedTemplate(row);
            deleteTemplateModal.onOpen();
          }}
        >
          <MenuIcon icon={<LuTrash />} />
          Delete template
        </MenuItem>
      </>
    ),
    [navigate, params, permissions, fetcher, deleteTemplateModal]
  );

  return (
    <>
      <Table<Template>
        data={data}
        columns={columns}
        count={count}
        primaryAction={
          <HStack>
            {permissions.can("create", "settings") && (
              <SplitButton
                leftIcon={<LuPlus />}
                variant="primary"
                dropdownItems={REGISTERED_TEMPLATES.map(
                  ({ module, category, label }) => ({
                    label,
                    onClick: () => {
                      const qs = new URLSearchParams({ module });
                      if (category) qs.set("category", category);
                      navigate(`${path.to.newTemplate}?${qs.toString()}`);
                    }
                  })
                )}
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
      {selectedTemplate && selectedTemplate.id && (
        <ConfirmDelete
          action={path.to.deleteTemplate(selectedTemplate.id)}
          isOpen={deleteTemplateModal.isOpen}
          name={selectedTemplate.name}
          text={`Are you sure you want to permanently delete ${selectedTemplate.name}?`}
          onCancel={() => {
            deleteTemplateModal.onClose();
            setSelectedTemplate(null);
          }}
          onSubmit={() => {
            deleteTemplateModal.onClose();
            setSelectedTemplate(null);
          }}
        />
      )}
    </>
  );
});

TemplatesTable.displayName = "TemplatesTable";
export default TemplatesTable;
