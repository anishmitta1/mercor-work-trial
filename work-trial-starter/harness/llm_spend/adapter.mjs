// ADAPTER (Node) — implement each case by calling YOUR query layer, then run:
//   node harness/llm_spend/run_harness.mjs
//
// The harness checks *answers*, not your API shape. How you compute them —
// DuckDB-WASM, a server endpoint, an in-memory engine — is entirely your call.
// Read the exact definition of each query in ./golden_queries.json.
//
// Return a number (money/ratio/latency) or string[] (the top-5 case).
// Returning null = "not implemented yet" → shows as PENDING.

export async function answer(id) {
  switch (id) {
    case "total_cost_customer_C_00007_june":
      return null; // TODO
    case "top5_models_by_output_tokens_june":
      return null; // TODO → string[] of model_id, most first
    case "cost_trajectory_runner_spike_day":
      return null; // TODO
    case "unknown_cost_share":
      return null; // TODO → ratio in [0,1]
    case "p95_latency_anthropic_prod_week":
      return null; // TODO → nearest-rank p95 (see golden_queries.json conventions)
    case "net_cost_enterprise_segment":
      return null; // TODO → joins usage_events → customers.segment
    default:
      return null;
  }
}
