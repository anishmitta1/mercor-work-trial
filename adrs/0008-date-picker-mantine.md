# 0008 — Date picking: Mantine Dates, scoped inside one primitive

Status: accepted · 2026-08-07

## Context

The filter bar needed a range date picker. Evaluated:

- **react-day-picker** (shadcn's engine): headless; our hand-ported shadcn skin was unfaithful
  and integration details broke (ref forwarding, focus).
- **react-aria-components RangeCalendar**: headless, highly customizable; its defaults opened on
  the real current month — entirely outside the dataset, so every visible day was unavailable.
  Fixable, but it proved the pattern wrong: headless engines + hand-ported skins kept leaking.
- **Mantine Dates**: ships polished UX out of the box.

## Decision

Mantine `DatePickerInput type="range"`, wrapped in our `DateRangePicker` primitive with the same
props API the filter bar already used. `MantineProvider` is scoped inside the primitive (the app
stays Mantine-free); Mantine's derived colors bind to our design tokens by reference via
`cssVariablesResolver` (no duplicated hex). `defaultColorScheme="auto"` matches our tokens' media
query. Mantine v9 speaks ISO date strings natively (no dayjs bridging). Weekend-red default
overridden to neutral; Sunday-first.

## Consequences

- Range semantics: calendar is inclusive, query layer is exclusive — the primitive translates at
  its edges (+1 day on commit, −1 on display). Single-day = click the same date twice (Mantine's
  deselect event commits the remembered start). Verified against Mantine's use-dates-state source.
- react-day-picker, react-aria-components, @internationalized/date, dayjs all pruned.
- Lesson encoded: don't hand-port skins onto headless engines when a batteries-included library
  exists; scope foreign design systems inside primitives.
