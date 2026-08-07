// Deterministic generator for the "LLM Spend" scenario.
//   node data/llm_spend/generate.mjs
// Writes fact + dimension CSVs here, then freezes golden answers to
// ../../harness/llm_spend/golden_queries.json by re-reading what it wrote.
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import {
  makeRng, randInt, choice, weighted, chance, logNormal, round,
  DAY_MS, dateStrUTC, isoUTC, writeCsv, readCsv, percentileNearestRank, sum,
} from "../_shared/prng.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HARNESS = path.join(HERE, "../../harness/llm_spend");

// ---------------- config (all fixed → reproducible) ----------------
const SEED = 20260630;
const AS_OF = Date.UTC(2026, 5, 30, 23, 0, 0); // 2026-06-30T23:00:00Z
const N_DAYS = 45;
const START_DAY = Date.UTC(2026, 5, 30) - (N_DAYS - 1) * DAY_MS; // midnight of first day
const SPIKE_DATE = "2026-06-20";
const SPIKE_SERVICE = "svc_trajectory_runner";
const BASE_EVENTS = 1250;
const UNKNOWN_FRACTION = 0.12;
const CREDIT_FRACTION = 0.01;

const rng = makeRng(SEED);

// ---------------- dimensions ----------------
const MODELS = [
  ["m_claude_opus", "anthropic", "claude", 15, 75, 1.5, 18.75],
  ["m_claude_sonnet", "anthropic", "claude", 3, 15, 0.3, 3.75],
  ["m_claude_haiku", "anthropic", "claude", 0.8, 4, 0.08, 1.0],
  ["m_gpt5", "openai", "gpt", 10, 30, 1.25, 12.5],
  ["m_gpt5_mini", "openai", "gpt", 0.5, 2, 0.05, 0.6],
  ["m_gpt4o", "openai", "gpt", 2.5, 10, 1.25, 3.0],
  ["m_gemini_pro", "google", "gemini", 3.5, 10.5, 0.35, 4.0],
  ["m_gemini_flash", "google", "gemini", 0.3, 1.2, 0.03, 0.4],
  ["m_llama3_70b", "meta", "llama", 0.6, 0.7, 0.06, 0.7],
  ["m_mistral_large", "mistral", "mistral", 2, 6, 0.2, 2.5],
].map(([model_id, provider, family, i, o, cr, cw]) => ({
  model_id, provider, family,
  input_price_per_mtok: i, output_price_per_mtok: o,
  cache_read_price_per_mtok: cr, cache_write_price_per_mtok: cw,
}));
const MODEL_WEIGHTS = MODELS.map((m, idx) => ({ value: m, w: [10, 22, 14, 9, 16, 8, 7, 9, 3, 2][idx] }));

const SERVICES = [
  ["svc_annotation_api", "Studio Platform", "backend_service"],
  ["svc_trajectory_runner", "RL Environments", "backend_service"],
  ["svc_batch_grader", "RL Environments", "batch_job"],
  ["svc_web_app", "Studio Experience", "web_app"],
  ["svc_ingest", "Data Platform", "backend_service"],
  ["svc_search", "Studio Platform", "backend_service"],
  ["svc_maven_agent", "Support", "backend_service"],
  ["svc_headshot", "Growth", "backend_service"],
  ["svc_voice", "Growth", "backend_service"],
  ["svc_playground", "Studio Experience", "web_app"],
  ["svc_eval_orchestrator", "RL Environments", "batch_job"],
  ["svc_sourcing", "Marketplace", "backend_service"],
].map(([service_id, team, surface]) => ({
  service_id, service_name: service_id.replace("svc_", "").replace(/_/g, " "), team, surface,
}));
const SERVICE_WEIGHTS = SERVICES.map((s, idx) => ({
  value: s, w: [16, 20, 10, 14, 8, 7, 6, 4, 4, 5, 4, 6][idx],
}));

const SEGMENTS = ["enterprise", "startup", "internal"];
const REGIONS = ["us-east", "us-west", "eu", "apac"];
const CUSTOMERS = Array.from({ length: 40 }, (_, i) => {
  const id = "C_" + String(i + 1).padStart(5, "0");
  const segment = weighted(rng, [
    { value: "enterprise", w: 5 }, { value: "startup", w: 8 }, { value: "internal", w: 3 },
  ]);
  return { customer_id: id, customer_name: `customer-${i + 1}`, segment, region: choice(rng, REGIONS) };
});
const CUSTOMER_WEIGHTS = CUSTOMERS.map((c) => ({
  value: c, w: c.segment === "enterprise" ? 6 : c.segment === "startup" ? 3 : 1.5,
}));

const TOKEN_TYPES = [
  { value: "input", w: 40 }, { value: "output", w: 40 },
  { value: "cache_read", w: 15 }, { value: "cache_write", w: 5 },
];
// Each row is an hourly rollup, so token counts are large (millions).
const TOKEN_MEDIAN = { input: 4_000_000, output: 900_000, cache_read: 6_000_000, cache_write: 2_500_000 };

