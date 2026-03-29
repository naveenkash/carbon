import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  IconButton,
  Input,
  VStack
} from "@carbon/react";
import { Reorder, useDragControls } from "framer-motion";
import { LuGripVertical, LuX } from "react-icons/lu";
import Select from "~/components/Select";
import {
  type ConditionalConfig,
  ConditionalOperator,
  type ConditionalRule
} from "~/modules/settings/types";
import { CONDITION_OPERATORS } from "./constants";

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

type Props = {
  config: ConditionalConfig;
  onChange: (c: ConditionalConfig) => void;
  allFields: { value: string; label: string }[];
  allComputedOptions: { value: string; label: string }[];
  errors?: Record<string, string>;
};

export function ConditionalForm({
  config,
  onChange,
  allFields,
  allComputedOptions,
  errors = {}
}: Props) {
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
