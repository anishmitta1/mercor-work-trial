// WidgetGrid: the dashboard grid — RGL layout + widget CRUD rendering.
// Pure: all state lives in App; this owns only how the grid renders.
import ReactGridLayout, {
  useContainerWidth,
  verticalCompactor,
  type Layout,
} from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { Widget } from "../Widget";
import type { WidgetDef } from "../types";

export function WidgetGrid({
  widgets,
  layout,
  editing,
  onLayoutChange,
  onWidgetChange,
  onWidgetRemove,
  onAddWidget,
}: {
  widgets: WidgetDef[];
  layout: Layout;
  editing: boolean;
  onLayoutChange: (layout: Layout) => void;
  onWidgetChange: (id: string, next: WidgetDef) => void;
  onWidgetRemove: (id: string) => void;
  onAddWidget: () => void;
}) {
  const { width, containerRef, mounted } = useContainerWidth();

  return (
    <>
      <div ref={containerRef}>
        {mounted && (
          <ReactGridLayout
            width={width}
            layout={layout}
            onLayoutChange={onLayoutChange}
            gridConfig={{ cols: 12, rowHeight: 80, margin: [16, 16], containerPadding: [0, 0] }}
            dragConfig={{ enabled: editing, cancel: "input, select, button" }}
            resizeConfig={{ enabled: editing, handles: ["se", "sw", "ne", "nw"] }}
            compactor={verticalCompactor}
          >
            {widgets.map((w) => (
              <div key={w.id}>
                <Widget
                  def={w}
                  editing={editing}
                  onChange={(next) => onWidgetChange(w.id, next)}
                  onRemove={() => onWidgetRemove(w.id)}
                />
              </div>
            ))}
          </ReactGridLayout>
        )}
      </div>

      {editing && (
        <button
          onClick={onAddWidget}
          style={{
            font: "inherit",
            fontSize: "var(--fs-sm)",
            color: "var(--text-subtle)",
            background: "none",
            border: "1px dashed var(--border-strong)",
            borderRadius: "var(--radius)",
            padding: "var(--space-3)",
            cursor: "pointer",
          }}
        >
          + Add widget
        </button>
      )}
    </>
  );
}
