import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Heading,
  HStack,
  IconButton,
  VStack
} from "@carbon/react";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import {
  LuPencil,
  LuPlus,
  LuToggleLeft,
  LuToggleRight,
  LuTrash2
} from "react-icons/lu";
import type { ComputedField } from "~/modules/settings/types";
import type { FieldDefinition } from "~/utils/field-registry";
import { FieldEditor } from "./FieldEditor";
import { formulaSummary } from "./helpers";

type Props = {
  computedFields: ComputedField[];
  setComputedFields: Dispatch<SetStateAction<ComputedField[]>>;
  availableFields: FieldDefinition[];
};

export default function ComputedFieldsTab({
  computedFields,
  setComputedFields,
  availableFields
}: Props) {
  const [editing, setEditing] = useState<ComputedField | null | "new">(null);

  const labelMap = Object.fromEntries(
    availableFields.map((f) => [f.key, f.label])
  );

  function handleSave(field: ComputedField) {
    if (editing === "new") {
      setComputedFields((prev) => [...prev, field]);
    } else {
      setComputedFields((prev) =>
        prev.map((cf) => (cf.id === field.id ? field : cf))
      );
    }
    setEditing(null);
  }

  function handleDelete(id: string) {
    setComputedFields((prev) => prev.filter((cf) => cf.id !== id));
  }

  function handleToggle(id: string) {
    setComputedFields((prev) =>
      prev.map((cf) => (cf.id === id ? { ...cf, enabled: !cf.enabled } : cf))
    );
  }

  if (editing !== null) {
    return (
      <FieldEditor
        initial={editing === "new" ? null : editing}
        availableFields={availableFields}
        existingComputed={computedFields}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <VStack spacing={3} className="pt-2">
      <HStack className="w-full">
        <Button
          className="ml-auto"
          type="button"
          onClick={() => setEditing("new")}
          leftIcon={<LuPlus size={14} />}
        >
          Add New Field
        </Button>
      </HStack>

      {computedFields?.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-6">
          No computed fields yet.
          <br />
          Add one to create virtual columns derived from your data.
        </p>
      )}

      <div className="flex flex-col gap-2 w-full">
        {computedFields?.map((field) => (
          <Card
            key={field.id}
            className={cn("mt-2", !field.enabled && "opacity-50")}
          >
            <HStack className="justify-between mb-0.5">
              <CardHeader>
                <CardTitle>
                  <Heading size={"h4"}>{field.name}</Heading>
                </CardTitle>
              </CardHeader>
              <CardAction>
                <HStack className="gap-0.5">
                  <IconButton
                    aria-label={field.enabled ? "Disable" : "Enable"}
                    icon={field.enabled ? <LuToggleRight /> : <LuToggleLeft />}
                    variant="ghost"
                    onClick={() => handleToggle(field.id)}
                  />
                  <IconButton
                    aria-label="Edit"
                    icon={<LuPencil />}
                    variant="ghost"
                    onClick={() => setEditing(field)}
                  />
                  <IconButton
                    aria-label="Delete"
                    icon={<LuTrash2 />}
                    variant="ghost"
                    onClick={() => handleDelete(field.id)}
                  />
                </HStack>
              </CardAction>
            </HStack>
            <CardContent>
              <p className="text-muted-foreground truncate">
                {formulaSummary(field, labelMap)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </VStack>
  );
}
