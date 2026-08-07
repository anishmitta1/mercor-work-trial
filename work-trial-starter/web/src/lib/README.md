# `src/lib` — your foundational layer

This empty folder is a hint, not a constraint. It's where the parts we care most
about usually live:

- **Query layer** — the one place that turns a request (dimensions × measures ×
  filters × time grain) into results, over DuckDB-WASM / a backend endpoint / an
  in-memory engine. The rest of the app should not aggregate raw rows itself.
- **Component library** — the small set of reusable primitives (your design
  system) that widgets are composed from. Token-driven, no hard-coded colors.
- **Widget / module layer** — how a widget declares what data it needs and how
  the system renders and configures it.

Structure it however you'll defend in the presentation. Name things well — we
read the seams.
