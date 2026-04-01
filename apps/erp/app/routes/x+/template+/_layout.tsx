import { requirePermissions } from "@carbon/auth/auth.server";
import { VStack } from "@carbon/react";
import { useEffect, useMemo, useState } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Outlet, useParams } from "react-router";
import { PanelProvider, ResizablePanels } from "~/components/Layout";
import { useRouteData } from "~/hooks";
import type { Template, TemplateConfig } from "~/modules/settings/types";
import { DEFAULT_TEMPLATE_CONFIG } from "~/modules/settings/types";
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
  liveConfig: TemplateConfig;
};

export default function TemplateRoute() {
  const { id } = useParams();
  const routeData = useRouteData<{ template: Template }>(
    id ? path.to.template(id) : ""
  );
  const template = routeData?.template ?? null;

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to re-derive the initial config when the template changes
  const initialConfig = useMemo((): TemplateConfig => {
    const raw =
      template?.templateConfiguration as Partial<TemplateConfig> | null;
    return raw
      ? ({ ...DEFAULT_TEMPLATE_CONFIG, ...raw } as TemplateConfig)
      : DEFAULT_TEMPLATE_CONFIG;
  }, [template?.id]);

  const [pendingConfig, setPendingConfig] =
    useState<TemplateConfig>(initialConfig);
  const [liveConfig, setLiveConfig] = useState<TemplateConfig>(initialConfig);
  const [isDirty, setIsDirty] = useState(false);

  // Reinitialize both configs whenever the template changes (handles navigation)
  useEffect(() => {
    setPendingConfig(initialConfig);
    setLiveConfig(initialConfig);
    setIsDirty(false);
  }, [initialConfig]);

  function handleConfigChange(patch: Partial<TemplateConfig>) {
    setPendingConfig((prev) => ({ ...prev, ...patch }));
    setIsDirty(true);
  }

  function handleRefresh() {
    setLiveConfig(pendingConfig);
    setIsDirty(false);
  }

  const outletContext: TemplateOutletContext = { liveConfig };

  return (
    <PanelProvider>
      <div className="flex flex-col h-[calc(100dvh-49px)] overflow-hidden w-full">
        <TemplateHeader isDirty={isDirty} onRefresh={handleRefresh} />
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
                  template={template}
                  config={pendingConfig}
                  onConfigChange={handleConfigChange}
                />
              }
            />
          </div>
        </div>
      </div>
    </PanelProvider>
  );
}
