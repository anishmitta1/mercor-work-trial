# Getting Parquet (optional)

The datasets ship as **CSV** (universal, and DuckDB reads it directly). Many
candidates will use DuckDB / DuckDB-WASM, which is happy with either. If you want
Parquet (smaller, columnar, faster scans), convert in one command.

### With the DuckDB CLI

```bash
duckdb -c "COPY (SELECT * FROM read_csv_auto('data/llm_spend/usage_events.csv')) TO 'data/llm_spend/usage_events.parquet' (FORMAT parquet);"
duckdb -c "COPY (SELECT * FROM read_csv_auto('data/trajectories/trajectory_runs.csv')) TO 'data/trajectories/trajectory_runs.parquet' (FORMAT parquet);"
```

### In the browser (DuckDB-WASM)

You don't need a file at all — register the CSV and query it, or `COPY` to a
Parquet buffer in-memory. `read_csv_auto` infers types; nullable columns
(`customer_id`, `service_id`, `latency_ms`, `score`, `duration_ms`) come through
as NULL for empty cells.

### Regenerate / scale the data

Both datasets are produced by a deterministic (fixed-seed) Node generator — no
dependencies:

```bash
node data/llm_spend/generate.mjs        # ~51k rows
node data/trajectories/generate.mjs     # ~28k rows
```

To stress-test at scale, bump `BASE_EVENTS` / `BASE_RUNS` (and/or `N_DAYS`) at the
top of the generator and re-run. The golden answers re-freeze from whatever you
generate, so the harness stays valid — but for grading we use the committed
default seed/size, so keep a clean copy.
