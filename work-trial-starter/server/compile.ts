import type { QuerySpec } from "./types";

// Whitelists: the only names a spec may reference. Grow by adding one line.
const MEASURES: Record<string, string> = {
  cost: "SUM(cost_usd)",
  tokens: "SUM(tokens)",
};

const DIMENSIONS: Record<string, string> = {
  model_id: "model_id",
  provider: "provider",
  environment: "environment",
};

function dimensionLookup(name: string): string {
  const sql = DIMENSIONS[name];
  if (!sql) throw new Error(`unknown dimension: ${name}`);
  return sql;
}

function measureLookup(name: string): string {
  const sql = MEASURES[name];
  if (!sql) throw new Error(`unknown measure: ${name}`);
  return sql;
}

// SELECT list: dimension columns, then aliased measure columns
function getColumns({ measures, dimensions = [] }: QuerySpec): string[] {
  return [
    ...dimensions.map(dimensionLookup),
    ...measures.map((m) => `${measureLookup(m)} AS ${m}`),
  ];
}

export function compile(spec: QuerySpec): string {
  const dimensions = spec.dimensions ?? [];
  const columns = getColumns(spec).join(", ");
  const groupBy = !dimensions.length
    ? ""
    : `GROUP BY ${dimensions.map(dimensionLookup).join(", ")}`;

  let sql = `SELECT ${columns} FROM usage_events ${groupBy}`;

  return sql;
}
