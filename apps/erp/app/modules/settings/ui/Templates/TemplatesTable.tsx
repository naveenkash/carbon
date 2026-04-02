import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  HStack,
  MenuIcon,
  MenuItem,
  useDisclosure
} from "@carbon/react";
import type { ColumnDef } from "@tanstack/react-table";
import { memo, useCallback, useMemo, useState } from "react";
import {
  LuCheck,
  LuChevronDown,
  LuCopy,
  LuFileText,
  LuLayers,
  LuPencil,
  LuPlus,
  LuStar,
  LuTag,
  LuTrash
  // LuUser
} from "react-icons/lu";
import { Link, Outlet, useFetcher, useNavigate } from "react-router";
import { Hyperlink, Table } from "~/components";
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
    const moduleOptions = Object.keys(REGISTERED_TEMPLATES).map((m) => ({
      value: m,
      label: m
    }));

    const categoryOptions = Array.from(
      new Set(
        Object.values(REGISTERED_TEMPLATES)
          .flat()
          .map((r) => r.category)
          .filter(Boolean)
      )
    ).map((c) => ({ value: c as string, label: c as string }));

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
        meta: {
          icon: <LuLayers />,
          filter: {
            type: "static" as const,
            options: moduleOptions
          }
        }
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.category ?? "—"}
          </span>
        ),
        meta: {
          icon: <LuTag />,
          filter: {
            type: "static" as const,
            options: categoryOptions
          }
        }
      },
      {
        accessorKey: "isDefault",
        header: "Default",
        cell: ({ row }) =>
          row.original.isDefault ? (
            <Badge variant="secondary">Default</Badge>
          ) : null,
        meta: { icon: <LuStar /> }
      }
    ];
  }, [people]);

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
          disabled={row.isDefault ?? undefined}
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
    [navigate, params, fetcher, deleteTemplateModal]
  );

  const renderNewButton = useMemo(() => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            leftIcon={<LuPlus />}
            variant="primary"
            rightIcon={<LuChevronDown />}
          >
            New Template
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="min-w-[220px]">
          <DropdownMenuGroup>
            {Object.entries(REGISTERED_TEMPLATES).map(
              ([module, categories]) => (
                <DropdownMenuSub key={module}>
                  <DropdownMenuSubTrigger>{module}</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {categories.map(({ category }) => {
                      const qs = new URLSearchParams({ module });
                      if (category) qs.set("category", category);

                      return (
                        <DropdownMenuItem key={category} asChild>
                          <Link to={`${path.to.newTemplate}?${qs.toString()}`}>
                            {category ?? "General"}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              )
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }, []);

  return (
    <>
      <Table<Template>
        data={data}
        columns={columns}
        count={count}
        primaryAction={
          <HStack>
            {permissions.can("create", "settings") && renderNewButton}
          </HStack>
        }
        renderContextMenu={renderContextMenu}
        title="Templates"
        withSavedView
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
