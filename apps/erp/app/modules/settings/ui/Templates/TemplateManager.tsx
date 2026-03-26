import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  VStack
} from "@carbon/react";
import type React from "react";
import FieldPicker from "~/components/Templates/FieldPicker";
import { TEMPLATE_FORM_ID } from "./SettingsPanel";

interface Props {
  module: string;
  category?: string | null;
  selectedFields: string[];
  onToggleField: (fieldKey: string) => void;
  onClose: () => void;
}

const TemplateManager: React.FC<Props> = ({
  module,
  category,
  selectedFields,
  onToggleField,
  onClose
}) => {
  return (
    <VStack spacing={4} className="w-full h-full mx-auto gap-4">
      <Card>
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
        <CardFooter>
          <Button type="submit" form={TEMPLATE_FORM_ID} variant="primary">
            Save
          </Button>
          <Button type="button" onClick={onClose} variant="secondary">
            Cancel
          </Button>
        </CardFooter>
      </Card>
    </VStack>
  );
};

export default TemplateManager;
