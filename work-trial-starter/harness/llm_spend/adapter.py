"""ADAPTER (Python) — implement each case by calling YOUR query layer, then run:
      python3 harness/llm_spend/run_harness.py

The harness checks *answers*, not your API shape. How you compute them — DuckDB,
Polars, SQLAlchemy, hand-written SQL — is entirely your call. See the exact
definition of each query in ./golden_queries.json.

Return a number (money/ratio/latency) or list[str] (the top-5 case).
Return None for anything unimplemented → shows as PENDING.
"""


def answer(qid):
    if qid == "total_cost_customer_C_00007_june":
        return None  # TODO
    if qid == "top5_models_by_output_tokens_june":
        return None  # TODO -> list[str] of model_id, most first
    if qid == "cost_trajectory_runner_spike_day":
        return None  # TODO
    if qid == "unknown_cost_share":
        return None  # TODO -> ratio in [0,1]
    if qid == "p95_latency_anthropic_prod_week":
        return None  # TODO -> nearest-rank p95 (see golden_queries.json conventions)
    if qid == "net_cost_enterprise_segment":
        return None  # TODO -> joins usage_events -> customers.segment
    return None
