import { Text, View } from "@react-pdf/renderer";

export type ExportField = {
  key: string;
  label: string;
  type: "text" | "number" | "date" | "currency" | "boolean";
};

export type ExportRow = Record<string, unknown>;

export type TableStyleConfig = {
  headerBg: string;
  headerText: string;
  evenRowBg: string;
  oddRowBg: string;
  borderColor: string;
  showBorders: boolean;
  fontSize: "small" | "default" | "large" | string;
};

function formatValue(
  value: unknown,
  type: ExportField["type"],
  locale: string,
  currencyCode?: string
): string {
  if (value === null || value === undefined || value === "") return "-";

  switch (type) {
    case "date": {
      try {
        return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
          new Date(value as string)
        );
      } catch {
        return String(value);
      }
    }
    case "currency": {
      try {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency: currencyCode ?? "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(Number(value));
      } catch {
        return String(value);
      }
    }
    case "number": {
      try {
        return new Intl.NumberFormat(locale).format(Number(value));
      } catch {
        return String(value);
      }
    }
    case "boolean":
      return value ? "Yes" : "No";
    default:
      return String(value);
  }
}

interface ExportTemplateTableProps {
  fields: ExportField[];
  rows: ExportRow[];
  style: TableStyleConfig;
  locale: string;
  currencyCode?: string;
}

const ExportTemplateTable = ({
  fields,
  rows,
  style,
  locale,
  currencyCode
}: ExportTemplateTableProps) => {
  const colFlex = 1;
  const bodyFontSize =
    style.fontSize === "small" ? 8 : style.fontSize === "large" ? 11 : 9;

  return (
    <View>
      {/* Header row */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: style.headerBg,
          paddingVertical: 6,
          paddingHorizontal: 8
        }}
        fixed
      >
        {fields.map((field) => (
          <Text
            key={field.key}
            style={{
              flex: colFlex,
              color: style.headerText,
              fontSize: 8,
              fontWeight: 700,
              textTransform: "uppercase"
            }}
          >
            {field.label}
          </Text>
        ))}
      </View>

      {/* Data rows */}
      {rows.map((row, rowIndex) => {
        const isEven = rowIndex % 2 === 0;
        return (
          <View
            key={rowIndex}
            style={{
              flexDirection: "row",
              paddingVertical: 5,
              paddingHorizontal: 8,
              backgroundColor: isEven ? style.evenRowBg : style.oddRowBg,
              borderBottomWidth: style.showBorders ? 1 : 0,
              borderBottomColor: style.borderColor,
              borderStyle: "solid"
            }}
            wrap={false}
          >
            {fields.map((field) => (
              <Text
                key={field.key}
                style={{
                  flex: colFlex,
                  fontSize: bodyFontSize,
                  color: "#1f2937"
                }}
              >
                {formatValue(row[field.key], field.type, locale, currencyCode)}
              </Text>
            ))}
          </View>
        );
      })}
    </View>
  );
};

export default ExportTemplateTable;
