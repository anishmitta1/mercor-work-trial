// Deterministic generator for the "Trajectory / Eval-Run" scenario.
//   node data/trajectories/generate.mjs
// Parallel in shape to llm_spend: one fact table + dimensions + frozen golden
// answers, with the same planted-warts philosophy (unknown bucket, a spike day,
// a non-additive measure — here pass_rate — nulls, credits-analog via errors).
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import {
  makeRng, randInt, choice, weighted, chance, gaussian, logNormal, round,
  DAY_MS, dateStrUTC, isoUTC, writeCsv, readCsv, percentileNearestRank, sum,
} from "../_shared/prng.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HARNESS = path.join(HERE, "../../harness/trajectories");

const SEED = 20260630;
const AS_OF = Date.UTC(2026, 5, 30, 23, 0, 0);
const N_DAYS = 45;
const START_DAY = Date.UTC(2026, 5, 30) - (N_DAYS - 1) * DAY_MS;
const SPIKE_DATE = "2026-06-20";
const SPIKE_CAMPAIGN = "cmp_0003";
const BASE_RUNS = 650;
const ORPHAN_FRACTION = 0.1;
const rng = makeRng(SEED);

const MODELS = [
  ["m_claude_opus", "anthropic", 15, 75, 1.5, 18.75, 0.79],
  ["m_claude_sonnet", "anthropic", 3, 15, 0.3, 3.75, 0.73],
  ["m_claude_haiku", "anthropic", 0.8, 4, 0.08, 1.0, 0.56],
  ["m_gpt5", "openai", 10, 30, 1.25, 12.5, 0.77],
  ["m_gpt5_mini", "openai", 0.5, 2, 0.05, 0.6, 0.5],
  ["m_gpt4o", "openai", 2.5, 10, 1.25, 3.0, 0.67],
  ["m_gemini_pro", "google", 3.5, 10.5, 0.35, 4.0, 0.7],
  ["m_gemini_flash", "google", 0.3, 1.2, 0.03, 0.4, 0.5],
  ["m_llama3_70b", "meta", 0.6, 0.7, 0.06, 0.7, 0.47],
  ["m_mistral_large", "mistral", 2, 6, 0.2, 2.5, 0.6],
].map(([model_id, provider, i, o, cr, cw, quality]) => ({
  model_id, provider, input_price_per_mtok: i, output_price_per_mtok: o,
  cache_read_price_per_mtok: cr, cache_write_price_per_mtok: cw, quality,
}));
const MODEL_WEIGHTS = MODELS.map((m, idx) => ({ value: m, w: [10, 20, 12, 12, 14, 8, 8, 8, 4, 4][idx] }));

const TASK_TYPES = ["browsecomp", "swe_bench", "gdpval", "hle", "terminal_bench", "legalbench", "apex_agents"];
const TASK_DIFFICULTY = { browsecomp: 0.12, swe_bench: 0.22, gdpval: 0.15, hle: 0.28, terminal_bench: 0.2, legalbench: 0.08, apex_agents: 0.18 };
const AGENTS = ["ac_single_shot", "ac_react", "ac_stirrup", "ac_lighthouse", "ac_terminus"];

const CAMPAIGNS = Array.from({ length: 8 }, (_, i) => ({
  campaign_id: "cmp_" + String(i + 1).padStart(4, "0"),
  campaign_name: `campaign-${i + 1}`,
  segment: weighted(rng, [{ value: "enterprise", w: 5 }, { value: "startup", w: 8 }, { value: "internal", w: 3 }]),
}));
const WORLDS = Array.from({ length: 15 }, (_, i) => ({
  world_id: "w_" + String(i + 1).padStart(4, "0"),
  world_name: `world-${i + 1}`,
  campaign_id: CAMPAIGNS[i % CAMPAIGNS.length].campaign_id,
  task_type: TASK_TYPES[i % TASK_TYPES.length],
}));
const WORLD_WEIGHTS = WORLDS.map((w, idx) => ({ value: w, w: 3 + ((idx * 7) % 11) }));
const VERIFIERS = WORLDS.flatMap((w) =>
  Array.from({ length: 4 }, (_, k) => ({
    verifier_id: `${w.world_id}_v${k + 1}`, world_id: w.world_id,
    verifier_name: `${w.task_type}_check_${k + 1}`, kind: choice(rng, ["programmatic", "judge", "gt"]),
  })));

