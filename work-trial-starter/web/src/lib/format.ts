// Authoritative value formatting. The measure's registry entry declares the format;
// this is the only place that knows what the formats mean.
import type { MeasureFormat } from "./api";

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});

export function formatValue(value: number, format: MeasureFormat): string {
  switch (format) {
    case "usd":
      return compactUsd.format(value); // $1.03M
    case "number":
      return compact.format(value); // 2.4B
    case "ms":
      return value >= 1000
        ? `${compact.format(value / 1000)}s` // 3.8s
        : `${Math.round(value)} ms`; // 158 ms
    case "percent":
      return `${(value * 100).toFixed(1)}%`; // 11.9%
  }
}
