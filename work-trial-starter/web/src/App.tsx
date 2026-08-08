import { WidgetGrid } from "./lib/components/WidgetGrid";
import { useWidgetGrid } from "./lib/useWidgetGrid";
import { Button } from "./lib/primitives/Button";
import { XStack, YStack } from "./lib/primitives/Stack";
import { Text } from "./lib/primitives/Text";

export function App() {
  const { rearranging, toggleRearranging, ...gridProps } = useWidgetGrid();

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "var(--space-8) var(--space-5)" }}>
      <YStack gap={4}>
        <XStack justify="space-between" align="center">
          <Text variant="title" as="h1">
            LLM Spend
          </Text>
          <Button active={rearranging} onClick={toggleRearranging}>
            {rearranging ? "Done" : "Rearrange"}
          </Button>
        </XStack>

        <WidgetGrid rearranging={rearranging} {...gridProps} />
      </YStack>
    </main>
  );
}
