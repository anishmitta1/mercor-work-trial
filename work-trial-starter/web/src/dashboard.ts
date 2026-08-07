// The default dashboard — our curated opinion of what matters in this data.
// It's plain data: edit mode mutates a copy in state, export is JSON.stringify.
import type { WidgetDef } from "./lib/Widget";

export const DEFAULT_DASHBOARD: WidgetDef[] = [
  {
    type: "kpi",
    title: "Total spend",
    spec: { measures: ["cost"] },
  },
  {
    type: "series",
    title: "Spend over time",
    spec: {
      measures: ["cost"],
      timeGrain: "day",
      orderBy: [{ key: "time", dir: "asc" }],
    },
  },
  {
    type: "table",
    title: "Cost by model",
    spec: {
      measures: ["cost"],
      dimensions: ["model_id"],
      orderBy: [{ key: "cost", dir: "desc" }],
    },
  },
];
