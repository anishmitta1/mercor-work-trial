// Per-widget configuration, shown in edit mode.
// Options come from /api/meta; only fields applicable to the widget's type render,
// so invalid configs can't be produced (validateWidget stays the backstop).
import { useMeta } from "./api/useMeta";
import { XStack } from "./primitives/Stack";
import type { WidgetDef, WidgetType } from "./types";

const fieldStyle = {
  font: "inherit",
  fontSize: "var(--fs-sm)",
  color: "var(--text)",
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  padding: "var(--space-1) var(--space-2)",
} as const;

export function WidgetConfig({
  def,
  onChange,
}: {
  def: WidgetDef;
  onChange: (next: WidgetDef) => void;
}) {
  const { data: meta } = useMeta();
  if (!meta) return null;

  const { spec } = def;
  const measure = spec.measures[0];

  // Changing type rebuilds the spec, carrying over whatever still applies.
  const setType = (type: WidgetType) => {
    if (type === "kpi")
      onChange({ ...def, type, spec: { measures: [measure] } });
    if (type === "series")
      onChange({
        ...def,
        type,
        spec: {
          measures: [measure],
          timeGrain: spec.timeGrain ?? "day",
          orderBy: [{ key: "time", dir: "asc" }],
        },
      });
    if (type === "table")
      onChange({
        ...def,
        type,
        spec: {
          measures: [measure],
          dimensions: [spec.dimensions?.[0] ?? "model_id"],
          orderBy: [{ key: measure, dir: "desc" }],
        },
      });
  };

  return (
    <XStack gap={3} style={{ flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
      <input
        style={fieldStyle}
        value={def.title}
        onChange={(e) => onChange({ ...def, title: e.target.value })}
      />

      <select style={fieldStyle} value={def.type} onChange={(e) => setType(e.target.value as WidgetType)}>
        <option value="kpi">KPI</option>
        <option value="series">Series</option>
        <option value="table">Table</option>
      </select>

      <select
        style={fieldStyle}
        value={measure}
        onChange={(e) =>
          onChange({
            ...def,
            spec: {
              ...spec,
              measures: [e.target.value],
              // keep orderBy pointing at a selected column
              ...(def.type === "table"
                ? { orderBy: [{ key: e.target.value, dir: "desc" as const }] }
                : {}),
            },
          })
        }
      >
        {meta.measures.map((m) => (
          <option key={m.key} value={m.key}>
            {m.key}
          </option>
        ))}
      </select>

      {def.type === "series" && (
        <select
          style={fieldStyle}
          value={spec.timeGrain}
          onChange={(e) =>
            onChange({ ...def, spec: { ...spec, timeGrain: e.target.value as WidgetDef["spec"]["timeGrain"] } })
          }
        >
          {meta.timeGrains.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      )}

      {def.type === "table" && (
        <select
          style={fieldStyle}
          value={spec.dimensions?.[0]}
          onChange={(e) => onChange({ ...def, spec: { ...spec, dimensions: [e.target.value] } })}
        >
          {meta.dimensions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      )}
    </XStack>
  );
}