const EFFORTS = [{ value: "low", w: 25 }, { value: "medium", w: 50 }, { value: "high", w: 25 }];
const GRADERS = [{ value: "judge", w: 55 }, { value: "programmatic", w: 30 }, { value: "gt", w: 15 }];
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function seasonalMult(dayStart, dayIdx) {
  const dow = new Date(dayStart).getUTCDay();
  const week = dow === 0 || dow === 6 ? 0.6 : 1.0;
  return week * (0.85 + 0.35 * (dayIdx / (N_DAYS - 1)));
}

function makeRun(dayStart, opts = {}) {
  const ts = dayStart + randInt(rng, 0, 23) * 3600_000 + randInt(rng, 0, 59) * 60_000;
  const orphan = !opts.forceWorld && chance(rng, ORPHAN_FRACTION);
  const model = opts.forceModel || weighted(rng, MODEL_WEIGHTS);
  const world = orphan ? null : opts.forceWorld || weighted(rng, WORLD_WEIGHTS);
  const agent_config_id = choice(rng, AGENTS);
  const reasoning_effort = weighted(rng, EFFORTS);
  const environment = weighted(rng, [{ value: "prod", w: 80 }, { value: "staging", w: 15 }, { value: "dev", w: 5 }]);
  const grader_type = weighted(rng, GRADERS);

  let status = orphan
    ? weighted(rng, [{ value: "errored", w: 8 }, { value: "cancelled", w: 2 }])
    : opts.broken
      ? weighted(rng, [{ value: "errored", w: 6 }, { value: "completed", w: 3 }, { value: "timeout", w: 1 }])
      : weighted(rng, [{ value: "completed", w: 82 }, { value: "errored", w: 10 }, { value: "timeout", w: 5 }, { value: "cancelled", w: 3 }]);

  const num_verifiers = randInt(rng, 2, 8);
  let score = null, passed = 0, num_verifiers_passed = 0;
  if (status === "completed") {
    const diff = world ? TASK_DIFFICULTY[world.task_type] : 0.15;
    const base = (opts.broken ? 0.2 : model.quality) - diff + 0.12 * gaussian(rng);
    score = round(clamp01(base), 4);
    passed = score >= 0.7 ? 1 : 0;
    num_verifiers_passed = Math.max(0, Math.min(num_verifiers, Math.round(score * num_verifiers)));
  }

  const input_tokens = logNormal(rng, 60000, 0.8);
  const output_tokens = logNormal(rng, 30000, 0.9);
  const cache_read_tokens = chance(rng, 0.6) ? logNormal(rng, 80000, 0.9) : 0;
  const cache_write_tokens = chance(rng, 0.5) ? logNormal(rng, 20000, 0.9) : 0;
  const cost_usd = round(
    (input_tokens / 1e6) * model.input_price_per_mtok +
    (output_tokens / 1e6) * model.output_price_per_mtok +
    (cache_read_tokens / 1e6) * model.cache_read_price_per_mtok +
    (cache_write_tokens / 1e6) * model.cache_write_price_per_mtok, 6);

  let duration_ms = logNormal(rng, agent_config_id === "ac_single_shot" ? 12000 : 55000, 0.7);
  if (status !== "completed" && chance(rng, 0.35)) duration_ms = null;

  return {
    run_id: `run_${ts.toString(36)}_${randInt(rng, 100000, 999999)}`,
    ts: isoUTC(ts),
    world_id: world ? world.world_id : null,
    campaign_id: world ? world.campaign_id : null,
    task_id: `task_${randInt(rng, 1, 4000)}`,
    model_id: model.model_id,
    provider: model.provider,
    agent_config_id,
    environment,
    reasoning_effort,
    grader_type,
    status,
    score,
    passed,
    num_verifiers,
    num_verifiers_passed,
    input_tokens,
    output_tokens,
    cache_read_tokens,
    cache_write_tokens,
    cost_usd,
    duration_ms,
    num_tool_calls: agent_config_id === "ac_single_shot" ? randInt(rng, 0, 3) : randInt(rng, 2, 40),
  };
}

