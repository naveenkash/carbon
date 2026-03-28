import { Button, Heading, HStack, IconButton, useMount } from "@carbon/react";
import { LuEye, LuPanelRight } from "react-icons/lu";
import { useNavigate, useParams, useSearchParams } from "react-router";

import { usePanels } from "~/components/Layout";
import { useRouteData } from "~/hooks";
import type { Template } from "~/modules/settings/types";
import { TEMPLATE_FORM_ID } from "~/modules/settings/ui/Templates/SettingsPanel";
import { path } from "~/utils/path";

const TemplateHeader = () => {
  const { setIsExplorerCollapsed, toggleProperties } = usePanels();
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  useMount(() => {
    setIsExplorerCollapsed(true);
  });

  const routeData = useRouteData<{ template: Template }>(
    id ? path.to.template(id) : ""
  );

  const isEditing = !!id;
  const module = isEditing
    ? (routeData?.template?.module ?? "")
    : (searchParams.get("module") ?? "");
  const category = isEditing
    ? (routeData?.template?.category ?? null)
    : searchParams.get("category");

  const label = [isEditing ? "Edit" : "New", module, category, "Template"]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-shrink-0 items-center justify-between p-2 bg-card border-b h-[50px] overflow-x-auto scrollbar-hide">
      <HStack className="w-full justify-between">
        <Heading size="h4" className="flex items-center gap-2 ml-3">
          <span>{label}</span>
        </Heading>
        <HStack>
          <Button leftIcon={<LuEye />} variant="outline">
            Preview
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button type="submit" form={TEMPLATE_FORM_ID} variant="primary">
            Save
          </Button>
          <IconButton
            aria-label="Toggle Properties"
            icon={<LuPanelRight />}
            onClick={toggleProperties}
            variant="ghost"
          />
        </HStack>
      </HStack>
    </div>
  );
};

export default TemplateHeader;
