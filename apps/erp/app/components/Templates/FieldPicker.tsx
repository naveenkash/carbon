import { Checkbox, Heading, HStack, VStack } from "@carbon/react";
import {
  type FieldDefinition,
  getFieldsForModule,
  type ModuleFields
} from "~/utils/export-fields";

type Props = {
  module: keyof ModuleFields;
  selectedFields: string[];
  onToggleField: (fieldKey: string) => void;
};

export default function FieldPicker({
  module,
  selectedFields,
  onToggleField
}: Props) {
  const fields = getFieldsForModule(module);

  const coreFields = fields.filter((f) => !f.is_nested);

  const nestedGroups = fields
    .filter((f) => f.is_nested && f.parent_entity)
    .reduce<Record<string, FieldDefinition[]>>((acc, field) => {
      const group = field.parent_entity!;
      if (!acc[group]) acc[group] = [];
      acc[group].push(field);
      return acc;
    }, {});

  const renderGroup = (title: string, groupFields: FieldDefinition[]) => (
    <div key={title}>
      <Heading size="h4" className="mb-2">
        {title}
      </Heading>
      <VStack className="space-y-2">
        {groupFields.map((field) => (
          <HStack
            key={field.field_key}
            onClick={() => onToggleField(field.field_key)}
          >
            <Checkbox checked={selectedFields.includes(field.field_key)} />
            <label htmlFor={field.field_key}>
              <VStack spacing={0}>
                <span>{field.display_name}</span>
              </VStack>
            </label>
          </HStack>
        ))}
      </VStack>
    </div>
  );

  return (
    <HStack className="items-start space-x-6">
      {fields.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">
          No fields defined for this module yet.
        </p>
      ) : (
        <>
          {renderGroup("Core Fields", coreFields)}
          {Object.entries(nestedGroups).map(([entity, groupFields]) =>
            renderGroup(
              `${entity.charAt(0).toUpperCase() + entity.slice(1)} Information`,
              groupFields
            )
          )}
        </>
      )}
    </HStack>
  );
}
