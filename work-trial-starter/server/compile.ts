import type { QuerySpec, DimensionDef } from "./types";

// Whitelists: the only names a spec may reference. Grow by adding one line.
// A measure is a SQL fragment, how to display its result, and an optional
// join it requires (e.g. a price column living on a dimension table).
type MeasureDef = { sql: string; format: "usd" | "number" | "ms" | "percent"; join?: string };

const MEASURES: Record<string, MeasureDef> = {
  cost: { sql: "SUM(cost_usd)", format: "usd" },
  tokens: { sql: "SUM(tokens)", format: "number" },
  requests: { sql: "SUM(requests)", format: "number" },
  p95_latency: { sql: "QUANTILE_DISC(latency_ms, 0.95)", format: "ms" },
  unknown_share: {
    sql: "SUM(CASE WHEN attribution_status = 'unknown' THEN cost_usd END) / SUM(cost_usd)",
    format: "percent",
  },
  // tokens x the model's list price for that token type — needs the models join
  list_cost: {
    sql: "SUM(tokens * CASE token_type WHEN 'input' THEN m.input_price_per_mtok WHEN 'output' THEN m.output_price_per_mtok WHEN 'cache_read' THEN m.cache_read_price_per_mtok WHEN 'cache_write' THEN m.cache_write_price_per_mtok END / 1e6)",
    format: "usd",
    join: "JOIN models m USING (model_id)",
  },
};

const DIMENSIONS: Record<string, DimensionDef> = {
  model_id: { col: "model_id" },
  provider: { col: "provider" },
  environment: { col: "environment" },
  customer_id: { col: "customer_id" },
  service_id: { col: "service_id" },
  token_type: { col: "token_type" },
  attribution_status: { col: "attribution_status" },
  segment: { col: "c.segment", join: "JOIN customers c USING (customer_id)" },
};

function dimensionLookup(name: string): DimensionDef {
  const def = DIMENSIONS[name];
  if (!def) throw new Error(`unknown dimension: ${name}`);
  return def;
}

function measureLookup(name: string): MeasureDef {
  const def = MEASURES[name];
  if (!def) throw new Error(`unknown measure: ${name}`);
  return def;
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
    ...dimensions.map((d) => `${dimensionLookup(d).col} AS ${d}`),
    ...measures.map((m) => `${measureLookup(m).sql} AS ${m}`),
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

// JOIN clause: demand-driven, collected from everything the spec references
function getJoins({ measures, dimensions = [], filters = [] }: QuerySpec): string {
  const joins = [
    ...dimensions.map((d) => dimensionLookup(d).join),
    ...filters.map((f) => dimensionLookup(f.dim).join),
    ...measures.map((m) => measureLookup(m).join),
  ].filter(Boolean);
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

// The vocabulary a spec may use — drives the widget-config UI (GET /api/meta)
export const META = {
  measures: Object.entries(MEASURES).map(([key, m]) => ({ key, format: m.format })),
  dimensions: Object.keys(DIMENSIONS),
  timeGrains: [...GRAINS],
};

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
