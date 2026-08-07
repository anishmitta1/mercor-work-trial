import { useState } from "react";
import { Widget, type WidgetDef } from "./lib/Widget";
import { XStack, YStack } from "./lib/primitives/Stack";
import { Text } from "./lib/primitives/Text";
import { DEFAULT_DASHBOARD } from "./dashboard";

export function App() {
  const [widgets, setWidgets] = useState<WidgetDef[]>(DEFAULT_DASHBOARD);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  // Single update path for edit mode: replace one widget by index.
  const updateWidget = (i: number, next: WidgetDef) =>
    setWidgets((ws) => ws.map((w, j) => (j === i ? next : w)));

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "var(--space-8) var(--space-5)" }}>
      <YStack gap={4}>
        <XStack justify="space-between" align="center">
          <Text variant="title" as="h1">
            LLM Spend
          </Text>
        </XStack>

        {widgets.map((w, i) => (
          <Widget
            key={i}
            def={w}
            editing={editingIndex === i}
            onToggleEdit={() => setEditingIndex(editingIndex === i ? null : i)}
            onChange={(next) => updateWidget(i, next)}
          />
        ))}
      </YStack>
    </main>
  );
}
