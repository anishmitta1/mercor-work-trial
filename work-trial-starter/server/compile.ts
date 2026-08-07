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
  customer_id: "customer_id",
  service_id: "service_id",
  token_type: "token_type",
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

// WHERE clause: half-open date range, then dimension filters
function getWhere({ filters = [], dateRange }: QuerySpec): string {
  const quote = (v: string | number) =>
    typeof v === "number" ? String(v) : `'${v.replaceAll("'", "''")}'`;

  const clauses: string[] = [];
  if (dateRange)
    clauses.push(
      `ts >= ${quote(dateRange.start)}`,
      `ts < ${quote(dateRange.end)}`,
    );
  for (const f of filters)
    clauses.push(
      `${dimensionLookup(f.dim)} IN (${f.values.map(quote).join(", ")})`,
    );
  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

export function compile(spec: QuerySpec): string {
  const columns = getColumns(spec).join(", ");
  const where = getWhere(spec);
  const groupBy = !spec.dimensions?.length
    ? ""
    : `GROUP BY ${spec.dimensions.map(dimensionLookup).join(", ")}`;

  // ORDER BY keys must be names the spec itself selected (measure or dimension)
  const selectable = new Set([...spec.measures, ...(spec.dimensions ?? [])]);
  const orderBy = !spec.orderBy?.length
    ? ""
    : `ORDER BY ${spec.orderBy
        .map((o) => {
          if (!selectable.has(o.key)) throw new Error(`cannot order by: ${o.key}`);
          return `${o.key} ${o.dir === "asc" ? "ASC" : "DESC"}`;
        })
        .join(", ")}`;

  const limit = spec.limit ? `LIMIT ${Math.min(Math.trunc(spec.limit), 10000)}` : "";

  let sql = `SELECT ${columns} FROM usage_events ${where} ${groupBy} ${orderBy} ${limit}`;

  return sql;
}
