import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  NumberInput,
  Tabs,
  TabsList,
  TabsTrigger,
  VStack
} from "@carbon/react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import Select from "~/components/Select";
import { computedFieldEditorSchema } from "~/modules/settings/settings.models";
import {
  COMPUTED_KEY_PREFIX,
  type ComputedField,
  type FormulaConfig,
  FormulaType,
  type OutputFormat,
  OutputFormatType
} from "~/modules/settings/types";
import type { FieldDefinition } from "~/utils/field-registry";
import { ArithmeticForm } from "./ArithmeticForm";
import { ConcatForm } from "./ConcatForm";
import { ConditionalForm } from "./ConditionalForm";
import { FORMULA_TYPES, OUTPUT_TYPES } from "./constants";
import { DateDiffForm } from "./DateDiffForm";
import { defaultConfig, defaultOutput } from "./helpers";

type Props = {
  initial: ComputedField | null;
  availableFields: FieldDefinition[];
  existingComputed: ComputedField[];
  onSave: (field: ComputedField) => void;
  onCancel: () => void;
};

export function FieldEditor({
  initial,
  availableFields,
  existingComputed,
  onSave,
  onCancel
}: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [config, setConfig] = useState<FormulaConfig>(
    initial?.config ?? defaultConfig(FormulaType.DateDiff)
  );
  const [outputFormat, setOutputFormat] = useState<OutputFormat>(
    initial?.outputFormat ?? defaultOutput(config.type)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dateFields = availableFields
    .filter((f) => f.type === "date")
    .map((f) => ({ value: f.key, label: f.label }));

  const numericFields = availableFields
    .filter((f) => f.type === "number" || f.type === "currency")
    .map((f) => ({ value: f.key, label: f.label }));

  const allFieldOptions = availableFields.map((f) => ({
    value: f.key,
    label: f.label
  }));

  const computedOptions = existingComputed
    ?.filter((cf) => cf.id !== initial?.id)
    .map((cf) => ({ value: cf.id, label: `ƒ ${cf.name}` }));

  function handleTypeChange(type: FormulaConfig["type"]) {
    const newConfig = defaultConfig(type);
    setConfig(newConfig);
    setOutputFormat(defaultOutput(type));
    setErrors({});
  }

  function handleSave() {
    const result = computedFieldEditorSchema.safeParse({ name, config });
    if (!result.success) {
      const flat = result.error.flatten();
      const errs: Record<string, string> = {};
      for (const [key, messages] of Object.entries(flat.fieldErrors)) {
        const msg = (messages as string[] | undefined)?.[0];
        if (msg) errs[key] = msg;
      }
      setErrors(errs);
      return;
    }
    setErrors({});
    onSave({
      id: initial?.id ?? `${COMPUTED_KEY_PREFIX}:${uuidv4()}`,
      name: name.trim(),
      description: description.trim() || undefined,
      config,
      outputFormat,
      enabled: initial?.enabled ?? true
    });
  }

  return (
    <VStack spacing={3} className="pt-2">
      <HStack className="items-end w-full justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          {initial ? "Update" : "Add Field"}
        </Button>
      </HStack>

      <FormControl isInvalid={!!errors.name}>
        <FormLabel>Name</FormLabel>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Delivery Delay"
          isInvalid={!!errors.name}
        />
        {errors.name && <FormErrorMessage>{errors.name}</FormErrorMessage>}
      </FormControl>

      <FormControl>
        <FormLabel>Description</FormLabel>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does this field calculate?"
        />
      </FormControl>

      <Tabs defaultValue={FormulaType.DateDiff}>
        <VStack className="flex flex-col">
          <label className="text-xs text-muted-foreground">Formula Type</label>
          <TabsList>
            {FORMULA_TYPES.map((ft) => (
              <TabsTrigger
                key={ft.value}
                onClick={() => handleTypeChange(ft.value)}
                value={ft.value}
              >
                {ft.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </VStack>
      </Tabs>

      {config.type === FormulaType.DateDiff && (
        <DateDiffForm
          config={config}
          onChange={setConfig}
          dateFields={dateFields}
          errors={errors}
        />
      )}
      {config.type === FormulaType.Arithmetic && (
        <ArithmeticForm
          config={config}
          onChange={setConfig}
          numericFields={numericFields}
          allComputedOptions={computedOptions}
          errors={errors}
        />
      )}
      {config.type === FormulaType.Conditional && (
        <ConditionalForm
          config={config}
          onChange={setConfig}
          allFields={allFieldOptions}
          allComputedOptions={computedOptions}
          errors={errors}
        />
      )}
      {config.type === FormulaType.Concat && (
        <ConcatForm
          config={config}
          onChange={setConfig}
          allFields={allFieldOptions}
          errors={errors}
        />
      )}

      <HStack spacing={2} className="items-end">
        <FormControl className="flex-1">
          <FormLabel>Output Format</FormLabel>
          <Select
            value={outputFormat.type}
            onChange={(v) =>
              setOutputFormat({ ...outputFormat, type: v as OutputFormatType })
            }
            options={OUTPUT_TYPES}
            size="md"
          />
        </FormControl>
        {(outputFormat.type === OutputFormatType.Number ||
          outputFormat.type === OutputFormatType.Currency ||
          outputFormat.type === OutputFormatType.Percentage) && (
          <FormControl className="w-20">
            <FormLabel>Decimals</FormLabel>
            <NumberInput
              min={0}
              max={10}
              value={outputFormat.decimals ?? 2}
              onChange={(e) =>
                setOutputFormat({
                  ...outputFormat,
                  decimals: parseInt(e.target.value) || 0
                })
              }
            />
          </FormControl>
        )}
        <FormControl className="w-24">
          <FormLabel>Suffix</FormLabel>
          <Input
            value={outputFormat.suffix ?? ""}
            onChange={(e) =>
              setOutputFormat({
                ...outputFormat,
                suffix: e.target.value || undefined
              })
            }
            placeholder="e.g. days"
          />
        </FormControl>
      </HStack>
    </VStack>
  );
}
