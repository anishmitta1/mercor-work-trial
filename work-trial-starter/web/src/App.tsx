import { Widget, type WidgetDef } from "./lib/Widget";

const widgets: WidgetDef[] = [
  {
    type: "kpi",
    title: "Total spend",
    spec: { measures: ["cost"] },
  },
  {
    type: "series",
    title: "Spend over time",
    spec: {
      measures: ["cost"],
      timeGrain: "day",
      orderBy: [{ key: "time", dir: "asc" }],
    },
  },
  {
    type: "table",
    title: "Cost by model",
    spec: {
      measures: ["cost"],
      dimensions: ["model_id"],
      orderBy: [{ key: "cost", dir: "asc" }],
    },
  },
];

export function App() {
  return (
    <main
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "var(--space-8) var(--space-5)",
        display: "grid",
        gap: "var(--space-4)",
      }}
    >
      {widgets.map((w) => (
        <Widget key={w.title} def={w} />
      ))}
    </main>
  );
}
