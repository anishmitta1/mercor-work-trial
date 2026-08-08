// WidgetGrid: the dashboard grid — RGL layout + widget CRUD rendering.
// Pure: all state lives in useWidgetGrid; this owns only how the grid renders.
import ReactGridLayout, {
  useContainerWidth,
  verticalCompactor,
  type Layout,
} from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import { Widget, WidgetEditor } from "../widget/Widget";
import { Modal } from "../primitives/Modal";
import type { GlobalFilters } from "../utils/mergeFilters";
import type { WidgetDef } from "../widget/types";

export function WidgetGrid({
  widgets,
  layout,
  rearranging,
  filters,
  draft,
  onDraftChange,
  onDraftCommit,
  onDraftCancel,
  onLayoutChange,
  onWidgetChange,
  onWidgetRemove,
}: {
  widgets: WidgetDef[];
  layout: Layout;
  rearranging: boolean;
  filters?: GlobalFilters;
  draft?: WidgetDef | null;
  onDraftChange: (next: WidgetDef) => void;
  onDraftCommit: () => void;
  onDraftCancel: () => void;
  onLayoutChange: (layout: Layout) => void;
  onWidgetChange: (id: string, next: WidgetDef) => void;
  onWidgetRemove: (id: string) => void;
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
                  filters={filters}
                  onChange={(next) => onWidgetChange(w.id, next)}
                  onRemove={() => onWidgetRemove(w.id)}
                />
              </div>
            ))}
          </ReactGridLayout>
        )}
      </div>

      {/* the add-widget draft: a standalone editor, no card until Done */}
      <Modal
        open={!!draft}
        onOpenChange={(open) => !open && onDraftCancel()}
        title={draft?.title || "New widget"}
      >
        {draft && (
          <WidgetEditor
            def={draft}
            filters={filters}
            onChange={onDraftChange}
            onCancel={onDraftCancel}
            onDone={onDraftCommit}
          />
        )}
      </Modal>
    </>
  );
}
