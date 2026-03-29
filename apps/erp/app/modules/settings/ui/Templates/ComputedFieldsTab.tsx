import {
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  cn,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  NumberInput,
  Tabs,
  TabsList,
  TabsTrigger,
  VStack
} from "@carbon/react";
import { Reorder, useDragControls } from "framer-motion";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import {
  LuGripVertical,
  LuPencil,
  LuPlus,
  LuToggleLeft,
  LuToggleRight,
  LuTrash2,
  LuX
} from "react-icons/lu";
import { v4 as uuidv4 } from "uuid";
import Select from "~/components/Select";
import { computedFieldEditorSchema } from "~/modules/settings/settings.models";
import {
  type ArithmeticConfig,
  ArithmeticOperator,
  COMPUTED_KEY_PREFIX,
  type ComputedField,
  type ConcatConfig,
  type ConcatPart,
  ConcatPartType,
  type ConditionalConfig,
  ConditionalOperator,
  type ConditionalRule,
  type DateDiffConfig,
  DateDiffUnit,
  type FormulaConfig,
  FormulaType,
  type OutputFormat,
  OutputFormatType
} from "~/modules/settings/types";
import type { FieldDefinition } from "~/utils/field-registry";

// ─── Constants ────────────────────────────────────────────────────────────────

const FORMULA_TYPES = [
  { value: FormulaType.DateDiff, label: "Date Diff" },
  { value: FormulaType.Arithmetic, label: "Arithmetic" },
  { value: FormulaType.Conditional, label: "Conditional" },
  { value: FormulaType.Concat, label: "Concat" }
] as const;

const UNIT_OPTIONS = [
  { value: DateDiffUnit.Days, label: "Days" },
  { value: DateDiffUnit.Weeks, label: "Weeks" },
  { value: DateDiffUnit.Months, label: "Months" }
];

const OPERATOR_OPTIONS = [
  { value: ArithmeticOperator.Add, label: "+" },
  { value: ArithmeticOperator.Subtract, label: "−" },
  { value: ArithmeticOperator.Multiply, label: "×" },
  { value: ArithmeticOperator.Divide, label: "÷" },
  { value: ArithmeticOperator.Percentage, label: "%" }
];

const CONDITION_OPERATORS = [
  { value: ConditionalOperator.Gt, label: ">" },
  { value: ConditionalOperator.Lt, label: "<" },
  { value: ConditionalOperator.Gte, label: ">=" },
  { value: ConditionalOperator.Lte, label: "<=" },
  { value: ConditionalOperator.Eq, label: "=" },
  { value: ConditionalOperator.Neq, label: "≠" },
  { value: ConditionalOperator.Between, label: "between" },
  { value: ConditionalOperator.IsNull, label: "is null" }
];

