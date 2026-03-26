export interface TemplateMetadata {
  name: string;
  module: string;
  category: string;
}

export interface ModuleConfig {
  [key: string]: {
    fields: string[];
    pdfSettings: {
      layout: string;
      format: string;
      exportOptions: string[];
    };
  };
}

export const modules: ModuleConfig = {
  Invoice: {
    fields: ["clientName", "amount"],
    pdfSettings: {
      layout: "Portrait",
      format: "A4",
      exportOptions: ["Email", "Download"]
    }
  },
  Report: {
    fields: ["dateRange", "summary"],
    pdfSettings: {
      layout: "Landscape",
      format: "Letter",
      exportOptions: ["Print", "Share"]
    }
  }
};
