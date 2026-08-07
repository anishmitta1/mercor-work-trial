# Work Trial — Modular Analytics

**Role:** Fullstack Engineer, RL Environments (Studio Experience)
**Format:** Two-day asynchronous build, in your own AI-enabled environment, on Litmus
**Ends with:** A 30–60 minute presentation to a small engineering panel

---

## 0. TL;DR

Build a **modular, user-configurable analytics dashboard** over one of two provided
**synthetic datasets** (you pick), backed by a **flexible query/aggregation layer**
and a small **frontend component library**. Make it feel like a real Mercor product.
Then present your design decisions to a panel and extend your own work live.

We are not primarily grading how many features you ship. We're grading **the quality
of your abstractions**: the component library, the modular view layer, and the
data-access patterns — the parts that decide whether this can absorb *new data types
and new questions without a rewrite*. **Use AI freely; build things you understand
and can defend.**

---

## 1. Pick a scenario

Both live in this repo, are structurally parallel, and are graded the same way.
Choose the one you find more fun; ignore the other. Full schema for each is in
`data/<scenario>/README.md`.

- **`llm_spend`** — LLM cost / tokens / latency across **consuming services,
  customers, models, providers, token-types, environments**. Fact table
  `usage_events` + `services` / `customers` / `models` dimensions. Has an
  **"unknown / unattributed"** bucket (spend we can't yet tie to a customer or
  service) that finance wants to watch shrink.

- **`trajectories`** — eval-run telemetry across **worlds, campaigns, models,
  agents, task-types, verifiers**: scores, pass-rate, tokens, cost, latency,
  tool-calls. Fact table `trajectory_runs` + `worlds` / `campaigns` / `models` /
  `verifiers` dimensions. Has an **"orphaned / errored"** bucket that platform
  wants to catch.

Both share the shape we care about: a fact table + dimensions, a genuine
**join**, a **non-additive measure** (`p95 latency` / `pass_rate`), a **time
series** with weekly seasonality and one **spike/anomaly day**, and messy reality
(nulls, credits/errors, an unattributed bucket). Your dashboard should make these
legible and sliceable.

The mission mirrors the actual team mandate: build the **foundational analytics
layer** that turns one-off charts into something people can **configure to their
own question**, over a query layer general enough to answer questions we haven't
thought of yet — *support new dimensions and data types without rework.*

---

## 2. What's in this repo

```
BRIEF.md                 this brief
README.md                setup + how to pick a scenario + run the harness
design/NOTES.md          the visual bar we like  (tokens live in web/src/styles/tokens.css)
data/<scenario>/
  generate.mjs           deterministic (fixed-seed) generator — zero deps
  <fact>.csv             the dataset (already generated & committed)
  <fact>_sample.csv      first 1,000 rows, human-readable
  dimensions/*.csv       dimension tables
  README.md              full schema + the planted "warts"
harness/<scenario>/
  golden_queries.json    aggregation questions with frozen answers + exact definitions
  adapter.(mjs|py)       YOU implement — answer each question via your query layer
  run_harness.(mjs|py)   the runner; green = all correct
web/                     minimal Vite + React + TS shell; your code goes under src/lib
tools/to_parquet.md      optional Parquet + how to regenerate/scale the data
```

Data ships as **CSV** (DuckDB reads it directly; Parquet is one command away —
`tools/to_parquet.md`). The generators are deterministic and **scalable**: bump
`BASE_EVENTS` / `BASE_RUNS` / `N_DAYS` and re-run to stress-test at millions of
rows (golden answers re-freeze automatically). Keep a clean copy at the default
seed — that's what we grade against.

You may keep, replace, or ignore any scaffolding **except** the dataset schema and
the golden-query harness contract (§7).

---

## 3. Core requirements (MUST — aim to complete on day one)

