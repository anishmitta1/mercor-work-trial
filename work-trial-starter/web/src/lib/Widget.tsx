// A widget = a renderer type + a query spec. Nothing else.
// (Position/layout fields slot into this type later without touching renderers.)
import { useQuerySpec } from "./useQuerySpec";
import { useMeasureFormat } from "./useMeta";
import { formatValue } from "./format";
import type { QuerySpec, Row } from "./api";

export type WidgetDef = {
  type: "kpi" | "series" | "table";
  title: string;
  spec: QuerySpec;
};

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

export function Widget({ def }: { def: WidgetDef }) {
  const invalid = validateWidget(def);
  const { data: rows, isPending, error } = useQuerySpec(def.spec, !invalid);

  return (
    <section
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "var(--space-4)",
      }}
    >
      <h3 style={{ margin: 0, fontSize: "var(--fs-sm)", color: "var(--text-muted)" }}>
        {def.title}
      </h3>
      <div style={{ marginTop: "var(--space-3)", fontSize: "var(--fs-md)" }}>
        {invalid && <span style={{ color: "var(--warn)" }}>Invalid config: {invalid}</span>}
        {!invalid && isPending && (
          <span style={{ color: "var(--text-subtle)" }}>Loading…</span>
        )}
        {!invalid && error && <span style={{ color: "var(--danger)" }}>{error.message}</span>}
        {!invalid && rows && <WidgetBody def={def} rows={rows} />}
      </div>
    </section>
  );
}

function WidgetBody({ def, rows }: { def: WidgetDef; rows: Row[] }) {
  if (rows.length === 0)
    return <span style={{ color: "var(--text-subtle)" }}>No data in this range</span>;

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
  return (
    <span style={{ fontSize: "var(--fs-2xl)", fontVariantNumeric: "tabular-nums" }}>
      {formatValue(value, format)}
    </span>
  );
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
