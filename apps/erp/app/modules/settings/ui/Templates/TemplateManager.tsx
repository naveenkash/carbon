import { Card, CardContent, VStack } from "@carbon/react";
import type React from "react";
import FieldPicker from "~/components/Templates/FieldPicker";

interface Props {
  module: string;
  category?: string | null;
  selectedFields: string[];
  onToggleField: (fieldKey: string) => void;
}

const TemplateManager: React.FC<Props> = ({
  module,
  category,
  selectedFields,
  onToggleField
}) => {
  return (
    <VStack spacing={4} className="w-full h-full mx-auto gap-4">
      <Card>
        <CardContent>
          <FieldPicker
            module={module}
            category={category}
            selectedFields={selectedFields}
            onToggleField={onToggleField}
          />
        </CardContent>
      </Card>

      {/* <Card>
        <CardHeader>
          <VStack>
            <CardTitle>Template Manager</CardTitle>
            <CardDescription>
              Select the fields to include when exporting data.
            </CardDescription>
          </VStack>
        </CardHeader>
        <CardContent>
          <FieldPicker
            module={module}
            category={category}
            selectedFields={selectedFields}
            onToggleField={onToggleField}
          />
        </CardContent>
      </Card> */}
    </VStack>
  );
};

export default TemplateManager;