// ---------------- generation ----------------
function seasonalMult(dayStart, dayIdx) {
  const dow = new Date(dayStart).getUTCDay();
  const week = dow === 0 || dow === 6 ? 0.55 : dow === 5 ? 0.85 : 1.0;
  const trend = 0.85 + 0.35 * (dayIdx / (N_DAYS - 1));
  return week * trend;
}

function makeEvent(dayStart, forceService) {
  const ts = dayStart + randInt(rng, 0, 23) * 3600_000 + randInt(rng, 0, 59) * 60_000;
  const isUnknown = !forceService && chance(rng, UNKNOWN_FRACTION);
  const model = weighted(rng, MODEL_WEIGHTS);
  const token_type = weighted(rng, TOKEN_TYPES);

  let service = forceService || (isUnknown ? null : weighted(rng, SERVICE_WEIGHTS));
  let customer = isUnknown ? null : weighted(rng, CUSTOMER_WEIGHTS);
  let surface, region, attribution_status;
  if (isUnknown) {
    surface = "unknown"; region = choice(rng, REGIONS); attribution_status = "unknown";
  } else {
    surface = weighted(rng, [
      { value: service.surface, w: 8 }, { value: "user_token", w: 1 }, { value: "web_app", w: 1 },
    ]);
    region = chance(rng, 0.8) ? customer.region : choice(rng, REGIONS);
    attribution_status = chance(rng, 0.08) ? "partial" : "attributed";
  }

  const environment = weighted(rng, [
    { value: "prod", w: 80 }, { value: "staging", w: 15 }, { value: "dev", w: 5 },
  ]);

  let tokens = logNormal(rng, TOKEN_MEDIAN[token_type], 0.95);
  let requests = Math.max(1, Math.round(tokens / (token_type === "output" ? 1500 : 6000)));
  const priceKey = {
    input: "input_price_per_mtok", output: "output_price_per_mtok",
    cache_read: "cache_read_price_per_mtok", cache_write: "cache_write_price_per_mtok",
  }[token_type];
  let cost_usd = round((tokens / 1_000_000) * model[priceKey], 6);

  // credits: negative billing adjustments, no tokens
  if (!isUnknown && chance(rng, CREDIT_FRACTION)) {
    cost_usd = -round(cost_usd * (0.2 + rng() * 0.8), 6);
    tokens = 0; requests = 0;
  }

  // latency; null for some batch/unknown rows
  let latency_ms = logNormal(rng, surface === "batch_job" ? 4200 : 850, 0.6);
  if ((surface === "batch_job" || surface === "unknown") && chance(rng, 0.2)) latency_ms = null;

  return {
    event_id: `evt_${(ts).toString(36)}_${randInt(rng, 100000, 999999)}`,
    ts: isoUTC(ts),
    customer_id: customer ? customer.customer_id : null,
    service_id: service ? service.service_id : null,
    surface,
    model_id: model.model_id,
    provider: model.provider,
    environment,
    region,
    token_type,
    tokens,
    requests,
    cost_usd,
    latency_ms,
    attribution_status,
  };
}

const rows = [];
for (let d = 0; d < N_DAYS; d++) {
  const dayStart = START_DAY + d * DAY_MS;
  const n = Math.round(BASE_EVENTS * seasonalMult(dayStart, d));
  for (let i = 0; i < n; i++) rows.push(makeEvent(dayStart));
  if (dateStrUTC(dayStart) === SPIKE_DATE) {
    const spikeSvc = SERVICES.find((s) => s.service_id === SPIKE_SERVICE);
    for (let i = 0; i < 2500; i++) rows.push(makeEvent(dayStart, spikeSvc));
  }
}

// ---------------- write outputs ----------------
const FACT_HEADER = [
  "event_id", "ts", "customer_id", "service_id", "surface", "model_id", "provider",
  "environment", "region", "token_type", "tokens", "requests", "cost_usd", "latency_ms",
  "attribution_status",
];
writeCsv(path.join(HERE, "usage_events.csv"), FACT_HEADER, rows);
writeCsv(path.join(HERE, "usage_events_sample.csv"), FACT_HEADER, rows.slice(0, 1000));
writeCsv(path.join(HERE, "dimensions/models.csv"),
  ["model_id", "provider", "family", "input_price_per_mtok", "output_price_per_mtok", "cache_read_price_per_mtok", "cache_write_price_per_mtok"], MODELS);
writeCsv(path.join(HERE, "dimensions/services.csv"),
  ["service_id", "service_name", "team", "surface"], SERVICES);
writeCsv(path.join(HERE, "dimensions/customers.csv"),
  ["customer_id", "customer_name", "segment", "region"], CUSTOMERS);

// ---------------- freeze golden answers (re-read what we wrote) ----------------
const fact = readCsv(path.join(HERE, "usage_events.csv"),
  { tokens: "int", requests: "int", cost_usd: "num", latency_ms: "int" });
