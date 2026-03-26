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
import { useState } from "react";
import { useSearchParams } from "react-router";
import FieldPicker from "~/components/Templates/FieldPicker";

interface Props {
  onClose: () => void;
}

const TemplateManager: React.FC<Props> = ({ onClose }: Props) => {
  const [searchParams] = useSearchParams();
  const module = searchParams.get("module") ?? "purchase_orders";

  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  const handleToggleField = (fieldKey: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldKey)
        ? prev.filter((key) => key !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const handleSaveTemplate = () => {
    console.log("Saving template for module:", module);
    console.log("Selected fields:", selectedFields);
  };

  return (
    <>
      <VStack spacing={4} className="w-full h-full mx-auto gap-4">
        <Card>
          <CardHeader>
            <VStack>
              <CardTitle>Template Manager</CardTitle>
              <CardDescription>
                Configure which fields to include when exporting data.
              </CardDescription>
            </VStack>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-start">
              <div className="flex-1 min-w-0">
                <FieldPicker
                  module={module}
                  selectedFields={selectedFields}
                  onToggleField={handleToggleField}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveTemplate} variant="primary">
              Save
            </Button>
            <Button onClick={onClose} variant="secondary">
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </VStack>
    </>
  );
};

export default TemplateManager;
