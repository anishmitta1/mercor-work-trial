// Data client: the ONLY place the frontend talks to the query layer.
// QuerySpec mirrors server/types.ts — the coupling is the HTTP contract, not the code.

export type TimeGrain = "hour" | "day" | "week" | "month";

export type Filter = {
  dim: string;
  values: (string | number)[];
};

export type QuerySpec = {
  measures: string[];
  dimensions?: string[];
  timeGrain?: TimeGrain;
  filters?: Filter[];
  dateRange?: { start: string; end: string };
  orderBy?: { key: string; dir: "asc" | "desc" }[];
  limit?: number;
};

export type Row = Record<string, string | number | null>;

export type MeasureFormat = "usd" | "number" | "ms" | "percent";

export type Meta = {
  measures: { key: string; format: MeasureFormat }[];
  dimensions: string[];
  timeGrains: TimeGrain[];
};

export async function query(spec: QuerySpec): Promise<Row[]> {
  const res = await fetch("/api/query", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(spec),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "query failed");
  return body.rows;
}

export async function getMeta(): Promise<Meta> {
  const res = await fetch("/api/meta");
  return res.json();
}
