// WidgetGrid: the dashboard grid — RGL layout + widget CRUD rendering.
// Pure: all state lives in App; this owns only how the grid renders.
import ReactGridLayout, {
  useContainerWidth,
  verticalCompactor,
  type Layout,
} from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { Widget } from "../Widget";
import { Button } from "../primitives/Button";
import type { WidgetDef } from "../types";

export function WidgetGrid({
  widgets,
  layout,
  rearranging,
  autoEditId,
  onLayoutChange,
  onWidgetChange,
  onWidgetRemove,
  onAddWidget,
}: {
  widgets: WidgetDef[];
  layout: Layout;
  rearranging: boolean;
  autoEditId?: string | null;
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
            dragConfig={{ enabled: rearranging, handle: ".widget-drag-handle" }}
            resizeConfig={{ enabled: rearranging, handles: ["se", "sw", "ne", "nw"] }}
            compactor={verticalCompactor}
          >
            {widgets.map((w) => (
              <div key={w.id}>
                <Widget
                  def={w}
                  rearranging={rearranging}
                  startEditing={w.id === autoEditId}
                  onCancel={w.id === autoEditId ? () => onWidgetRemove(w.id) : undefined}
                  onChange={(next) => onWidgetChange(w.id, next)}
                  onRemove={() => onWidgetRemove(w.id)}
                />
              </div>
            ))}
          </ReactGridLayout>
        )}
      </div>

      <Button variant="dashed" onClick={onAddWidget}>
        + Add widget
      </Button>
    </>
  );
}
