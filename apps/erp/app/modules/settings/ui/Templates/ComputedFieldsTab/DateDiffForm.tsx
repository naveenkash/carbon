import {
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  VStack
} from "@carbon/react";
import Select from "~/components/Select";
import type { DateDiffConfig, DateDiffUnit } from "~/modules/settings/types";
import { UNIT_OPTIONS } from "./constants";

type Props = {
  config: DateDiffConfig;
  onChange: (c: DateDiffConfig) => void;
  dateFields: { value: string; label: string }[];
  errors?: Record<string, string>;
};

export function DateDiffForm({
  config,
  onChange,
  dateFields,
  errors = {}
}: Props) {
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
      <HStack className="cursor-pointer select-none items-center">
        <Checkbox
          id="absoluteValue"
          checked={config.absolute ?? false}
          onCheckedChange={(checked) =>
            onChange({ ...config, absolute: checked === true })
          }
        />
        <label htmlFor="absoluteValue" className="cursor-pointer text-sm">
          Always return positive
        </label>
      </HStack>
    </VStack>
  );
}
