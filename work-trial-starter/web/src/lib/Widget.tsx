// A widget = a renderer type + a query spec. Nothing else.
// (Position/layout fields slot into this type later without touching renderers.)
import { useQuerySpec } from "./api/useQuerySpec";
import { useMeasureFormat } from "./api/useMeta";
import { formatValue } from "./utils/format";
import { WidgetConfig } from "./WidgetConfig";
import { XStack } from "./primitives/Stack";
import { Text } from "./primitives/Text";
import type { WidgetDef } from "./types";
import type { Row } from "./api/client";

export type { WidgetDef } from "./types";

// Each widget type expects its rows in a certain shape; reject specs that can't produce it.
function validateWidget(def: WidgetDef): string | null {
  const { measures, dimensions = [], timeGrain } = def.spec;
  switch (def.type) {
    case "kpi":
      if (measures.length !== 1) return "KPI needs exactly 1 measure";
      if (dimensions.length || timeGrain) return "KPI can't group (no dimensions/grain)";
      return null;
    case "series":
      if (!timeGrain) return "Series needs a time grain to plot";
      return null;
    case "table":
      if (!dimensions.length) return "Table needs at least 1 dimension";
      return null;
  }
}

export function Widget({
  def,
  editing,
  onToggleEdit,
  onChange,
}: {
  def: WidgetDef;
  editing?: boolean;
  onToggleEdit?: () => void;
  onChange?: (next: WidgetDef) => void;
}) {
  const invalid = validateWidget(def);
  const { data: rows, isPending, error } = useQuerySpec(def.spec, !invalid);

  return (
    <section
      className="widget"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "var(--space-4)",
      }}
    >
      <XStack justify="space-between" align="center">
        <Text variant="cardTitle" as="h3">
          {def.title}
        </Text>
        {onToggleEdit && (
          <button
            className="widget-edit"
            aria-expanded={!!editing}
            onClick={onToggleEdit}
            style={{
              font: "inherit",
              fontSize: "var(--fs-xs)",
              color: editing ? "var(--accent)" : "var(--text-subtle)",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
            }}
          >
            {editing ? "Done" : "Edit"}
          </button>
        )}
      </XStack>
      <div style={{ marginTop: "var(--space-3)" }}>
        {editing && onChange && <WidgetConfig def={def} onChange={onChange} />}
        {invalid && <Text variant="warn">Invalid config: {invalid}</Text>}
        {!invalid && isPending && <Text variant="subtle">Loading…</Text>}
        {!invalid && error && <Text variant="error">{error.message}</Text>}
        {!invalid && rows && <WidgetBody def={def} rows={rows} />}
      </div>
    </section>
  );
}

function WidgetBody({ def, rows }: { def: WidgetDef; rows: Row[] }) {
  if (rows.length === 0) return <Text variant="subtle">No data in this range</Text>;

  switch (def.type) {
    case "kpi":
      return <KpiView def={def} rows={rows} />;
    case "series":
      return <SeriesView rows={rows} />;
    case "table":
      return <TableView rows={rows} />;
  }
}

// --- Skeletal renderers — promoted to real primitives (Stat, LineChart, DataTable) next ---

function KpiView({ def, rows }: { def: WidgetDef; rows: Row[] }) {
  const format = useMeasureFormat(def.spec.measures[0]);
  const value = Number(Object.values(rows[0])[0]);
  return <Text variant="stat">{formatValue(value, format)}</Text>;
}

function SeriesView({ rows }: { rows: Row[] }) {
  return <RowsDump rows={rows} />;
}

function TableView({ rows }: { rows: Row[] }) {
  return <RowsDump rows={rows} />;
}

function RowsDump({ rows }: { rows: Row[] }) {
  return (
    <pre
      style={{
        margin: 0,
        fontSize: "var(--fs-xs)",
        color: "var(--text-muted)",
        overflow: "auto",
        maxHeight: 240,
      }}
    >
      {JSON.stringify(rows.slice(0, 8), null, 1)}
      {rows.length > 8 ? `\n… ${rows.length - 8} more` : ""}
    </pre>
  );
}
