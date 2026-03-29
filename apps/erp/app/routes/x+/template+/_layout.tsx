import { requirePermissions } from "@carbon/auth/auth.server";
import { VStack } from "@carbon/react";
import type { Dispatch, SetStateAction } from "react";
import { useState } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Outlet } from "react-router";
import { PanelProvider, ResizablePanels } from "~/components/Layout";
import SettingsPanel from "~/modules/settings/ui/Templates/SettingsPanel";
import TemplateHeader from "~/modules/settings/ui/Templates/TemplateHeader";
import type { Handle } from "~/utils/handle";
import { path } from "~/utils/path";

export const meta: MetaFunction = () => {
  return [{ title: "Carbon | Template" }];
};

export const handle: Handle = {
  breadcrumb: "Template",
  to: path.to.templates,
  module: "templates"
};

export async function loader({ request }: LoaderFunctionArgs) {
  await requirePermissions(request, {});
  return {};
}

export type TemplateOutletContext = {
  selectedFields: string[];
  setSelectedFields: Dispatch<SetStateAction<string[]>>;
};

export default function TemplateRoute() {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const outletContext: TemplateOutletContext = {
    selectedFields,
    setSelectedFields
  };

  return (
    <PanelProvider>
      <div className="flex flex-col h-[calc(100dvh-49px)] overflow-hidden w-full">
        <TemplateHeader />
        <div className="flex h-[calc(100dvh-99px)] overflow-hidden w-full">
          <div className="flex flex-grow overflow-hidden">
            <ResizablePanels
              explorer={null}
              content={
                <div className="h-[calc(100dvh-99px)] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-accent w-full">
                  <VStack spacing={2} className="p-2">
                    <Outlet context={outletContext} />
                  </VStack>
                </div>
              }
              properties={<SettingsPanel selectedFields={selectedFields} />}
            />
          </div>
        </div>
      </div>
    </PanelProvider>
  );
}
