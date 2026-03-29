import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  HStack,
  Status,
  toast
} from "@carbon/react";
import { useEffect } from "react";
import { LuChevronDown, LuDownload } from "react-icons/lu";
import { useFetcher } from "react-router";
import type { Template } from "~/modules/settings/types";
import { path } from "~/utils/path";

type ExportDropdownProps = {
  module: string;
  category?: string;
};

export function ExportDropdown({ module, category }: ExportDropdownProps) {
  const fetcher = useFetcher<{ data: Template[] | null; error: unknown }>();
  // biome-ignore lint/correctness/useExhaustiveDependencies: load once on mount
  useEffect(() => {
    fetcher.load(path.to.api.templates(module, category));
  }, [category, module]);

  const templates = fetcher.data?.data ?? [];

  if (templates.length === 0) return null;

  const defaultTemplate: Template = templates.find((each) => !!each.isDefault);

  // // biome-ignore lint/correctness/useHookAtTopLevel: suppressed due to migration
  const download = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.href = blobUrl;
      a.download = defaultTemplate.name;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Error downloading file");
      console.error(error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          leftIcon={<LuDownload />}
          rightIcon={<LuChevronDown />}
        >
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <DropdownMenuItem
          onClick={() =>
            download(path.to.file.exportTemplateCsv(defaultTemplate.id))
          }
        >
          Download as CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {templates.map((template) => (
            <DropdownMenuItem
              key={template.id}
              onClick={() =>
                download(path.to.file.exportTemplatePdf(template.id))
              }
            >
              <HStack className="justify-between items-center w-full">
                {template.name}{" "}
                {defaultTemplate?.id === template.id ? (
                  <Status color="gray">Default</Status>
                ) : null}
              </HStack>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
