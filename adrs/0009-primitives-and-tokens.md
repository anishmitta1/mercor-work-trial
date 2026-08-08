# 0009 — Primitives vs components; token-only styling

Status: accepted · 2026-08-07

## Context

The brief requires a component-library seam themed via tokens with no hard-coded colors, and asks
where the display↔data seam is drawn.

## Decision

Three tiers:

1. `lib/primitives/` — style + layout only, no data knowledge (Stack, Text, Button, ButtonGroup,
   Skeleton, Modal, DateRangePicker). Test: "could this render without knowing our dataset exists?"
2. `lib/components/` — data-aware compositions (DataTable, WidgetGrid, FilterBar, and the chart).
3. `lib/Widget.tsx` — the widget layer: spec → query → component.

All styling references `tokens.css` variables; the one exception class is third-party skins, which
bind to tokens by reference (Mantine's CSS-variable resolver, RGL placeholder overrides).

## Consequences

- Formatting is authoritative from the server: measure registry entries carry `format`
  (usd/number/ms/percent), served via `/api/meta`, rendered by `formatValue`. A new measure's
  display requires zero frontend changes.
- Dark mode is free (tokens carry both schemes).
- Adding a primitive that knows about data is a review-visible violation of the tier rule.