const rows = [];
for (let d = 0; d < N_DAYS; d++) {
  const dayStart = START_DAY + d * DAY_MS;
  const n = Math.round(BASE_RUNS * seasonalMult(dayStart, d));
  for (let i = 0; i < n; i++) rows.push(makeRun(dayStart));
  if (dateStrUTC(dayStart) === SPIKE_DATE) {
    const brokenWorld = WORLDS.find((w) => w.campaign_id === SPIKE_CAMPAIGN);
    for (let i = 0; i < 1500; i++) rows.push(makeRun(dayStart, { forceWorld: brokenWorld, broken: true }));
  }
}

const FACT_HEADER = [
  "run_id", "ts", "world_id", "campaign_id", "task_id", "model_id", "provider",
  "agent_config_id", "environment", "reasoning_effort", "grader_type", "status", "score",
  "passed", "num_verifiers", "num_verifiers_passed", "input_tokens", "output_tokens",
  "cache_read_tokens", "cache_write_tokens", "cost_usd", "duration_ms", "num_tool_calls",
];
writeCsv(path.join(HERE, "trajectory_runs.csv"), FACT_HEADER, rows);
writeCsv(path.join(HERE, "trajectory_runs_sample.csv"), FACT_HEADER, rows.slice(0, 1000));
writeCsv(path.join(HERE, "dimensions/models.csv"),
  ["model_id", "provider", "input_price_per_mtok", "output_price_per_mtok", "cache_read_price_per_mtok", "cache_write_price_per_mtok"],
  MODELS.map(({ quality, ...m }) => m));
writeCsv(path.join(HERE, "dimensions/worlds.csv"), ["world_id", "world_name", "campaign_id", "task_type"], WORLDS);
writeCsv(path.join(HERE, "dimensions/campaigns.csv"), ["campaign_id", "campaign_name", "segment"], CAMPAIGNS);
writeCsv(path.join(HERE, "dimensions/verifiers.csv"), ["verifier_id", "world_id", "verifier_name", "kind"], VERIFIERS);

// ---- freeze golden answers (re-read what we wrote) ----
const fact = readCsv(path.join(HERE, "trajectory_runs.csv"), {
  score: "num", passed: "int", num_verifiers: "int", num_verifiers_passed: "int",
  input_tokens: "int", output_tokens: "int", cache_read_tokens: "int", cache_write_tokens: "int",
  cost_usd: "num", duration_ms: "int", num_tool_calls: "int",
});
const worldTaskType = Object.fromEntries(WORLDS.map((w) => [w.world_id, w.task_type]));
const ms = (s) => Date.parse(s);
const inRange = (t, a, b) => ms(t) >= a && ms(t) < b;
const JUN = [Date.UTC(2026, 5, 1), Date.UTC(2026, 6, 1)];
const WK = [Date.UTC(2026, 5, 8), Date.UTC(2026, 5, 15)];
const LAST14 = [AS_OF - 14 * DAY_MS, AS_OF];

const q1 = fact.filter((r) => r.world_id === "w_0007" && inRange(r.ts, ...JUN)).length;

const gpt5June = fact.filter((r) => r.model_id === "m_gpt5" && inRange(r.ts, ...JUN));
const q2 = round(sum(gpt5June, (r) => r.passed) / gpt5June.length, 6);

