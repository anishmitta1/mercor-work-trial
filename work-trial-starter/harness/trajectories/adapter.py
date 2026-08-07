"""ADAPTER (Python) — implement each case by calling YOUR query layer, then run:
      python3 harness/trajectories/run_harness.py
See ./golden_queries.json for the exact definition of each query
(incl. how pass_rate and p95 are defined). Return a number, or None (PENDING).
"""


def answer(qid):
    if qid == "run_count_world_w_0007_june":
        return None  # TODO
    if qid == "pass_rate_gpt5_june":
        return None  # TODO -> SUM(passed)/COUNT(*)
    if qid == "cost_campaign_cmp_0002_last14":
        return None  # TODO
    if qid == "errored_run_share":
        return None  # TODO -> ratio in [0,1]
    if qid == "p95_duration_judge_prod_week":
        return None  # TODO -> nearest-rank p95
    if qid == "avg_score_swe_bench":
        return None  # TODO -> joins trajectory_runs -> worlds.task_type
    return None
