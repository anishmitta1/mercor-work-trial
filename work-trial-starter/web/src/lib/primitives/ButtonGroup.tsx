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
        borderRadius: "var(--radius)",
        overflow: "hidden",
        paddingTop: "2px",
        paddingBottom: "2px",
        paddingRight: "2px",
        paddingLeft: "2px",
        gap: "2px",
      }}
    >
      {options.map((o) => {
        const active = selected.includes(o.value);
        return (
          <Button
            key={o.value}
            onClick={() => onToggle(o.value)}
            style={{
              color: active ? "var(--accent)" : "var(--text-muted)",
              background: active ? "var(--accent-weak)" : "var(--surface)",
              border: "none",
              transition: "all 0.2s ease-in-out",
            }}
          >
            {o.label}
          </Button>
        );
      })}
    </div>
  );
}