1. **Query layer.** A data-access layer that answers aggregation questions over
   your chosen dataset with, at minimum:
   - group by **≥ 2 dimensions** (e.g. service/model/surface/provider/environment/
     segment/task-type + a time bucket),
   - **≥ 2 measures**, including a **non-additive** one (`sum(cost)`, `sum(tokens)`
     and `p95 latency` for `llm_spend`; `count`, `sum(cost)` and `pass_rate` for
     `trajectories`),
   - **time bucketing** (hour / day / week / month), and
   - **filters** across dimensions and a **date range**.
   How you build it (in-browser DuckDB, a server API, an ORM, hand-written SQL) is
   your decision to defend. It must pass the golden-query harness (§7).

2. **Modular dashboard view** with at least **three widget types** driven by the
   query layer — e.g. a **time-series chart**, a **breakdown table/grid**, and a
   **KPI/stat** tile — composed from **reusable primitives**, not one-off code.

3. **Global filtering.** At least a **date range** + **one dimension filter** that
   all widgets respond to coherently.

4. **A component-library seam.** Widgets composed from a small set of documented,
   reusable UI primitives (your design-system layer), themed via tokens — **no
   hard-coded colors** (see §6).

5. **A README + a short ADR** (~1 page) covering (a) which of **AG Grid /
   TanStack Table + Query / Glide Data Grid / Mosaic / DuckDB(-WASM)** you
   evaluated and what you chose for what and **why** (§4); and (b) **where the seam
   is between "display" and "data"** and why you drew it there.

---

## 4. Library exploration (required, and we will ask about it)

Making and defending build-vs-buy / abstraction calls is core to this role.
**Evaluate** these and choose deliberately — you will **not** use all of them, and
you may bring others:

| Library | The kind of job it's good at |
|---|---|
| **AG Grid** | Batteries-included enterprise grid (grouping, aggregation, pivoting, virtualization) |
| **TanStack Table** | *Headless* table logic — you own the markup |
| **TanStack Query** | Server-state: fetching, caching, invalidation for your query API |
| **Glide Data Grid** | Canvas-rendered grid for very large / high-frequency data |
| **Mosaic** | Declarative linked / cross-filtered views backed by DuckDB, at scale |
| **DuckDB / DuckDB-WASM** | In-process OLAP SQL engine — analytical queries in Node or the browser |

In the ADR, tell us **what you picked for the grid/table, for data access/state,
and for aggregation, and the tradeoffs** (bundle size, control vs. speed, scale
ceiling, ergonomics, seam fit). A thin, well-justified stack beats a maximal one.

---

## 5. Stretch goals (SHOULD → STRETCH — where you differentiate)

Depth on a few beats breadth on all. Roughly by signal:

**A. User-configurable layout (high value).** Add / remove / rearrange / configure
widgets — pick a widget's dimensions, measures, grain, filters — and **persist the
layout across reload** (ideally exportable/importable as a config blob). Think hard
about the **widget contract**: what does a widget declare about the data it needs,
and how does the system satisfy it?

**B. The Day-2 addendum (§5.1).** A representative "requirements changed" task.

**C. Drill-down.** Click an aggregate (bar/cell) → the underlying rows behind it.

**D. The "unknown" problem.** Make the unattributed/orphaned bucket **first-class
and visible** — its share over time — and ideally a simple, configurable
**re-attribution rule** that reclassifies it live. (Product + data-modeling probe.)

**E. Cross-filtering / linked views.** Selecting in one widget filters the others.

**F. Scale.** Regenerate the dataset large and keep interactions fast (server-side
aggregation, DuckDB, virtualization). Be ready to say where it breaks next.

**G. Surprise us.** One genuinely thoughtful feature/interaction that shows product
taste. We'd rather see your idea than a checkbox.

### 5.1 Day-2 addendum (read after you've hit the MUSTs)

> **A new requirement landed.** Do as much as time allows — what we'll actually
> discuss is **how much of your existing code had to change** to add a new
> dimension + a derived measure (i.e., whether your query layer and widget contract
> were built to extend, or had to be reopened).

- **`llm_spend`:** *We're now spending real money on prompt caching.* Add a
  breakdown/comparison by **`token_type`** (input / output / cache_read /
  cache_write) and surface an estimate of **caching savings vs. an all-`input`
  baseline**, sliceable like everything else.
- **`trajectories`:** *We want to tune reasoning effort against cost.* Add a
  breakdown by **`reasoning_effort`** (low / medium / high) and a derived
  **cost-per-passed-run** measure, sliceable like everything else.

