// Thin adapter: golden id -> QuerySpec -> OUR query layer (no SQL, no pasted numbers).
import { runQuery } from "../../server/query.ts";
import { compile } from "../../server/compile.ts";

const JUNE = { start: "2026-06-01T00:00:00Z", end: "2026-07-01T00:00:00Z" };

const SPECS = {
  total_cost_customer_C_00007_june: {
    measures: ["cost"],
    filters: [{ dim: "customer_id", values: ["C_00007"] }],
    dateRange: JUNE,
  },
  top5_models_by_output_tokens_june: {
    measures: ["tokens"],
    dimensions: ["model_id"],
    filters: [{ dim: "token_type", values: ["output"] }],
    dateRange: JUNE,
    orderBy: [
      { key: "tokens", dir: "desc" },
      { key: "model_id", dir: "asc" },
    ],
    limit: 5,
  },
  cost_trajectory_runner_spike_day: {
    measures: ["cost"],
    filters: [{ dim: "service_id", values: ["svc_trajectory_runner"] }],
    dateRange: { start: "2026-06-20T00:00:00Z", end: "2026-06-21T00:00:00Z" },
  },
  unknown_cost_share: { measures: ["unknown_share"] },
  p95_latency_anthropic_prod_week: {
    measures: ["p95_latency"],
    filters: [
      { dim: "provider", values: ["anthropic"] },
      { dim: "environment", values: ["prod"] },
    ],
    dateRange: { start: "2026-06-08T00:00:00Z", end: "2026-06-15T00:00:00Z" },
  },
  net_cost_enterprise_segment: {
    measures: ["cost"],
    filters: [{ dim: "segment", values: ["enterprise"] }],
  },
};

export async function answer(id) {
  switch (id) {
    case "top5_models_by_output_tokens_june": {
      const rows = await runQuery(compile(SPECS[id]));
      return rows.map((r) => r.model_id); // string[]: the ordered top-5
    }
    case "total_cost_customer_C_00007_june":
    case "cost_trajectory_runner_spike_day":
    case "unknown_cost_share":
    case "p95_latency_anthropic_prod_week":
    case "net_cost_enterprise_segment": {
      const rows = await runQuery(compile(SPECS[id]));
      return Object.values(rows[0])[0]; // scalar: the single measure value
    }
    default:
      return null; // not implemented -> PENDING
  }
}
