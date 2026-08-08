# 0002 — DuckDB server-side, not DuckDB-WASM

Status: accepted · 2026-08-07

## Context

Aggregation engine choice: DuckDB-WASM in the browser, or DuckDB in a small Node server.

## Decision

Node server (`server/`), DuckDB in-memory instance with CSV-backed views (`read_csv_auto`,
`nullstr=''` so empty CSV fields become real NULLs). Client is `@duckdb/node-api` (the current
promise-native official client), not the legacy callback-based `duckdb` package.

## Consequences

- The golden-query harness imports `server/query.ts` directly (Node ≥23.6 type-stripping) — no
  server needed for grading.
- Scale story: at millions of rows the server keeps aggregating in ms; next levers are Parquet
  (one command) then generated rollup tables. WASM would have meant shipping data to the browser.
- Frontend stays pure display; the display↔data seam is an HTTP boundary.
- Tradeoff accepted: requires the dev server running; WASM would have made the app serverless.