const custSeg = Object.fromEntries(CUSTOMERS.map((c) => [c.customer_id, c.segment]));
const ms = (s) => Date.parse(s);
const inRange = (t, a, b) => ms(t) >= a && ms(t) < b;
const JUN = [Date.UTC(2026, 5, 1), Date.UTC(2026, 6, 1)];
const WK = [Date.UTC(2026, 5, 8), Date.UTC(2026, 5, 15)];

const q1 = round(sum(fact.filter((r) => r.customer_id === "C_00007" && inRange(r.ts, ...JUN)), (r) => r.cost_usd), 6);

const outByModel = {};
for (const r of fact) if (r.token_type === "output" && inRange(r.ts, ...JUN)) outByModel[r.model_id] = (outByModel[r.model_id] || 0) + r.tokens;
const q2 = Object.entries(outByModel).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 5).map(([m]) => m);

const q3 = round(sum(fact.filter((r) => r.service_id === SPIKE_SERVICE && r.ts.slice(0, 10) === SPIKE_DATE), (r) => r.cost_usd), 6);

const totalCost = sum(fact, (r) => r.cost_usd);
const q4 = round(sum(fact.filter((r) => r.attribution_status === "unknown"), (r) => r.cost_usd) / totalCost, 6);

const q5 = percentileNearestRank(
  fact.filter((r) => r.provider === "anthropic" && r.environment === "prod" && inRange(r.ts, ...WK)).map((r) => r.latency_ms), 0.95);

const q6 = round(sum(fact.filter((r) => r.customer_id && custSeg[r.customer_id] === "enterprise"), (r) => r.cost_usd), 6);

const golden = {
  scenario: "llm_spend",
  seed: SEED,
  as_of: "2026-06-30T23:00:00Z",
  row_count: fact.length,
  conventions: "All timestamps UTC. Date ranges are half-open [start, end). p95 = nearest-rank over non-null values: sort ascending, take the value at index ceil(0.95*N) (1-based). Money compared with tolerance; ratios likewise.",
  queries: [
    { id: "total_cost_customer_C_00007_june", result_type: "number", tolerance_abs: 0.01,
      question: "Total cost_usd for customer C_00007 in June 2026 (UTC).",
      definition: "SUM(cost_usd) WHERE customer_id='C_00007' AND ts IN ['2026-06-01T00:00:00Z','2026-07-01T00:00:00Z'). Includes any credit rows.",
      expected: q1 },
    { id: "top5_models_by_output_tokens_june", result_type: "string[]",
      question: "Top 5 model_id by output tokens in June 2026, most first.",
      definition: "Rows WHERE token_type='output' AND ts in June 2026; GROUP BY model_id SUM(tokens); ORDER BY sum DESC, model_id ASC; take 5 model_id.",
      expected: q2 },
    { id: "cost_trajectory_runner_spike_day", result_type: "number", tolerance_abs: 0.01,
      question: "Total cost_usd for service svc_trajectory_runner on 2026-06-20 (UTC).",
      definition: "SUM(cost_usd) WHERE service_id='svc_trajectory_runner' AND date(ts)='2026-06-20'.",
      expected: q3 },
    { id: "unknown_cost_share", result_type: "number", tolerance_abs: 0.0005,
      question: "Share of total cost_usd that is unattributed.",
      definition: "SUM(cost_usd WHERE attribution_status='unknown') / SUM(cost_usd) over the full dataset (net of credits).",
      expected: q4 },
    { id: "p95_latency_anthropic_prod_week", result_type: "number", tolerance_abs: 1,
      question: "p95 latency_ms for provider=anthropic, environment=prod, week of 2026-06-08.",
      definition: "Nearest-rank p95 of non-null latency_ms WHERE provider='anthropic' AND environment='prod' AND ts IN ['2026-06-08T00:00:00Z','2026-06-15T00:00:00Z').",
      expected: q5 },
    { id: "net_cost_enterprise_segment", result_type: "number", tolerance_abs: 0.01,
      question: "Net cost_usd (incl. credits) for enterprise-segment customers, full dataset.",
      definition: "SUM(cost_usd) for rows whose customer_id joins customers.segment='enterprise'. Unattributed rows (null customer_id) excluded.",
      expected: q6 },
  ],
};
fs.mkdirSync(HARNESS, { recursive: true });
fs.writeFileSync(path.join(HARNESS, "golden_queries.json"), JSON.stringify(golden, null, 2) + "\n");

console.log(`llm_spend: wrote ${fact.length} rows`);
console.log(`  total cost_usd = ${round(totalCost, 2)}, unknown share = ${(q4 * 100).toFixed(1)}%`);
console.log(`  golden: q1=${q1} q3=${q3} q5=${q5} q6=${q6}`);
console.log(`  top5 output models = ${golden.queries[1].expected.join(", ")}`);
