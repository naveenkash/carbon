import {
  Heading,
  HStack,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  VStack
} from "@carbon/react";
import type React from "react";

interface SettingsPanelProps {}

const SettingsPanel: React.FC<SettingsPanelProps> = () => {
  return (
    <VStack className="w-4/12 bg-card h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-accent border-l border-border px-4 py-2 text-sm">
      <VStack>
        <Heading size="h2">Template Settings</Heading>
        <Tabs defaultValue="general">
          <HStack>
            <div className="flex flex-col">
              <TabsList>
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="pdf">PDF</TabsTrigger>
              </TabsList>
            </div>
          </HStack>

          <TabsContent value="general" className=" min-h-[120px]">
            {/* General settings fields go here */}
          </TabsContent>
          <TabsContent value="pdf" className=" min-h-[120px]">
            {/* PDF settings fields go here */}
          </TabsContent>
        </Tabs>
      </VStack>
    </VStack>
  );
};

export default SettingsPanel;
