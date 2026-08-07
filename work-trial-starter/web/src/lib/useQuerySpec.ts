// One hook for all widget data: spec in, rows + status out.
// TanStack Query keys structurally on the spec, so identical specs share a cache entry.
import { useQuery } from "@tanstack/react-query";
import { query, type QuerySpec } from "./api";

export function useQuerySpec(spec: QuerySpec, enabled = true) {
  return useQuery({
    queryKey: ["query", spec],
    queryFn: () => query(spec),
    enabled,
  });
}
