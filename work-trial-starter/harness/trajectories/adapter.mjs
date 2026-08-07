// ADAPTER (Node) — implement each case by calling YOUR query layer, then run:
//   node harness/trajectories/run_harness.mjs
// The harness checks answers, not your API shape. See ./golden_queries.json for
// the exact definition (incl. how pass_rate and p95 are defined).
// Return a number, or null for "not implemented yet" (shows as PENDING).

export async function answer(id) {
  switch (id) {
    case "run_count_world_w_0007_june":
      return null; // TODO
    case "pass_rate_gpt5_june":
      return null; // TODO -> SUM(passed)/COUNT(*)
    case "cost_campaign_cmp_0002_last14":
      return null; // TODO
    case "errored_run_share":
      return null; // TODO -> ratio in [0,1]
    case "p95_duration_judge_prod_week":
      return null; // TODO -> nearest-rank p95
    case "avg_score_swe_bench":
      return null; // TODO -> joins trajectory_runs -> worlds.task_type
    default:
      return null;
  }
}
