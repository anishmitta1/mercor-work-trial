# Work Trial — Modular Analytics starter

Build a **modular, user-configurable analytics dashboard** over a provided
synthetic dataset, backed by a **flexible query layer** and a small **component
library**. Read **[`BRIEF.md`](./BRIEF.md)** for the full spec, requirements,
library-exploration ask, the Day-2 addendum, and how you'll be assessed.

## Pick one scenario

Both are self-contained; choose whichever you find more fun and build against it.

| Scenario | Dataset | The gist |
|---|---|---|
| **`llm_spend`** | `data/llm_spend/` | LLM cost/tokens/latency across services, customers, models, token-types — with an "unknown/unattributed" bucket. |
| **`trajectories`** | `data/trajectories/` | Eval runs across worlds, campaigns, models, agents — scores, pass-rate, tokens, cost, tool-calls — with an "orphaned/errored" bucket. |

You may ignore (or delete) the scenario you don't pick.

## Setup

Requires **Node ≥ 18** (frontend + Node harness). Python 3 is optional (only if
you build a Python backend and use the Python harness).

```bash
cd web
npm install
npm run dev        # http://localhost:5173 — a disposable placeholder shell
```

Data is already generated and committed as **CSV** (+ a 1k-row `*_sample.csv`).
DuckDB reads CSV directly; for Parquet or to regenerate/scale, see
`tools/to_parquet.md`. Dimension tables live in each scenario's `dimensions/`.

## The correctness harness (keep it green — it's graded)

Each scenario has golden aggregation queries with frozen answers in
`harness/<scenario>/golden_queries.json` (each entry has a precise definition +
tolerance). Implement the thin **adapter** to call *your* query layer — the
harness checks answers, not your API shape. Pick the flavor matching your stack:

```bash
# Node / TypeScript
node harness/llm_spend/run_harness.mjs           # implement harness/llm_spend/adapter.mjs
# Python
python3 harness/llm_spend/run_harness.py         # implement harness/llm_spend/adapter.py
```

`PENDING` = not implemented yet, `PASS`/`FAIL` = checked against the golden answer.
Green = every query passes.

## Layout

```
BRIEF.md                 the full brief + assessment dimensions
README.md                this file
design/                  tokens.css lives in web/; NOTES.md = the visual bar
data/<scenario>/         generate.mjs (deterministic), fact CSV + sample, dimensions/
harness/<scenario>/      golden_queries.json, adapter.(mjs|py), run_harness.(mjs|py)
web/                     minimal Vite + React + TS shell; your code under src/lib
tools/to_parquet.md      Parquet + regenerate/scale instructions
```

Have fun — the shell is disposable; the layer you design is the point.
