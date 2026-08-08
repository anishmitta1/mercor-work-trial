# 0006 — Layout: react-grid-layout v2, after building it ourselves first

Status: accepted · 2026-08-07

## Context

Widgets need rearrangement. We first built a custom model (rows of equal shares, max 4,
click-to-place slots). User testing found repeated placement bugs — remove-then-insert index
bookkeeping, slot visibility, full-row semantics. RGL was evaluated alongside dnd-kit and
drag-drop libraries.

## Decision

Bought react-grid-layout v2 (`useContainerWidth` hook, `gridConfig`/`dragConfig`/`resizeConfig`,
vertical compaction). Layout is serializable `[{i, x, y, w, h}]` keyed by widget id. Drag and
resize are gated to a global Rearrange mode; drag handle is a grip affordance; the whole model is
plain data so export/persistence stories survive. v2 chosen over legacy v1 API: first-class TS,
hooks; `/legacy` import remains as an escape hatch.

Custom placement code (~150 lines + tests) deleted.

## Consequences

- Collision/compaction hardening is now a decade of RGL's production use, not our tests.
- Trade accepted: users can make lopsided layouts (we lost "equal shares, max 4" as a constraint).
- Build-vs-buy rule of thumb this produced: buy when the library's model matches yours; build when
  your model is narrower than every library's assumptions. We initially built because rows were
  narrower than grid libs; we bought when bug density proved the narrowing wasn't worth it.
