# Design notes — the visual bar

North star: **Mercor** — calm, neutral, information-dense but uncluttered.
Polish through restraint, not decoration. Look at [mercor.com](https://www.mercor.com).

- **Neutrals + one accent.** The palette in `web/src/styles/tokens.css` is
  intentionally quiet. Let the data carry the color; use the accent sparingly
  (selection, focus, the one number that matters).
- **No hard-coded colors in components.** Reference `var(--…)` tokens only. This
  is a real rule on the team — we look for it. Add tokens rather than literals.
- **Honest data density.** Numbers should be a pleasure to scan: right-aligned,
  consistent precision, thousands separators, compact units ($1.03M, 158 ms).
- **Hierarchy + whitespace.** Generous spacing, clear type scale, restrained
  borders/shadows. One primary action per surface.
- **Every state designed.** Loading, empty, and error states are part of the
  product, not afterthoughts.

We grade taste and consistency, not pixel-perfection. Does it read as *one system*?
