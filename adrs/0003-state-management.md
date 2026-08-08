# 0003 — TanStack Query for server state; no client-state store

Status: accepted · 2026-08-07

## Context

Widgets fetch via POST /api/query. Need caching/dedup/refetch; dashboard config needs client state.

## Decision

- Server state: TanStack Query, keyed structurally by the serialized QuerySpec — identical specs
  share one cache entry; global-filter changes are just key changes.
- Client state: React `useState` (`useWidgetGrid` hook owns widgets/layout/editing/filters).
  No zustand/redux yet.

## Consequences

- Because specs are plain serializable data, cache keys are free and correct — the QuerySpec
  contract paying off again.
- Store adoption trigger is defined: cross-filtering (selections reaching distant widgets) or
  deep prop threading. The hook's return value already matches WidgetGrid's props, so a store
  swap later is mechanical.
