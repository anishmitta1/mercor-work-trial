// Global dashboard filters — every widget's spec passes through mergeGlobalFilters.
import type { QuerySpec } from "../api/client";

export type GlobalFilters = {
  dateRange?: { start: string; end: string }; // half-open, like every range in the system
  environment?: string[]; // empty/undefined = all
};

export function mergeGlobalFilters(spec: QuerySpec, global: GlobalFilters): QuerySpec {
  return {
    ...spec,
    // global date range wins over the widget's own (it's the narrower question)
    dateRange: global.dateRange ?? spec.dateRange,
    filters: [
      ...(spec.filters ?? []),
      ...(global.environment?.length
        ? [{ dim: "environment", values: global.environment }]
        : []),
    ],
  };
}
