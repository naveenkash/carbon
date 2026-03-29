import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  NumberInput,
  VStack
} from "@carbon/react";
import Select from "~/components/Select";
import type {
  ArithmeticConfig,
  ArithmeticOperator
} from "~/modules/settings/types";
import { OPERATOR_OPTIONS } from "./constants";

type Props = {
  config: ArithmeticConfig;
  onChange: (c: ArithmeticConfig) => void;
  numericFields: { value: string; label: string }[];
  allComputedOptions: { value: string; label: string }[];
  errors?: Record<string, string>;
};

export function ArithmeticForm({
  config,
  onChange,
  numericFields,
  allComputedOptions,
  errors = {}
}: Props) {
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