const q3 = round(sum(fact.filter((r) => r.campaign_id === "cmp_0002" && inRange(r.ts, ...LAST14)), (r) => r.cost_usd), 6);

const q4 = round(fact.filter((r) => r.status === "errored").length / fact.length, 6);

const q5 = percentileNearestRank(
  fact.filter((r) => r.grader_type === "judge" && r.environment === "prod" && inRange(r.ts, ...WK)).map((r) => r.duration_ms), 0.95);

const swe = fact.filter((r) => r.world_id && worldTaskType[r.world_id] === "swe_bench" && r.score !== null);
const q6 = round(sum(swe, (r) => r.score) / swe.length, 6);

const golden = {
  scenario: "trajectories",
  seed: SEED,
  as_of: "2026-06-30T23:00:00Z",
  row_count: fact.length,
  conventions: "All timestamps UTC. Date ranges half-open [start, end). 'last 14 days' = [as_of - 14d, as_of). passed is 1/0. score is null for non-completed runs. pass_rate = SUM(passed)/COUNT(rows). p95 = nearest-rank over non-null values (ceil(0.95*N), 1-based).",
  queries: [
    { id: "run_count_world_w_0007_june", result_type: "number", tolerance_abs: 0,
      question: "Number of runs for world w_0007 in June 2026 (UTC).",
      definition: "COUNT(*) WHERE world_id='w_0007' AND ts in ['2026-06-01T00:00:00Z','2026-07-01T00:00:00Z').",
      expected: q1 },
    { id: "pass_rate_gpt5_june", result_type: "number", tolerance_abs: 0.0005,
      question: "Pass rate for model m_gpt5 in June 2026.",
      definition: "SUM(passed) / COUNT(*) over rows WHERE model_id='m_gpt5' AND ts in June 2026. (Non-completed runs count in the denominator, passed=0.)",
      expected: q2 },
    { id: "cost_campaign_cmp_0002_last14", result_type: "number", tolerance_abs: 0.01,
      question: "Total cost_usd for campaign cmp_0002 over the last 14 days.",
      definition: "SUM(cost_usd) WHERE campaign_id='cmp_0002' AND ts in [as_of-14d, as_of) = ['2026-06-16T23:00:00Z','2026-06-30T23:00:00Z').",
      expected: q3 },
    { id: "errored_run_share", result_type: "number", tolerance_abs: 0.0005,
      question: "Share of runs with status='errored' across the full dataset.",
      definition: "COUNT(status='errored') / COUNT(*). (The orphaned/unknown bucket — null world_id/campaign_id — is mostly errored.)",
      expected: q4 },
    { id: "p95_duration_judge_prod_week", result_type: "number", tolerance_abs: 1,
      question: "p95 duration_ms for grader_type=judge, environment=prod, week of 2026-06-08.",
      definition: "Nearest-rank p95 of non-null duration_ms WHERE grader_type='judge' AND environment='prod' AND ts in ['2026-06-08T00:00:00Z','2026-06-15T00:00:00Z').",
      expected: q5 },
    { id: "avg_score_swe_bench", result_type: "number", tolerance_abs: 0.0005,
      question: "Average score for task_type='swe_bench', completed runs, full dataset.",
      definition: "MEAN(score) over rows whose world_id joins worlds.task_type='swe_bench' AND score is not null.",
      expected: q6 },
  ],
};
fs.mkdirSync(HARNESS, { recursive: true });
fs.writeFileSync(path.join(HARNESS, "golden_queries.json"), JSON.stringify(golden, null, 2) + "\n");

console.log(`trajectories: wrote ${fact.length} rows`);
console.log(`  error share = ${(q4 * 100).toFixed(1)}%, gpt5 June pass_rate = ${(q2 * 100).toFixed(1)}%`);
console.log(`  golden: q1=${q1} q3=${q3} q5=${q5} q6=${q6}`);
