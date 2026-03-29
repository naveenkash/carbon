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
import { LuGripVertical, LuPlus, LuX } from "react-icons/lu";
import Select from "~/components/Select";
import {
  type ConcatConfig,
  type ConcatPart,
  ConcatPartType
} from "~/modules/settings/types";

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

type Props = {
  config: ConcatConfig;
  onChange: (c: ConcatConfig) => void;
  allFields: { value: string; label: string }[];
  errors?: Record<string, string>;
};

export function ConcatForm({
  config,
  onChange,
  allFields,
  errors = {}
}: Props) {
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