---

## 6. Design north star

Aim for the **Mercor** bar: calm, neutral, information-dense but uncluttered;
polish through **restraint**. See [mercor.com](https://www.mercor.com) and
`design/NOTES.md`.

- Neutral palette, **one** considered accent; let the data carry the color.
- **Everything themed through tokens** (`web/src/styles/tokens.css`). **No
  hard-coded colors in components** — this is a real team rule and we look for it.
- Generous whitespace, clear hierarchy, honest data density (aligned numbers,
  consistent precision, compact units). Real empty/loading/error states.

We grade taste and consistency — does it read as *one system*? — not pixel-perfection.

---

## 7. Ground rules & the correctness harness

- **AI tooling is fully allowed and encouraged.** Litmus captures your process
  (commits, iterations, prompts); that's context, not a trap. We care about
  **judgment**, not keystrokes.
- **React + TypeScript** for the frontend (Node ≥ 18). **Backend/data layer is your
  choice** — an all-client DuckDB-WASM app or a small server (Node or Python) are
  both fine; we judge the *seam*, not the choice.
- **Same dataset for everyone** (fixed seed). Don't hand-edit the data to make a
  query pass.
- **The golden-query harness is a contract.** `harness/<scenario>/golden_queries.json`
  has aggregation questions with exact definitions + frozen answers; implement the
  thin `adapter.(mjs|py)` so it calls *your* query layer, and keep it green:
  ```bash
  node    harness/<scenario>/run_harness.mjs     # or
  python3 harness/<scenario>/run_harness.py
  ```
  It checks **answers, not your API shape**. This is our objective correctness
  signal — implement the adapter by *calling your query layer*, not by pasting the
  numbers (we read the code and will ask you to run it live).
- **Scope honestly.** Don't gold-plate auth/infra/CI. A focused product with clean
  seams is the goal; note anything you deliberately cut (that's a *good* signal).
- **Keep it runnable** from a clean checkout per your README.

---

## 8. Deliverables

1. **The repository**, running from a clean checkout per your README.
2. **The app** — modular dashboard + query layer + component-library seam (§3),
   plus whatever stretch you chose (§5).
3. **A README** (setup + architecture tour) and a **~1-page ADR** (§3.5, §4).
4. A **green golden-query harness** (§7).
5. *(Optional)* a 2–4 min screen recording — never required.

---

## 9. The presentation (30–60 min, live panel)

1. **Demo (~10 min).** The product doing real work.
2. **Architecture walkthrough (~15–20 min).** The **widget/module contract**, the
   **query layer** and its data-access patterns, the **component library**, and
   your **library choices** (the ADR). Show us the seams.
3. **Live extension (~5–10 min).** We'll ask you to **add a small new thing on the
   spot** — a new widget type, dimension, measure, or filter — or walk the exact
   code path. This is about whether the abstractions hold.
4. **"With more time…" + Q&A (~10–15 min).** Where it breaks at 100× the data,
   multi-tenant/permissions, saving & sharing, real-time — and what you cut and why.

**We will specifically ask you to defend:**
- Why these libraries, for these jobs — and what you rejected.
- How a **new dimension / data type / widget** slots in **without a rewrite** (the
  §5.1 addendum is a live example).
- Where you drew the **display ↔ data** seam, and what it buys and costs.
- Where your approach **falls over at scale**, and your next move.
- What you'd cut, keep, or redo given another two days.

"I used AI to scaffold X, then changed Y because Z" is exactly the kind of answer
we're hoping for.

---

## 10. Degrees of freedom & support

- **This is meant to be fun and a little open-ended.** Opinionated choices are
  welcome — surprise us. The starter repo removes boilerplate so you can spend time
  on the *interesting* layer.
- **Ask questions.** Clarifying questions are a positive signal — reach
  **[name/contact]** any time during the window. If you make an assumption instead,
  write it in the README.
- **You will not finish everything, and that's expected.** We evaluate judgment and
  craft on what you choose to build. Make something you're proud to walk us through.

Good luck — we're looking forward to it.
