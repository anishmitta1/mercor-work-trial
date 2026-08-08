// ButtonGroup primitive: segmented control. Selected state per option,
// caller decides single- or multi-select in onToggle.
import { Button } from "./Button";

export function ButtonGroup({
  options,
  selected,
  onToggle,
}: {
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-sm)",
        overflow: "hidden",
      }}
    >
      {options.map((o, i) => {
        const active = selected.includes(o.value);
        return (
          <Button
            key={o.value}
            variant="unstyled"
            onClick={() => onToggle(o.value)}
            style={{
              padding: "var(--space-1) var(--space-3)",
              fontSize: "var(--fs-sm)",
              color: active ? "var(--accent)" : "var(--text-muted)",
              background: active ? "var(--accent-weak)" : "var(--surface)",
              borderLeft: i > 0 ? "1px solid var(--border)" : undefined,
            }}
          >
            {o.label}
          </Button>
        );
      })}
    </div>
  );
}
