// DataTable: a reusable table over any row shape. All logic is TanStack Table;
// this component only owns token styling. Alignment is per-column via meta.align.
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

// ColumnMeta is declared in table-core (react-table re-exports it), so the
// augmentation must target the core package for TS to pick it up.
declare module "@tanstack/table-core" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    align?: "left" | "right";
  }
}

const cell = {
  padding: "var(--space-1) var(--space-2)",
  borderBottom: "1px solid var(--border)",
} as const;

export function DataTable<T>({
  columns,
  rows,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns: ColumnDef<T, any>[];
  rows: T[];
}) {
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "var(--fs-sm)",
      }}
    >
      <thead>
        {table.getHeaderGroups().map((hg) => (
          <tr key={hg.id}>
            {hg.headers.map((h) => (
              <th
                key={h.id}
                style={{
                  ...cell,
                  textAlign: h.column.columnDef.meta?.align ?? "left",
                  color: "var(--text-subtle)",
                  fontWeight: 500,
                }}
              >
                {flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map((r) => (
          <tr key={r.id}>
            {r.getVisibleCells().map((c) => (
              <td
                key={c.id}
                style={{
                  ...cell,
                  textAlign: c.column.columnDef.meta?.align ?? "left",
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--text)",
                }}
              >
                {flexRender(c.column.columnDef.cell, c.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
