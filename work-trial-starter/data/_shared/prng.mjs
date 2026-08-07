// Deterministic helpers shared by both dataset generators.
// Zero dependencies. All randomness flows through a seeded PRNG so the
// datasets (and their frozen golden answers) are byte-reproducible.

import fs from "node:fs";
import path from "node:path";

/** mulberry32 — small, fast, deterministic 32-bit PRNG. */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Uniform integer in [lo, hi]. */
export function randInt(rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

/** Pick one element uniformly. */
export function choice(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

/** Weighted pick. `items` = [{value, w}, ...]. */
export function weighted(rng, items) {
  const total = items.reduce((s, it) => s + it.w, 0);
  let r = rng() * total;
  for (const it of items) {
    r -= it.w;
    if (r <= 0) return it.value;
  }
  return items[items.length - 1].value;
}

/** Return true with probability p. */
export function chance(rng, p) {
  return rng() < p;
}

/** Standard normal via Box–Muller (deterministic through rng). */
export function gaussian(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Positive lognormal-ish draw with median `med` and spread `sigma`. */
export function logNormal(rng, med, sigma) {
  return Math.max(0, Math.round(med * Math.exp(sigma * gaussian(rng))));
}

export function round(n, dp = 6) {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
}

// ---- date helpers (UTC only, no locale/timezone surprises) ----
export const DAY_MS = 24 * 60 * 60 * 1000;
export function dateStrUTC(ms) {
  return new Date(ms).toISOString().slice(0, 10); // YYYY-MM-DD
}
export function isoUTC(ms) {
  return new Date(ms).toISOString().slice(0, 19) + "Z"; // no millis
}

// ---- tiny CSV writer/reader (data contains no commas/quotes/newlines) ----
export function toCsv(header, rows) {
  const esc = (v) => (v === null || v === undefined ? "" : String(v));
  const lines = [header.join(",")];
  for (const row of rows) lines.push(header.map((h) => esc(row[h])).join(","));
  return lines.join("\n") + "\n";
}

export function writeCsv(filePath, header, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, toCsv(header, rows));
}

/** Parse our own CSV back into typed rows. `types` maps column -> 'num'|'int'|'str'. */
export function readCsv(filePath, types = {}) {
  const text = fs.readFileSync(filePath, "utf8").trimEnd();
  const [head, ...body] = text.split("\n");
  const header = head.split(",");
  return body.map((line) => {
    const cells = line.split(",");
    const obj = {};
    header.forEach((h, i) => {
      const raw = cells[i];
      if (raw === "" || raw === undefined) {
        obj[h] = null;
      } else if (types[h] === "num") {
        obj[h] = Number(raw);
      } else if (types[h] === "int") {
        obj[h] = parseInt(raw, 10);
      } else {
        obj[h] = raw;
      }
    });
    return obj;
  });
}

/** Nearest-rank percentile over non-null numbers (documented method for the harness). */
export function percentileNearestRank(values, p) {
  const xs = values.filter((v) => v !== null && v !== undefined).sort((a, b) => a - b);
  if (xs.length === 0) return null;
  const rank = Math.ceil(p * xs.length); // 1-based
  return xs[Math.min(rank, xs.length) - 1];
}

export function sum(arr, f = (x) => x) {
  return arr.reduce((s, x) => s + f(x), 0);
}
