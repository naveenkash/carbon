import {
  Button,
  HStack,
  ModalDrawer,
  ModalDrawerBody,
  ModalDrawerContent,
  ModalDrawerFooter,
  ModalDrawerHeader,
  ModalDrawerProvider,
  ModalDrawerTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@carbon/react";
import type React from "react";
import { useEffect, useState } from "react";
import type { ModuleConfig } from "./types";

interface TemplateDrawerProps {
  open: boolean;
  onClose: () => void;
  moduleConfig: ModuleConfig[string];
  onSave: (settings: any) => void;
}

const TemplateDrawer: React.FC<TemplateDrawerProps> = ({
  open,
  onClose,
  moduleConfig,
  onSave
}) => {
  const [tabValue, setTabValue] = useState("general");
  const [pdfLayout, setPdfLayout] = useState(moduleConfig.pdfSettings.layout);
  const [pdfFormat, setPdfFormat] = useState(moduleConfig.pdfSettings.format);
  const [exportOptions, setExportOptions] = useState<string[]>(
    moduleConfig.pdfSettings.exportOptions
  );

  useEffect(() => {
    if (open) {
      setPdfLayout(moduleConfig.pdfSettings.layout);
      setPdfFormat(moduleConfig.pdfSettings.format);
      setExportOptions(moduleConfig.pdfSettings.exportOptions);
    }
  }, [open, moduleConfig]);

  const handleSave = () => {
    onSave({ layout: pdfLayout, format: pdfFormat, exportOptions });
    onClose();
  };

  return (
    <ModalDrawerProvider type="drawer">
      <ModalDrawer
        open={open}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <ModalDrawerContent>
          <ModalDrawerHeader>
            <ModalDrawerTitle>Template Configuration</ModalDrawerTitle>
          </ModalDrawerHeader>
          <ModalDrawerBody>
            <Tabs
              defaultValue="inbox"
              value={tabValue}
              onValueChange={setTabValue}
            >
              <TabsList className="w-full border-b-[1px] py-6 rounded-none bg-muted/[0.5]">
                <TabsTrigger value="inbox" className="font-normal">
                  Inbox
                </TabsTrigger>
                <TabsTrigger value="trainings" className="font-normal">
                  Trainings
                </TabsTrigger>
                <TabsTrigger value="archive" className="font-normal">
                  Archive
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <TabsContent value="inbox" className="relative mt-0">
              General config here
            </TabsContent>
            <TabsContent value="pdf" className="relative mt-0">
              pdf
            </TabsContent>
          </ModalDrawerBody>
          <ModalDrawerFooter>
            <HStack>
              <Button size="md" variant="solid" onClick={handleSave}>
                Save Settings
              </Button>
              <Button size="md" variant="solid" onClick={onClose}>
                Cancel
              </Button>
            </HStack>
          </ModalDrawerFooter>
        </ModalDrawerContent>
      </ModalDrawer>
    </ModalDrawerProvider>
  );
};

export default TemplateDrawer;
