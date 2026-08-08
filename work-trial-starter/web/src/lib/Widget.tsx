// A widget = a renderer type + a query spec. Nothing else.
// (Position lives in RGL's layout array, keyed by WidgetDef.id — not here.)
import { useState } from "react";
import { useQuerySpec } from "./api/useQuerySpec";
import { useMeasureFormat, useMeta } from "./api/useMeta";
import { formatValue } from "./utils/format";
import { WidgetConfig } from "./WidgetConfig";
import { DataTable } from "./components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { XStack } from "./primitives/Stack";
import { Button } from "./primitives/Button";
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
  rearranging,
  onChange,
  onRemove,
}: {
  def: WidgetDef;
  rearranging?: boolean;
  onChange?: (next: WidgetDef) => void;
  onRemove?: () => void;
}) {
  const [configOpen, setConfigOpen] = useState(false);
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
        height: "100%",
        boxSizing: "border-box",
        overflow: "auto",
      }}
    >
      <XStack justify="space-between" align="center">
        <Text variant="cardTitle" as="h3">
          {def.title}
        </Text>
        <XStack gap={2} align="center">
          <Button
            variant="unstyled"
            className="widget-edit"
            aria-expanded={configOpen}
            onClick={() => setConfigOpen((o) => !o)}
            style={{ fontSize: "var(--fs-xs)", color: configOpen ? "var(--accent)" : "var(--text-subtle)" }}
          >
            {configOpen ? "Done" : "Edit"}
          </Button>
          {rearranging && <DragHandle />}
        </XStack>
      </XStack>
      <div style={{ marginTop: "var(--space-3)" }}>
        {configOpen && onChange && (
          <WidgetConfig def={def} onChange={onChange} onRemove={onRemove} />
        )}
        {invalid && <Text variant="warn">Invalid config: {invalid}</Text>}
        {!invalid && isPending && <Text variant="subtle">Loading…</Text>}
        {!invalid && error && <Text variant="error">{error.message}</Text>}
        {!invalid && rows && <WidgetBody def={def} rows={rows} />}
      </div>
    </section>
  );
}

// Grip affordance, edit mode only. Carries the RGL drag-handle class.
function DragHandle() {
  return (
    <svg
      className="widget-drag-handle"
      width="10"
      height="16"
      viewBox="0 0 10 16"
      fill="var(--text-subtle)"
      aria-label="Drag to rearrange"
    >
      {[4, 8, 12].map((y) =>
        [2, 8].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.5" />),
      )}
    </svg>
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
      return <TableView def={def} rows={rows} />;
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

function TableView({ def, rows }: { def: WidgetDef; rows: Row[] }) {
  const { data: meta } = useMeta();
  const formatOf = (key: string) =>
    meta?.measures.find((m) => m.key === key)?.format ?? "number";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: ColumnDef<Row, any>[] = [
    ...(def.spec.dimensions ?? []).map((d) => ({ header: d, accessorKey: d })),
    ...def.spec.measures.map((m) => ({
      header: m,
      accessorKey: m,
      meta: { align: "right" as const },
      cell: (c: { getValue: () => unknown }) => formatValue(Number(c.getValue()), formatOf(m)),
    })),
  ];
  return <DataTable columns={columns} rows={rows} />;
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
