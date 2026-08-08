// useWidgetGrid: all dashboard state + widget CRUD in one hook.
// App owns the frame (title, edit toggle); WidgetGrid owns rendering.
import { useState } from "react";
import type { Layout } from "react-grid-layout";
import type { WidgetDef } from "./types";
import { DEFAULT_LAYOUT, DEFAULT_WIDGETS } from "../dashboard";

export function useWidgetGrid() {
  const [widgets, setWidgets] = useState<WidgetDef[]>(DEFAULT_WIDGETS);
  const [layout, setLayout] = useState<Layout>(DEFAULT_LAYOUT);
  const [rearranging, setRearranging] = useState(false);
  const [autoEditId, setAutoEditId] = useState<string | null>(null);

  const updateWidget = (id: string, next: WidgetDef) =>
    setWidgets((ws) => ws.map((w) => (w.id === id ? next : w)));

  const removeWidget = (id: string) => {
    setWidgets((ws) => ws.filter((w) => w.id !== id));
    setLayout((l) => l.filter((item) => item.i !== id));
  };

  const addWidget = () => {
    const id = crypto.randomUUID();
    setWidgets((ws) => [
      ...ws,
      { id, type: "kpi", title: "", spec: { measures: ["cost"] } },
    ]);
    setLayout((l) => [...l, { i: id, x: 0, y: Infinity, w: 6, h: 3 }]); // appends at bottom
    setAutoEditId(id); // opens the new widget's editor on mount
  };

  return {
    widgets,
    layout,
    rearranging,
    autoEditId,
    toggleRearranging: () => setRearranging((r) => !r),
    onLayoutChange: setLayout,
    onWidgetChange: updateWidget,
    onWidgetRemove: removeWidget,
    onAddWidget: addWidget,
  };
}
