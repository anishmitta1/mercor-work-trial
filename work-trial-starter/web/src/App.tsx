/*
 * Placeholder shell — replace with your dashboard.
 * It exists only so `npm run dev` renders something and to demonstrate that
 * styling comes from tokens (no hard-coded colors). Delete it all if you like.
 * Your query layer + component library belong under src/lib (see its README).
 */
export function App() {
  return (
    <main
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "var(--space-8) var(--space-5)",
      }}
    >
      <p
        style={{
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          fontSize: "var(--fs-xs)",
          color: "var(--text-subtle)",
          margin: 0,
        }}
      >
        Work Trial
      </p>
      <h1 style={{ fontSize: "var(--fs-2xl)", margin: "var(--space-2) 0 var(--space-3)" }}>
        Modular Analytics
      </h1>
      <p style={{ color: "var(--text-muted)", lineHeight: 1.6, marginTop: 0 }}>
        Pick a scenario (<code>llm_spend</code> or <code>trajectories</code>), then build a
        user-configurable dashboard over its dataset, backed by a flexible query layer.
        See the root <code>README.md</code> and the brief. This shell is disposable — the
        interesting layer is yours to design.
      </p>
      <div
        style={{
          marginTop: "var(--space-5)",
          padding: "var(--space-4)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <strong style={{ fontSize: "var(--fs-sm)" }}>Next steps</strong>
        <ol style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 0 }}>
          <li>Load the dataset (CSV in <code>../data</code>, or Parquet — see <code>tools/to_parquet.md</code>).</li>
          <li>Design your query layer; keep the golden-query harness green.</li>
          <li>Build primitives in <code>src/lib</code>, then compose widgets from them.</li>
        </ol>
      </div>
    </main>
  );
}
