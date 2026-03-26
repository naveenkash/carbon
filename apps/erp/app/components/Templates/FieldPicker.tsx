import { Checkbox, Heading, HStack, VStack } from "@carbon/react";
import {
  type FieldDefinition,
  getFieldsForModuleCategory
} from "~/utils/field-registry";

type Props = {
  module: string;
  category?: string | null;
  selectedFields: string[];
  onToggleField: (fieldKey: string) => void;
};

export default function FieldPicker({
  module,
  category,
  selectedFields,
  onToggleField
}: Props) {
  const fields = getFieldsForModuleCategory(module, category);
  const coreFields = fields.filter((f) => !f.group);

  const groups = fields
    .filter((f) => f.group)
    .reduce<Record<string, FieldDefinition[]>>((acc, field) => {
      const g = field.group!;
      if (!acc[g]) acc[g] = [];
      acc[g].push(field);
      return acc;
    }, {});

  const renderGroup = (title: string, groupFields: FieldDefinition[]) => (
    <div key={title}>
      <Heading size="h4" className="mb-2">
        {title}
      </Heading>
      <VStack className="space-y-2">
        {groupFields.map((field) => (
          <HStack key={field.key} onClick={() => onToggleField(field.key)}>
            <Checkbox checked={selectedFields.includes(field.key)} />
            <label htmlFor={field.key}>{field.label}</label>
          </HStack>
        ))}
      </VStack>
    </div>
  );

  if (fields.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-8 text-center">
        No fields defined for {module}
        {category ? ` › ${category}` : ""}.
      </p>
    );
  }

  return (
    <HStack className="items-start space-x-6">
      {coreFields.length > 0 && renderGroup("Core Fields", coreFields)}
      {Object.entries(groups).map(([groupName, groupFields]) =>
        renderGroup(groupName, groupFields)
      )}
    </HStack>
  );
}
