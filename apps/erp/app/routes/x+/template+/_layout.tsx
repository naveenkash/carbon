import { requirePermissions } from "@carbon/auth/auth.server";
import { VStack } from "@carbon/react";
import { useState } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Outlet } from "react-router";
import { PanelProvider, ResizablePanels } from "~/components/Layout";
import {
  DEFAULT_TEMPLATE_CONFIG,
  type TemplateConfig
} from "~/modules/settings/types";
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
  setSelectedFields: React.Dispatch<React.SetStateAction<string[]>>;
  module: string;
  category: string | null;
  setModule: (module: string) => void;
  setCategory: (category: string | null) => void;
  setAction: (action: string) => void;
  setInitialName: (name: string) => void;
  setInitialConfig: (config: Partial<TemplateConfig>) => void;
};

export default function TemplateRoute() {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [module, setModule] = useState("Purchasing");
  const [category, setCategory] = useState<string | null>("Orders");
  const [action, setAction] = useState(path.to.newTemplate);
  const [initialName, setInitialName] = useState("");
  const [initialConfig, setInitialConfig] = useState<Partial<TemplateConfig>>(
    DEFAULT_TEMPLATE_CONFIG
  );

  const outletContext: TemplateOutletContext = {
    selectedFields,
    setSelectedFields,
    module,
    category,
    setModule,
    setCategory,
    setAction,
    setInitialName,
    setInitialConfig
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
              properties={
                <SettingsPanel
                  action={action}
                  module={module}
                  category={category}
                  selectedFields={selectedFields}
                  initialName={initialName}
                  initialConfig={initialConfig}
                />
              }
            />
          </div>
        </div>
      </div>
    </PanelProvider>
  );
}