const OUTPUT_TYPES = [
  { value: OutputFormatType.Number, label: "Number" },
  { value: OutputFormatType.Currency, label: "Currency" },
  { value: OutputFormatType.Percentage, label: "Percentage" },
  { value: OutputFormatType.Text, label: "Text" },
  { value: OutputFormatType.Badge, label: "Badge" }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultConfig(type: FormulaConfig["type"]): FormulaConfig {
  switch (type) {
    case FormulaType.DateDiff:
      return { type, fieldA: "", fieldB: "", unit: DateDiffUnit.Days };
    case FormulaType.Arithmetic:
      return {
        type,
        fieldA: "",
        operator: ArithmeticOperator.Multiply,
        fieldB: "",
        isConstant: false,
        roundTo: 2
      };
    case FormulaType.Conditional:
      return { type, sourceField: "", rules: [], fallback: "" };
    case FormulaType.Concat:
      return { type, parts: [], separator: " " };
  }
}

function defaultOutput(type: FormulaConfig["type"]): OutputFormat {
  switch (type) {
    case FormulaType.DateDiff:
      return { type: OutputFormatType.Number, suffix: "" };
    case FormulaType.Arithmetic:
      return { type: OutputFormatType.Number, decimals: 2 };
    case FormulaType.Conditional:
      return { type: OutputFormatType.Badge };
    case FormulaType.Concat:
      return { type: OutputFormatType.Text };
  }
}

function formulaSummary(
  field: ComputedField,
  labelMap: Record<string, string>
): string {
  const cfg = field.config;
  const l = (key: string) => labelMap[key] ?? key;
  switch (cfg.type) {
    case FormulaType.DateDiff:
      return `${l(cfg.fieldA)} − ${l(cfg.fieldB)} (${cfg.unit})`;
    case FormulaType.Arithmetic: {
      const opLabel =
        OPERATOR_OPTIONS.find((o) => o.value === cfg.operator)?.label ??
        cfg.operator;
      const b = cfg.isConstant ? String(cfg.fieldB) : l(String(cfg.fieldB));
      return `${l(cfg.fieldA)} ${opLabel} ${b}`;
    }
    case FormulaType.Conditional:
      return `Based on ${l(cfg.sourceField)} → ${cfg.rules.map((r) => r.output).join(" / ")}`;
    case FormulaType.Concat:
      return cfg.parts
        .map((p) =>
          p.type === ConcatPartType.Field ? l(p.value) : `"${p.value}"`
        )
        .join(" + ");
  }
}

// ─── Formula config forms ─────────────────────────────────────────────────────

function DateDiffForm({
  config,
  onChange,
  dateFields,
  errors = {}
}: {
  config: DateDiffConfig;
  onChange: (c: DateDiffConfig) => void;
  dateFields: { value: string; label: string }[];
  errors?: Record<string, string>;
}) {
  return (
    <VStack spacing={2}>
      <FormControl isInvalid={!!errors.fieldA}>
        <FormLabel>From (later date)</FormLabel>
        <Select
          value={config.fieldA}
          onChange={(v) => onChange({ ...config, fieldA: v })}
          options={dateFields}
          placeholder="Select field"
          size="md"
        />
        {errors.fieldA && <FormErrorMessage>{errors.fieldA}</FormErrorMessage>}
      </FormControl>
      <FormControl isInvalid={!!errors.fieldB}>
        <FormLabel>To (earlier date)</FormLabel>
        <Select
          value={config.fieldB}
          onChange={(v) => onChange({ ...config, fieldB: v })}
          options={dateFields}
          placeholder="Select field"
          size="md"
        />
        {errors.fieldB && <FormErrorMessage>{errors.fieldB}</FormErrorMessage>}
      </FormControl>
      <FormControl>
        <FormLabel>Unit</FormLabel>
        <Select
          value={config.unit}
          onChange={(v) => onChange({ ...config, unit: v as DateDiffUnit })}
          options={UNIT_OPTIONS}
          size="md"
        />
      </FormControl>
      <HStack
        id="absolute"
        onClick={() => onChange({ ...config, absolute: !config.absolute })}
      >
        <Checkbox checked={config.absolute} />
        <label htmlFor="absolute">Always return positive</label>
      </HStack>
    </VStack>
  );
}

function ArithmeticForm({
  config,
  onChange,
  numericFields,
  allComputedOptions,
  errors = {}
}: {
  config: ArithmeticConfig;
  onChange: (c: ArithmeticConfig) => void;
  numericFields: { value: string; label: string }[];
  allComputedOptions: { value: string; label: string }[];
  errors?: Record<string, string>;
}) {
  const fieldAOptions = [...numericFields, ...allComputedOptions];
  return (
    <VStack spacing={2}>
      <FormControl isInvalid={!!errors.fieldA}>
        <FormLabel>Field A</FormLabel>
        <Select
          value={config.fieldA}
          onChange={(v) => onChange({ ...config, fieldA: v })}
          options={fieldAOptions}
          placeholder="Select field"
          size="md"
        />
        {errors.fieldA && <FormErrorMessage>{errors.fieldA}</FormErrorMessage>}
      </FormControl>
      <FormControl>
        <FormLabel>Operator</FormLabel>
        <Select
          value={config.operator}
          onChange={(v) =>
            onChange({ ...config, operator: v as ArithmeticOperator })
          }
          options={OPERATOR_OPTIONS}
          size="md"
        />
      </FormControl>
      <FormControl isInvalid={!!errors.fieldB}>
        <HStack className="mb-1">
          <FormLabel>Field B</FormLabel>
          <button
            type="button"
            className="text-xs text-primary underline ml-auto"
            onClick={() =>
              onChange({
                ...config,
                isConstant: !config.isConstant,
                fieldB: ""
              })
            }
          >
            {config.isConstant ? "Use field" : "Use constant"}
          </button>
        </HStack>
        {config.isConstant ? (
          <NumberInput
            value={typeof config.fieldB === "number" ? config.fieldB : ""}
            onChange={(e) =>
              onChange({ ...config, fieldB: parseFloat(e.target.value) || 0 })
            }
            placeholder="0"
          />
        ) : (
          <Select
            value={String(config.fieldB)}
            onChange={(v) => onChange({ ...config, fieldB: v })}
            options={fieldAOptions}
            placeholder="Select field"
            size="md"
          />
        )}
        {errors.fieldB && <FormErrorMessage>{errors.fieldB}</FormErrorMessage>}
      </FormControl>
      <FormControl>
        <FormLabel>Round to decimals</FormLabel>
        <NumberInput
          min={0}
          max={10}
          value={config.roundTo ?? 2}
          onChange={(e) =>
            onChange({ ...config, roundTo: parseInt(e.target.value) || 0 })
          }
        />
      </FormControl>
    </VStack>
  );
}

function ConditionalRuleRow({
  rule,
  onChange,
  onRemove
}: {
  rule: ConditionalRule;
  onChange: (r: ConditionalRule) => void;
  onRemove: () => void;
}) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      value={rule}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-center gap-1 bg-background border border-border rounded px-2 py-1.5"
    >
      <span
        className="cursor-grab text-muted-foreground"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <LuGripVertical size={12} />
      </span>
      <Select
        value={rule.operator}
        onChange={(v) =>
          onChange({ ...rule, operator: v as ConditionalOperator })
        }
        options={CONDITION_OPERATORS}
        size="md"
      />
      {rule.operator !== ConditionalOperator.IsNull && (
        <Input
          type={
            rule.operator === ConditionalOperator.Between ? "number" : "text"
          }
          value={String(rule.value ?? "")}
          onChange={(e) => onChange({ ...rule, value: e.target.value })}
          placeholder="value"
          className="w-16"
        />
      )}
      {rule.operator === ConditionalOperator.Between && (
        <Input
          type="number"
          value={String(rule.valueTo ?? "")}
          onChange={(e) =>
            onChange({ ...rule, valueTo: parseFloat(e.target.value) })
          }
          placeholder="to"
          className="w-16"
        />
      )}
      <span className="text-muted-foreground text-xs shrink-0">→</span>
      <Input
        value={rule.output}
        onChange={(e) => onChange({ ...rule, output: e.target.value })}
        placeholder="label"
      />
      <IconButton
        aria-label="Remove rule"
        icon={<LuX size={12} />}
        variant="ghost"
        onClick={onRemove}
      />
    </Reorder.Item>
  );
}

