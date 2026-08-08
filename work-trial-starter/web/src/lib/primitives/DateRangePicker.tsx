// DateRangePicker primitive: Mantine Dates under our props API.
// MantineProvider is scoped HERE (theme context + token-bound vars) — the app
// outside stays Mantine-free. Mantine v9 works in ISO date strings, same as us.
import { DatePickerInput } from "@mantine/dates";
import {
  MantineProvider,
  createTheme,
  type CSSVariablesResolver,
} from "@mantine/core";
import { useState } from "react";

const theme = createTheme({
  fontFamily: "var(--font-sans)",
  defaultRadius: 6, // = --radius-sm
});

// bind Mantine's derived colors to our tokens by reference (no duplicated hex)
const mantineVars: CSSVariablesResolver = () => ({
  variables: {
    "--mantine-font-family": "var(--font-sans)",
    "--mantine-primary-color-filled": "var(--accent)",
    "--mantine-primary-color-filled-hover": "var(--accent-hover)",
    "--mantine-primary-color-light": "var(--accent-weak)",
    "--mantine-primary-color-light-hover": "var(--accent-weak)",
    "--mantine-primary-color-light-color": "var(--accent)",
    "--mantine-color-body": "var(--bg)",
    "--mantine-color-text": "var(--text)",
    "--mantine-color-default": "var(--surface)",
    "--mantine-color-default-hover": "var(--surface-2)",
    "--mantine-color-default-border": "var(--border)",
    "--mantine-color-default-color": "var(--text)",
  },
  light: {},
  dark: {},
});

export function DateRangePicker({
  start,
  end,
  min,
  max,
  onChange,
}: {
  start?: string; // ISO date (inclusive)
  end?: string; // ISO date (exclusive, like every range in the system)
  min: string;
  max: string;
  onChange: (range: { start: string; end: string }) => void;
}) {
  // in-progress range lives here until both ends are picked, then commits
  const [draft, setDraft] = useState<[string | null, string | null]>([
    null,
    null,
  ]);
  const picking = draft[0] !== null;

  // calendar ranges are inclusive; the query layer wants exclusive end (+1 day)
  const dayAfter = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  };
  const dayBefore = (iso: string) => {
    const d = new Date(`${iso}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
  };
  const commit = (s: string, e: string) => {
    onChange({ start: s, end: dayAfter(e) });
    setDraft([null, null]);
  };

  return (
    <MantineProvider
      theme={theme}
      cssVariablesResolver={mantineVars}
      defaultColorScheme="auto"
    >
      <DatePickerInput
        type="range"
        size="xs"
        firstDayOfWeek={0} // Sunday-first
        value={picking ? draft : [start ?? null, end ? dayBefore(end) : null]}
        onChange={([s, e]) => {
          if (s && s === draft[0])
            commit(s, s); // second click on same day = single-day range
          else if (!s && !e && draft[0])
            commit(draft[0], draft[0]); // Mantine deselects on same-day click
          else if (s && e) commit(s, e);
          else setDraft([s, e]);
        }}
        minDate={min}
        maxDate={max}
        valueFormat="YYYY-MM-DD"
        placeholder="Pick a range"
        clearable={false}
      />
    </MantineProvider>
  );
}
