# Dataset — `trajectories`

Synthetic eval-run telemetry. Deterministic (fixed seed). Grain of the fact
table = **one trajectory run** (a model's attempt at a task, graded by verifiers).

- `trajectory_runs.csv` — fact (~28k rows, ~45 days ending 2026-06-30 UTC)
- `trajectory_runs_sample.csv` — first 1,000 rows
- `dimensions/{worlds,campaigns,models,verifiers}.csv`
- `generate.mjs` — regenerate/scale (`node data/trajectories/generate.mjs`)

### `trajectory_runs`

| column | type | notes |
|---|---|---|
| `run_id` | string | unique |
| `ts` | timestamp (UTC) | run completion time |
| `world_id` | string \| null | FK → worlds; **null when orphaned** |
| `campaign_id` | string \| null | FK → campaigns; **null when orphaned** |
| `task_id` | string | task within the world |
| `model_id` / `provider` | string | FK → models |
| `agent_config_id` | string | the harness/agent used |
| `environment` | enum | `prod` \| `staging` \| `dev` |
| `reasoning_effort` | enum | `low` \| `medium` \| `high` (used by the Day-2 addendum) |
| `grader_type` | enum | `judge` \| `programmatic` \| `gt` |
| `status` | enum | `completed` \| `errored` \| `timeout` \| `cancelled` |
| `score` | number \| null | 0..1; **null unless completed** |
| `passed` | integer | 1/0 (1 iff completed and `score ≥ 0.7`) |
| `num_verifiers` / `num_verifiers_passed` | integer | per-run verifier tallies |
| `input_tokens`,`output_tokens`,`cache_read_tokens`,`cache_write_tokens` | integer | per run |
| `cost_usd` | number | derived from tokens × model price |
| `duration_ms` | integer \| null | wall time; **null on some non-completed runs** |
| `num_tool_calls` | integer | agentic depth |

Dimensions: **worlds**(`world_id,world_name,campaign_id,task_type`),
**campaigns**(`campaign_id,campaign_name,segment`),
**models**(`model_id,provider,…prices`),
**verifiers**(`verifier_id,world_id,verifier_name,kind`).
`task_type ∈ {browsecomp, swe_bench, gdpval, hle, terminal_bench, legalbench, apex_agents}`.

### Planted characteristics

- ~10% **orphaned** runs (null world/campaign, mostly `errored`) — the "unknown" bucket.
- **null `score`** on non-completed runs; **null `duration_ms`** on some.
- **`pass_rate` is non-additive** (SUM(passed)/COUNT) — it can't be summed across groups.
- weekly **seasonality** + one **spike day** (2026-06-20): a broken config on campaign
  `cmp_0003` tanks its pass-rate and floods errors.
- token columns support a caching / cost-efficiency **Day-2 addendum** (see `BRIEF.md`).