function ConditionalForm({
  config,
  onChange,
  allFields,
  allComputedOptions,
  errors = {}
}: {
  config: ConditionalConfig;
  onChange: (c: ConditionalConfig) => void;
  allFields: { value: string; label: string }[];
  allComputedOptions: { value: string; label: string }[];
  errors?: Record<string, string>;
}) {
  const sourceOptions = [...allFields, ...allComputedOptions];
  const newRule = (): ConditionalRule => ({
    operator: ConditionalOperator.Gt,
    value: 0,
    output: ""
  });

  return (
    <VStack spacing={2}>
      <FormControl isInvalid={!!errors.sourceField}>
        <FormLabel>Source Field</FormLabel>
        <Select
          value={config.sourceField}
          onChange={(v) => onChange({ ...config, sourceField: v })}
          options={sourceOptions}
          placeholder="Select field"
          size="md"
        />
        {errors.sourceField && (
          <FormErrorMessage>{errors.sourceField}</FormErrorMessage>
        )}
      </FormControl>
      <FormControl isInvalid={!!errors.rules}>
        <HStack className="mb-1">
          <FormLabel>Rules</FormLabel>
          <button
            type="button"
            className="text-xs text-primary underline ml-auto flex items-center"
            onClick={() =>
              onChange({ ...config, rules: [...config.rules, newRule()] })
            }
          >
            Add
          </button>
        </HStack>
        <Reorder.Group
          axis="y"
          values={config.rules}
          onReorder={(rules) => onChange({ ...config, rules })}
          className="flex flex-col gap-1"
        >
          {config.rules.map((rule, i) => (
            <ConditionalRuleRow
              key={i}
              rule={rule}
              onChange={(r) => {
                const rules = [...config.rules];
                rules[i] = r;
                onChange({ ...config, rules });
              }}
              onRemove={() =>
                onChange({
                  ...config,
                  rules: config.rules.filter((_, j) => j !== i)
                })
              }
            />
          ))}
        </Reorder.Group>
        {errors.rules && <FormErrorMessage>{errors.rules}</FormErrorMessage>}
      </FormControl>
      <FormControl>
        <FormLabel>Fallback (no rule matches)</FormLabel>
        <Input
          value={config.fallback}
          onChange={(e) => onChange({ ...config, fallback: e.target.value })}
          placeholder="Unknown"
        />
      </FormControl>
    </VStack>
  );
}

