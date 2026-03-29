import { VStack } from "@carbon/react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import type {
  ComputedField,
  TemplateConfig,
  TemplateField
} from "~/modules/settings/types";
import { DEFAULT_TEMPLATE_CONFIG } from "~/modules/settings/types";
import { path } from "~/utils/path";

interface Props {
  module: string;
  category?: string | null;
  selectedFields: TemplateField[];
  computedFields: ComputedField[];
  previewConfig: Partial<TemplateConfig>;
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const TemplateManager: React.FC<Props> = ({
  module,
  category,
  selectedFields,
  computedFields,
  previewConfig
}) => {
  const previewUrl = useMemo(() => {
    const config: TemplateConfig = {
      ...DEFAULT_TEMPLATE_CONFIG,
      ...previewConfig,
      fields: selectedFields,
      computedFields: computedFields.filter((f) => f.enabled)
    };

    const params = new URLSearchParams({
      module,
      config: JSON.stringify(config)
    });
    if (category) params.set("category", category);

    return `${path.to.file.previewTemplatePdf}?${params.toString()}#toolbar=0`;
  }, [module, category, selectedFields, computedFields, previewConfig]);

  const debouncedUrl = useDebounced(previewUrl, 300);

  return (
    <VStack spacing={0} className="w-full h-full">
      <iframe
        key={debouncedUrl}
        src={debouncedUrl}
        className="w-full flex-1 border-0"
        style={{ minHeight: "calc(100dvh - 99px)" }}
        title="Template Preview"
      />
    </VStack>
  );
};

export default TemplateManager;
