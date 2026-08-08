import type { QuerySpec } from "../api/client";

export type WidgetType = "kpi" | "series" | "table";

export type WidgetDef = {
  id: string; // stable identity — RGL layout keys off this
  type: WidgetType;
  title: string;
  spec: QuerySpec;
};
