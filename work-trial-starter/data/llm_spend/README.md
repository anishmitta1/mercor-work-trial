# Dataset — `llm_spend`

Synthetic LLM usage/spend. Deterministic (fixed seed) — same data for everyone.
Grain of the fact table = a **rolled-up usage record** per service × customer ×
model × token-type × hour (not one row per API call).

- `usage_events.csv` — fact (~51k rows, ~45 days ending 2026-06-30 UTC)
- `usage_events_sample.csv` — first 1,000 rows, for eyeballing
- `dimensions/{services,customers,models}.csv`
- `generate.mjs` — regenerate/scale (`node data/llm_spend/generate.mjs`)

### `usage_events`

| column | type | notes |
|---|---|---|
| `event_id` | string | unique |
| `ts` | timestamp (UTC) | `YYYY-MM-DDTHH:MM:SSZ` |
| `customer_id` | string \| null | FK → customers; **null when unattributed** |
| `service_id` | string \| null | FK → services; **null when unattributed** |
| `surface` | enum | `backend_service` \| `web_app` \| `user_token` \| `batch_job` \| `unknown` |
| `model_id` | string | FK → models |
| `provider` | string | `anthropic` \| `openai` \| `google` \| `meta` \| `mistral` |
| `environment` | enum | `prod` \| `staging` \| `dev` |
| `region` | string | `us-east` \| `us-west` \| `eu` \| `apac` |
| `token_type` | enum | `input` \| `output` \| `cache_read` \| `cache_write` |
| `tokens` | integer | token count for this token_type (0 on credit rows) |
| `requests` | integer | underlying request count (0 on credit rows) |
| `cost_usd` | number | **can be negative** (credits/rebates) |
| `latency_ms` | integer \| null | representative latency; **null on some batch/unknown rows** |
| `attribution_status` | enum | `attributed` \| `partial` \| `unknown` |

Dimensions: **services**(`service_id,service_name,team,surface`),
**customers**(`customer_id,customer_name,segment∈{enterprise,startup,internal},region`),
**models**(`model_id,provider,family,input_price_per_mtok,output_price_per_mtok,cache_read_price_per_mtok,cache_write_price_per_mtok`).

### Planted characteristics (handle them thoughtfully)

- ~12% **unattributed** rows (null customer/service, `surface=unknown`, `attribution_status=unknown`).
- ~1% **credit** rows with negative `cost_usd` and zero tokens/requests.
- **null `latency_ms`** on a fraction of batch/unknown rows.
- weekly **seasonality** + gentle growth **trend** + one **spike day** (2026-06-20, `svc_trajectory_runner`).
- `cache_read`/`cache_write` token types priced differently — central to the Day-2 addendum in `BRIEF.md`.