function ConcatPartRow({
  part,
  onChange,
  onRemove,
  fieldOptions
}: {
  part: ConcatPart;
  onChange: (p: ConcatPart) => void;
  onRemove: () => void;
  fieldOptions: { value: string; label: string }[];
}) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      value={part}
      dragListener={false}
      dragControls={dragControls}
      className="flex items-center gap-1 bg-background border border-border rounded px-2 py-1.5"
    >
      <span
        className="cursor-grab text-muted-foreground"
        onPointerDown={(e) => dragControls.start(e)}
      >
        <LuGripVertical size={12} />
      </span>
      <Select
        value={part.type}
        onChange={(v) => onChange({ type: v as ConcatPartType, value: "" })}
        options={[
          { value: ConcatPartType.Field, label: "Field" },
          { value: ConcatPartType.Literal, label: "Text" }
        ]}
        size="md"
      />
      {part.type === ConcatPartType.Field ? (
        <Select
          value={part.value}
          onChange={(v) => onChange({ ...part, value: v })}
          options={fieldOptions}
          placeholder="pick field"
          size="md"
        />
      ) : (
        <Input
          size="md"
          value={part.value}
          onChange={(e) => onChange({ ...part, value: e.target.value })}
          placeholder="literal text"
        />
      )}
      <IconButton
        aria-label="Remove part"
        icon={<LuX size={12} />}
        variant="ghost"
        size="md"
        onClick={onRemove}
      />
    </Reorder.Item>
  );
}

function ConcatForm({
  config,
  onChange,
  allFields,
  errors = {}
}: {
  config: ConcatConfig;
  onChange: (c: ConcatConfig) => void;
  allFields: { value: string; label: string }[];
  errors?: Record<string, string>;
}) {
  const newPart = (): ConcatPart => ({ type: ConcatPartType.Field, value: "" });
  return (
    <VStack spacing={2}>
      <FormControl isInvalid={!!errors.parts}>
        <HStack className="mb-1">
          <FormLabel>Parts</FormLabel>
          <button
            type="button"
            className="ml-auto text-xs text-primary flex items-center gap-0.5"
            onClick={() =>
              onChange({ ...config, parts: [...config.parts, newPart()] })
            }
          >
            <LuPlus size={10} /> Add
          </button>
        </HStack>
        <Reorder.Group
          axis="y"
          values={config.parts}
          onReorder={(parts) => onChange({ ...config, parts })}
          className="flex flex-col gap-1"
        >
          {config.parts.map((part, i) => (
            <ConcatPartRow
              key={i}
              part={part}
              onChange={(p) => {
                const parts = [...config.parts];
                parts[i] = p;
                onChange({ ...config, parts });
              }}
              onRemove={() =>
                onChange({
                  ...config,
                  parts: config.parts.filter((_, j) => j !== i)
                })
              }
              fieldOptions={allFields}
            />
          ))}
        </Reorder.Group>
        {errors.parts && <FormErrorMessage>{errors.parts}</FormErrorMessage>}
      </FormControl>
      <FormControl>
        <FormLabel>Separator</FormLabel>
        <Input
          value={config.separator ?? " "}
          onChange={(e) => onChange({ ...config, separator: e.target.value })}
          className="w-24"
        />
      </FormControl>
    </VStack>
  );
}

// ─── Inline editor ────────────────────────────────────────────────────────────

type FieldEditorProps = {
  initial: ComputedField | null;
  availableFields: FieldDefinition[];
  existingComputed: ComputedField[];
  onSave: (field: ComputedField) => void;
  onCancel: () => void;
};

function FieldEditor({
  initial,
  availableFields,
  existingComputed,
  onSave,
  onCancel
}: FieldEditorProps) {
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
      {/* Actions */}
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

      {/* Type-specific config */}
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
      {/* Output format */}
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

// ─── Main component ───────────────────────────────────────────────────────────

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
