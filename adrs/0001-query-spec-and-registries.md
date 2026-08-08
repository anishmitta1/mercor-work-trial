# 0001 — Declarative QuerySpec + registries as the data-access layer

Status: accepted · 2026-08-07

## Context

Widgets, the golden-query harness, and future features all need aggregation answers over the
llm_spend dataset. Hand-written SQL per question can't absorb new dimensions/measures without
reopening code — the brief's core test.

## Decision

All data access goes through a single declarative contract: `QuerySpec` (measures, dimensions,
timeGrain, filters, dateRange, orderBy, limit). A compiler (`server/compile.ts`) turns specs into
SQL via two registries:

- `MEASURES`: name → `{ sql, format, join? }`
- `DIMENSIONS`: name → `{ col, join? }`

Registries are the only place physical schema knowledge lives, double as a SQL-injection whitelist,
and self-describe via `GET /api/meta` (drives the widget-config UI). Joins are demand-driven:
collected from whatever the spec references (dimensions, filters, and measures). Rows come back
aliased to logical names (`AS cost`), so consumers never see physical expressions.

## Consequences

- New dimension/measure = one registry line. The Day-2 addendum (token_type + caching savings)
  requires no compiler changes.
- The golden-query harness calls `compile` + `runQuery` directly — correctness is tested through
  the real layer, not a side path.
- Non-additive measures (p95, ratios) are always computed from raw rows by the engine, never from
  pre-aggregated widget results.
- Deliberately deferred: comparison operators, NULL matching, exclusion filters, HAVING. All are
  additive (`Filter.op`, one branch in `getWhere`), not structural.
