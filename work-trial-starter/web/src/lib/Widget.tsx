// A widget = a renderer type + a query spec. Nothing else.
// (Position lives in RGL's layout array, keyed by WidgetDef.id — not here.)
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { motion } from "motion/react";
import { useQuerySpec } from "./api/useQuerySpec";
import { useMeasureFormat, useMeta } from "./api/useMeta";
import { formatValue } from "./utils/format";
import { mergeGlobalFilters, type GlobalFilters } from "./utils/mergeFilters";
import { WidgetConfig } from "./WidgetConfig";
import { DataTable } from "./components/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { XStack } from "./primitives/Stack";
import { Modal } from "./primitives/Modal";
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

const cardStyle: CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  padding: "var(--space-4)",
  boxSizing: "border-box",
  overflow: "auto",
};

export function Widget({
  def,
  rearranging,
  startEditing = false,
  filters,
  onChange,
  onRemove,
  onCancel,
}: {
  def: WidgetDef;
  rearranging?: boolean;
  startEditing?: boolean;
  filters?: GlobalFilters;
  onChange?: (next: WidgetDef) => void;
  onRemove?: () => void;
  onCancel?: () => void; // shown in the editor for a just-added widget
}) {
  const [editing, setEditing] = useState(startEditing);
  // skeleton masks the morph; real content fades in once the box settles
  const [settled, setSettled] = useState(false);
  const invalid = validateWidget(def);
  // every widget query merges the global filters — one code path, coherent dashboard
  const spec = useMemo(() => mergeGlobalFilters(def.spec, filters ?? {}), [def.spec, filters]);
  const { data: rows, isPending, error } = useQuerySpec(spec, !invalid);

  useEffect(() => {
    if (!editing) return setSettled(false);
    const t = setTimeout(() => setSettled(true), 220);
    return () => clearTimeout(t);
  }, [editing]);

  // Radix handles Esc/scrim/focus; dismissing a just-added widget cancels it
  const onOpenChange = (open: boolean) => {
    if (open) return setEditing(true);
    setSettled(false); // content fades to 80% for the closing morph too
    if (onCancel) onCancel();
    else setEditing(false);
  };

  return (
    <>
      <motion.section layoutId={`widget-${def.id}`} className="widget" style={{ ...cardStyle, height: "100%" }}>
        <XStack justify="space-between" align="center">
          <Text variant="cardTitle" as="h3">
            {def.title || "Untitled widget"}
          </Text>
          <XStack gap={2} align="center">
            {onChange && !rearranging && (
              <Button
                variant="unstyled"
                className="widget-edit"
                onClick={() => setEditing(true)}
                style={{ fontSize: "var(--fs-xs)", color: "var(--text-subtle)" }}
              >
                Edit
              </Button>
            )}
            {rearranging && <DragHandle />}
          </XStack>
        </XStack>
        <div style={{ marginTop: "var(--space-3)" }}>
          <WidgetContent def={def} invalid={invalid} isPending={isPending} error={error} rows={rows} />
        </div>
      </motion.section>

      <Modal
        open={editing}
        onOpenChange={onOpenChange}
        layoutId={`widget-${def.id}`}
        title={def.title || "Untitled widget"}
      >
        <XStack justify="space-between" align="center">
          <Text variant="cardTitle" as="h3">
            {def.title}
          </Text>
          <XStack gap={2} align="center">
            {onCancel && (
              <Button
                variant="unstyled"
                onClick={onCancel}
                style={{ fontSize: "var(--fs-sm)", color: "var(--text-subtle)" }}
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={() => {
                setSettled(false);
                setEditing(false);
              }}
              disabled={!def.title.trim()}
            >
              Done
            </Button>
          </XStack>
        </XStack>
        <div
          style={{
            marginTop: "var(--space-3)",
            opacity: settled ? 1 : 0.8, // masks the two-sided morph
            transition: "opacity 150ms ease",
          }}
        >
          <WidgetConfig
            def={def}
            onChange={onChange!}
            onRemove={() => {
              setEditing(false);
              onRemove?.();
            }}
          />
          <Text variant="subtle">Preview</Text>
          <div style={{ marginTop: "var(--space-2)" }}>
            <WidgetContent def={def} invalid={invalid} isPending={isPending} error={error} rows={rows} />
          </div>
        </div>
      </Modal>
    </>
  );
}

// The status chain + body, shared by the card and the edit modal's preview.
function WidgetContent({
  def,
  invalid,
  isPending,
  error,
  rows,
}: {
  def: WidgetDef;
  invalid: string | null;
  isPending: boolean;
  error: Error | null;
  rows: Row[] | undefined;
}) {
  if (invalid) return <Text variant="warn">Invalid config: {invalid}</Text>;
  if (isPending) return <Text variant="subtle">Loading…</Text>;
  if (error) return <Text variant="error">{error.message}</Text>;
  if (rows) return <WidgetBody def={def} rows={rows} />;
  return null;
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
