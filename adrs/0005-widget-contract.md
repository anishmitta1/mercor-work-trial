# 0005 — Widget contract: type + title + spec; the dashboard is data

Status: accepted · 2026-08-07

## Context

Need a modular view layer where users configure widgets and the panel can extend them live.

## Decision

A widget is `{ id, type, title, spec: QuerySpec }` — nothing else. Position lives separately in
RGL's `layout[]` (keyed by id). The default dashboard is a curated JS array (`dashboard.ts`), not
a fallback. Each widget type declares the row shape it expects via `validateWidget` (kpi: 1 measure,
no grouping; series: timeGrain; table: ≥1 dimension), enforced before any query fires. Global
filters merge into every widget's spec through one function (`mergeGlobalFilters`) at one call
site, so coherence is structural.

## Consequences

- New widget type = one case in the renderer switch + one validation rule.
- Edit mode renders/mutates the config; export/import is `JSON.stringify`/`parse` of the blob.
- localStorage persistence deliberately cut: the exportable blob is the shareable artifact.
- Widget config dropdowns are fed by `/api/meta` — the UI vocabulary can never drift from the
  query layer.
