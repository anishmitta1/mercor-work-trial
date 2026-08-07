import { WidgetGrid } from "./lib/components/WidgetGrid";
import { useWidgetGrid } from "./lib/useWidgetGrid";
import { XStack, YStack } from "./lib/primitives/Stack";
import { Text } from "./lib/primitives/Text";

export function App() {
  const { editing, toggleEditing, ...gridProps } = useWidgetGrid();

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "var(--space-8) var(--space-5)" }}>
      <YStack gap={4}>
        <XStack justify="space-between" align="center">
          <Text variant="title" as="h1">
            LLM Spend
          </Text>
          <button
            onClick={toggleEditing}
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

        <WidgetGrid editing={editing} {...gridProps} />
      </YStack>
    </main>
  );
}
