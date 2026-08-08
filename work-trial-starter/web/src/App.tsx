import { WidgetGrid } from "./lib/components/WidgetGrid";
import { FilterBar } from "./lib/components/FilterBar";
import { useWidgetGrid } from "./lib/widget/useWidgetGrid";
import { Button } from "./lib/primitives/Button";
import { XStack, YStack } from "./lib/primitives/Stack";
import { Text } from "./lib/primitives/Text";

export function App() {
  const { rearranging, toggleRearranging, filters, setFilters, ...gridProps } =
    useWidgetGrid();

  return (
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "var(--space-8) var(--space-5)",
      }}
    >
      <YStack gap={4}>
        <XStack justify="space-between" align="center">
          <Text variant="title" as="h1">
            LLM Spend
          </Text>
          <XStack gap={2} align="center">
            <Button
              variant="primary"
              disabled={rearranging}
              onClick={gridProps.onAddWidget}
            >
              + Add widget
            </Button>
            <Button active={rearranging} onClick={toggleRearranging}>
              {rearranging ? "Done" : "Edit Layout"}
            </Button>
          </XStack>
        </XStack>

        <FilterBar filters={filters} onChange={setFilters} />

        <WidgetGrid
          rearranging={rearranging}
          filters={filters}
          {...gridProps}
        />
      </YStack>
    </main>
  );
}
