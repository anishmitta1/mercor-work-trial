// The default dashboard — our curated opinion of what matters in this data.
// widgets = what each card shows; layout = where it sits (RGL grid units).
// Both are plain data: edit mode mutates copies in state, export is JSON.stringify.
import type { Layout } from "react-grid-layout";
import type { WidgetDef } from "./lib/types";

export const DEFAULT_WIDGETS: WidgetDef[] = [
  {
    id: "w-total-spend",
    type: "kpi",
    title: "Total spend",
    spec: { measures: ["cost"] },
  },
  {
    id: "w-spend-over-time",
    type: "series",
    title: "Spend over time",
    spec: {
      measures: ["cost"],
      timeGrain: "day",
      orderBy: [{ key: "time", dir: "asc" }],
    },
  },
  {
    id: "w-cost-by-model",
    type: "table",
    title: "Cost by model",
    spec: {
      measures: ["cost"],
      dimensions: ["model_id"],
      orderBy: [{ key: "cost", dir: "desc" }],
    },
  },
];

// 12-col grid, rowHeight 80px. Widths follow the widget type: KPI narrow, others half.
export const DEFAULT_LAYOUT: Layout = [
  { i: "w-total-spend", x: 0, y: 0, w: 3, h: 2 },
  { i: "w-spend-over-time", x: 0, y: 2, w: 6, h: 4 },
  { i: "w-cost-by-model", x: 6, y: 2, w: 6, h: 4 },
];
