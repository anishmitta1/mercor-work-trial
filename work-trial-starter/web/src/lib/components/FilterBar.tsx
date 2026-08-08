// FilterBar: global filters every widget responds to.
// Presets are relative to the dataset's end (2026-07-01, exclusive) — see data README.
import { ButtonGroup } from "../primitives/ButtonGroup";
import { DateRangePicker } from "../primitives/DateRangePicker";
import { XStack } from "../primitives/Stack";
import { Text } from "../primitives/Text";
import type { GlobalFilters } from "../utils/mergeFilters";

const DATASET_END = "2026-07-01"; // exclusive
const DATASET_START = "2026-05-17";

const PRESETS = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "All", label: "All" },
];

const ENVIRONMENTS = ["prod", "staging", "dev"].map((v) => ({ value: v, label: v }));

function daysAgoISO(days: number): string {
  const d = new Date(`${DATASET_END}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function FilterBar({
  filters,
  onChange,
}: {
  filters: GlobalFilters;
  onChange: (next: GlobalFilters) => void;
}) {
  const activePreset = PRESETS.find((p) =>
    p.value === "All" ? !filters.dateRange : filters.dateRange?.start === daysAgoISO(Number(p.value.slice(0, -1))),
  )?.value;

  const setPreset = (value: string) =>
    onChange({
      ...filters,
      dateRange:
        value === "All"
          ? undefined
          : { start: daysAgoISO(Number(value.slice(0, -1))), end: DATASET_END },
    });

  const toggleEnv = (env: string) => {
    const current = filters.environment ?? [];
    onChange({
      ...filters,
      environment: current.includes(env)
        ? current.filter((e) => e !== env)
        : [...current, env],
    });
  };

  return (
    <XStack gap={4} align="center" style={{ flexWrap: "wrap" }}>
      <XStack gap={2} align="center">
        <Text variant="subtle">Range</Text>
        <ButtonGroup
          options={PRESETS}
          selected={activePreset ? [activePreset] : []}
          onToggle={setPreset}
        />
        <DateRangePicker
          start={filters.dateRange?.start}
          end={filters.dateRange?.end}
          min={DATASET_START}
          max={DATASET_END}
          onChange={(dateRange) => onChange({ ...filters, dateRange })}
        />
      </XStack>

      <XStack gap={2} align="center">
        <Text variant="subtle">Environment</Text>
        <ButtonGroup
          options={ENVIRONMENTS}
          selected={filters.environment ?? []}
          onToggle={toggleEnv}
        />
      </XStack>
    </XStack>
  );
}
