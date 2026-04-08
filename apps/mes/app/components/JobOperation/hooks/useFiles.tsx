import { toast } from "@carbon/react";
import { useCallback } from "react";
import { useUser } from "~/hooks";
import type { Job, StorageItem } from "~/services/types";
import { path } from "~/utils/path";

export function useFiles(job: Job) {
  const user = useUser();

  const getFilePath = useCallback(
    (file: StorageItem) => {
      const { bucket } = file;
      let id: string | null = "";

      switch (bucket) {
        case "job":
          id = job.id;
          break;
        case "opportunity-line":
          id = job.salesOrderLineId ?? job.quoteLineId;
          break;
        case "parts":
          id = file.itemId ?? job.itemId;
          break;
      }

      return `${bucket}/${id}/${file.name}`;
    },
    [job.id, job.itemId, job.quoteLineId, job.salesOrderLineId]
  );

  const downloadFile = useCallback(
    async (file: StorageItem) => {
      const url = path.to.file.previewFile(
        `${user.company.id}/${getFilePath(file)}`
      );
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.href = blobUrl;
        a.download = file.name;
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      } catch (error) {
        toast.error("Error downloading file");
        console.error(error);
      }
    },
    [getFilePath, user.company.id]
  );

  const downloadModel = useCallback(
    async (model: { modelPath: string; modelName: string }) => {
      if (!model.modelPath || !model.modelName) {
        toast.error("Model data is missing");
        return;
      }

      const modelSubpath = model.modelPath?.startsWith(`${user.company.id}/`)
        ? model.modelPath.slice(user.company.id.length + 1)
        : model.modelPath;
      const url = path.to.file.previewFile(
        `${user.company.id}/${modelSubpath}`
      );
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.href = blobUrl;
        a.download = model.modelName;
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
      } catch (error) {
        toast.error("Error downloading file");
        console.error(error);
      }
    },
    [user.company.id]
  );

  return {
    downloadFile,
    downloadModel,
    getFilePath
  };
}
