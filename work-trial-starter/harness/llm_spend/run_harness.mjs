// Correctness harness (Node). Green = every golden query is implemented and correct.
//   node harness/llm_spend/run_harness.mjs
// Point it at a different adapter with ADAPTER=path/to/adapter.mjs (used by graders).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const golden = JSON.parse(fs.readFileSync(path.join(HERE, "golden_queries.json"), "utf8"));
const adapterPath = process.env.ADAPTER
  ? path.resolve(process.cwd(), process.env.ADAPTER)
  : path.join(HERE, "adapter.mjs");
const { answer } = await import(pathToFileURL(adapterPath).href);

const fmt = (v) => (Array.isArray(v) ? `[${v.join(", ")}]` : String(v));
function grade(q, got) {
  if (got === null || got === undefined) return "PENDING";
  if (q.result_type === "string[]") return JSON.stringify(got) === JSON.stringify(q.expected) ? "PASS" : "FAIL";
  const tolAbs = q.tolerance_abs ?? 1e-6;
  return Math.abs(Number(got) - Number(q.expected)) <= tolAbs + 1e-9 ? "PASS" : "FAIL";
}

let fail = 0, pend = 0;
for (const q of golden.queries) {
  let got = null, err = null;
  try { got = await answer(q.id); } catch (e) { err = e.message; }
  const state = grade(q, got);
  if (state === "FAIL") fail++;
  if (state === "PENDING") pend++;
  const detail = state === "PASS" ? "" : `  got=${err ? "ERROR: " + err : fmt(got)}  expected=${fmt(q.expected)}`;
  console.log(`${state.padEnd(8)} ${q.id}${detail}`);
}
const passed = golden.queries.length - fail - pend;
console.log(`\n${passed}/${golden.queries.length} passed · ${fail} failed · ${pend} pending`);
process.exit(fail + pend > 0 ? 1 : 0);
