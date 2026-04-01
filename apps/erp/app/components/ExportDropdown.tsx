import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  toast
} from "@carbon/react";
import { useEffect } from "react";
import { LuDownload } from "react-icons/lu";
import { useFetcher } from "react-router";
import type { Template } from "~/modules/settings/types";
import type { Category, Module } from "~/utils/field-registry";
import { path } from "~/utils/path";

type ExportDropdownProps = {
  module: Module;
  category: Category;
};

export function ExportDropdown({ module, category }: ExportDropdownProps) {
  const fetcher = useFetcher<{ data: Template[] | null; error: unknown }>();
  // biome-ignore lint/correctness/useExhaustiveDependencies: load once on mount
  useEffect(() => {
    fetcher.load(path.to.api.templates(module as unknown as string, category));
  }, [category, module]);

  const templates = fetcher.data?.data ?? [];

  if (templates.length === 0) return null;

  // // biome-ignore lint/correctness/useHookAtTopLevel: suppressed due to migration
  const download = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.href = blobUrl;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      toast.error((error as any).message);
      console.error(error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" leftIcon={<LuDownload />}>
          Export
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[200px]">
        <DropdownMenuGroup>
          {templates.map((template) => (
            <DropdownMenuSub key={template.id}>
              <DropdownMenuSubTrigger>{template.name}</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() =>
                    download(
                      path.to.file.exportTemplateCsv(template.id),
                      `${template.name}.csv`
                    )
                  }
                >
                  CSV
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    download(
                      path.to.file.exportTemplatePdf(template.id),
                      `${template.name}.pdf`
                    )
                  }
                >
                  PDF
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
