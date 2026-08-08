// useWidgetGrid: all dashboard state + widget CRUD in one hook.
// App owns the frame (title, edit toggle); WidgetGrid owns rendering.
import { useState } from "react";
import type { Layout } from "react-grid-layout";
import type { WidgetDef } from "./types";
import type { GlobalFilters } from "../utils/mergeFilters";
import { DEFAULT_LAYOUT, DEFAULT_WIDGETS } from "../../dashboard";

export function useWidgetGrid() {
  const [widgets, setWidgets] = useState<WidgetDef[]>(DEFAULT_WIDGETS);
  const [layout, setLayout] = useState<Layout>(DEFAULT_LAYOUT);
  const [rearranging, setRearranging] = useState(false);
  const [filters, setFilters] = useState<GlobalFilters>({});
  // a new widget exists only as a draft until Done — never appended speculatively
  const [draft, setDraft] = useState<WidgetDef | null>(null);

  const updateWidget = (id: string, next: WidgetDef) =>
    setWidgets((ws) => ws.map((w) => (w.id === id ? next : w)));

  const removeWidget = (id: string) => {
    setWidgets((ws) => ws.filter((w) => w.id !== id));
    setLayout((l) => l.filter((item) => item.i !== id));
  };

  const addWidget = () =>
    setDraft({ id: crypto.randomUUID(), type: "kpi", title: "", spec: { measures: ["cost"] } });

  const commitDraft = () => {
    if (!draft) return;
    setWidgets((ws) => [...ws, draft]);
    setLayout((l) => [...l, { i: draft.id, x: 0, y: Infinity, w: 6, h: 3 }]); // appends at bottom
    setDraft(null);
  };

  return {
    widgets,
    layout,
    rearranging,
    draft,
    filters,
    setFilters,
    onDraftChange: setDraft,
    onDraftCommit: commitDraft,
    onDraftCancel: () => setDraft(null),
    toggleRearranging: () => setRearranging((r) => !r),
    onLayoutChange: setLayout,
    onWidgetChange: updateWidget,
    onWidgetRemove: removeWidget,
    onAddWidget: addWidget,
  };
}
