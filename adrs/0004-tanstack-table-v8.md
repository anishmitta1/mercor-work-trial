# 0004 — TanStack Table v8 (headless) for the grid

Status: accepted · 2026-08-07

## Context

Breakdown table needed. Candidates: AG Grid (batteries-included), Glide (canvas, huge data),
TanStack Table (headless). TanStack v9.0/9.1 released the same week as this build with a rewritten,
unfamiliar API.

## Decision

TanStack Table v8. Headless: we own the markup, so the tokens rule (no hard-coded colors) costs
zero. v8 pinned over v9 because v9 was days old with thin docs; v8's API is battle-tested.
`ColumnMeta` module augmentation (targeting `@tanstack/table-core`, where the interface is
actually declared) carries per-column alignment.

## Consequences

- Sorting/grouping/virtualization later = adding row models, not rewrites.
- AG Grid rejected: its theming fights the token system and we don't need pivoting yet.
- Revisit v9 when it stabilizes if we want its features.
