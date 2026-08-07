# Correctness harness

An objective check on your **query layer** — treat it like a test suite you keep
green. It's independent of your API design: you implement a thin **adapter** that
answers a fixed set of questions by calling your own code, and the runner compares
to frozen golden answers.

Per scenario (`llm_spend`, `trajectories`):

- `golden_queries.json` — the questions. Each entry: `id`, human-readable
  `question`, a precise `definition` (exact filters, date semantics, percentile
  method), `result_type` (`number` or `string[]`), the frozen `expected`, and a
  `tolerance_abs`. Read `conventions` at the top — **all timestamps are UTC and
  date ranges are half-open `[start, end)`**; `p95` is nearest-rank.
- `adapter.mjs` / `adapter.py` — **you implement these.** Return a number or
  `string[]`; return `null` for anything not done yet (→ `PENDING`).
- `run_harness.mjs` / `run_harness.py` — the runner. Green = all `PASS`.

```bash
node    harness/llm_spend/run_harness.mjs
python3 harness/llm_spend/run_harness.py
```

You only need the flavor that matches your backend language. TypeScript users:
implement `adapter.mjs` (import your compiled/`tsx` query code, or compute inline).

> Implement the adapter by *calling your query layer*, not by pasting the expected
> numbers. Graders read the adapter and your query code, and the panel will ask
> you to run it live.
