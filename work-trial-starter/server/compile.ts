import type { QuerySpec } from "./types";

// Whitelists: the only names a spec may reference. Grow by adding one line.
const MEASURES: Record<string, string> = {
  cost: "SUM(cost_usd)",
  tokens: "SUM(tokens)",
};

// A dimension is a column plus an optional join needed to reach it.
type DimensionDef = { col: string; join?: string };

const DIMENSIONS: Record<string, DimensionDef> = {
  model_id: { col: "model_id" },
  provider: { col: "provider" },
  environment: { col: "environment" },
  customer_id: { col: "customer_id" },
  service_id: { col: "service_id" },
  token_type: { col: "token_type" },
  segment: { col: "c.segment", join: "JOIN customers c USING (customer_id)" },
};

function dimensionLookup(name: string): DimensionDef {
  const def = DIMENSIONS[name];
  if (!def) throw new Error(`unknown dimension: ${name}`);
  return def;
}

function measureLookup(name: string): string {
  const sql = MEASURES[name];
  if (!sql) throw new Error(`unknown measure: ${name}`);
  return sql;
}

// Time bucket expression; grain is whitelisted since it lands inside SQL
const GRAINS = new Set(["hour", "day", "week", "month"]);

function timeBucket({ timeGrain }: QuerySpec): string | null {
  if (!timeGrain) return null;
  if (!GRAINS.has(timeGrain))
    throw new Error(`unknown timeGrain: ${timeGrain}`);
  return `date_trunc('${timeGrain}', ts)`;
}

// SELECT list: dimension columns, then aliased measure columns
function getColumns(spec: QuerySpec): string[] {
  const { measures, dimensions = [] } = spec;
  const time = timeBucket(spec);
  return [
    ...(time ? [`${time} AS time`] : []),
    ...dimensions.map((d) => dimensionLookup(d).col),
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
      `${dimensionLookup(f.dim).col} IN (${f.values.map(quote).join(", ")})`,
    );
  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}

// GROUP BY clause: time bucket first (if any), then one entry per dimension
function getGroupBy(spec: QuerySpec): string {
  const { dimensions = [] } = spec;
  const parts = [
    ...(timeBucket(spec) ? ["time"] : []),
    ...dimensions.map((d) => dimensionLookup(d).col),
  ];
  return parts.length ? `GROUP BY ${parts.join(", ")}` : "";
}

// JOIN clause: demand-driven, only what the referenced dimensions declare
function getJoins({ dimensions = [], filters = [] }: QuerySpec): string {
  const referenced = [...dimensions, ...filters.map((f) => f.dim)];
  const joins = referenced.map((d) => dimensionLookup(d).join).filter(Boolean);
  return [...new Set(joins)].join(" ");
}

// ORDER BY clause; keys must be names the spec itself selected (measure/dimension/time)
function getOrderBy(spec: QuerySpec): string {
  const { measures, dimensions = [], orderBy = [] } = spec;
  if (!orderBy.length) return "";

  const selectable = new Set([...measures, ...dimensions]);
  if (spec.timeGrain) selectable.add("time");

  const parts = orderBy.map((o) => {
    if (!selectable.has(o.key)) throw new Error(`cannot order by: ${o.key}`);
    return `${o.key} ${o.dir === "asc" ? "ASC" : "DESC"}`;
  });
  return `ORDER BY ${parts.join(", ")}`;
}

// LIMIT clause, clamped to a sane ceiling
function getLimit({ limit }: QuerySpec): string {
  return limit ? `LIMIT ${Math.min(Math.trunc(limit), 10000)}` : "";
}

export function compile(spec: QuerySpec): string {
  const columns = getColumns(spec).join(", ");
  const where = getWhere(spec);
  const groupBy = getGroupBy(spec);
  const joins = getJoins(spec);
  const orderBy = getOrderBy(spec);
  const limit = getLimit(spec);

  let sql = `SELECT ${columns} FROM usage_events ${joins} ${where} ${groupBy} ${orderBy} ${limit}`;

  return sql;
}
