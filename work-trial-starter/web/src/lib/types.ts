import type { QuerySpec } from "./api/client";

export type WidgetType = "kpi" | "series" | "table";

export type WidgetDef = {
  type: WidgetType;
  title: string;
  spec: QuerySpec;
};
