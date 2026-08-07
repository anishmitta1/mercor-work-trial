// Meta (measures/dimensions/grains + formats) — fetched once, cached forever per session.
import { useQuery } from "@tanstack/react-query";
import { getMeta, type MeasureFormat } from "./api";

export function useMeta() {
  return useQuery({ queryKey: ["meta"], queryFn: getMeta, staleTime: Infinity });
}

export function useMeasureFormat(key: string): MeasureFormat {
  const { data } = useMeta();
  return data?.measures.find((m) => m.key === key)?.format ?? "number";
}
