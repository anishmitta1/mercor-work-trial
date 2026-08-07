import { useState } from "react";
import ReactGridLayout, {
  useContainerWidth,
  verticalCompactor,
  type Layout,
} from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { Widget, type WidgetDef } from "./lib/Widget";
import { XStack, YStack } from "./lib/primitives/Stack";
import { Text } from "./lib/primitives/Text";
import { DEFAULT_LAYOUT, DEFAULT_WIDGETS } from "./dashboard";

export function App() {
  const [widgets, setWidgets] = useState<WidgetDef[]>(DEFAULT_WIDGETS);
  const [layout, setLayout] = useState<Layout>(DEFAULT_LAYOUT);
  const [editing, setEditing] = useState(false);
  const { width, containerRef, mounted } = useContainerWidth();

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
      { id, type: "kpi", title: "New widget", spec: { measures: ["cost"] } },
    ]);
    setLayout((l) => [...l, { i: id, x: 0, y: Infinity, w: 6, h: 3 }]); // appends at bottom
  };

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "var(--space-8) var(--space-5)" }}>
      <YStack gap={4}>
        <XStack justify="space-between" align="center">
          <Text variant="title" as="h1">
            LLM Spend
          </Text>
          <button
            onClick={() => setEditing((e) => !e)}
            style={{
              font: "inherit",
              fontSize: "var(--fs-sm)",
              color: editing ? "var(--accent)" : "var(--text-muted)",
              background: editing ? "var(--accent-weak)" : "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "var(--space-1) var(--space-3)",
              cursor: "pointer",
            }}
          >
            {editing ? "Done" : "Edit"}
          </button>
        </XStack>

        <div ref={containerRef}>
          {mounted && (
            <ReactGridLayout
              width={width}
              layout={layout}
              onLayoutChange={setLayout}
              gridConfig={{ cols: 12, rowHeight: 80, margin: [16, 16], containerPadding: [0, 0] }}
              dragConfig={{ enabled: editing, cancel: "input, select, button" }}
              resizeConfig={{ enabled: editing, handles: ["se", "sw", "ne", "nw"] }}
              compactor={verticalCompactor}
            >
              {widgets.map((w) => (
                <div key={w.id}>
                  <Widget
                    def={w}
                    editing={editing}
                    onChange={(next) => updateWidget(w.id, next)}
                    onRemove={() => removeWidget(w.id)}
                  />
                </div>
              ))}
            </ReactGridLayout>
          )}
        </div>

        <button
          onClick={addWidget}
          style={{
            font: "inherit",
            fontSize: "var(--fs-sm)",
            color: "var(--text-subtle)",
            background: "none",
            border: "1px dashed var(--border-strong)",
            borderRadius: "var(--radius)",
            padding: "var(--space-3)",
            cursor: "pointer",
          }}
        >
          + Add widget
        </button>
      </YStack>
    </main>
  );
}
