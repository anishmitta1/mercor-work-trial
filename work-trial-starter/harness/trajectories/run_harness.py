#!/usr/bin/env python3
"""Correctness harness (Python). Green = every golden query implemented & correct.
    python3 harness/llm_spend/run_harness.py
Point at another adapter with ADAPTER=path/to/adapter.py (used by graders)."""
import json, os, sys, importlib.util

HERE = os.path.dirname(os.path.abspath(__file__))
golden = json.load(open(os.path.join(HERE, "golden_queries.json")))
adapter_path = os.path.abspath(os.environ.get("ADAPTER", os.path.join(HERE, "adapter.py")))
spec = importlib.util.spec_from_file_location("adapter", adapter_path)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def grade(q, got):
    if got is None:
        return "PENDING"
    if q["result_type"] == "string[]":
        return "PASS" if list(got) == list(q["expected"]) else "FAIL"
    tol = q.get("tolerance_abs", 1e-6)
    return "PASS" if abs(float(got) - float(q["expected"])) <= tol + 1e-9 else "FAIL"


fail = pend = 0
for q in golden["queries"]:
    got, err = None, None
    try:
        got = mod.answer(q["id"])
    except Exception as e:  # noqa: BLE001
        err = str(e)
    state = grade(q, got)
    fail += state == "FAIL"
    pend += state == "PENDING"
    detail = "" if state == "PASS" else f"  got={('ERROR: ' + err) if err else got}  expected={q['expected']}"
    print(f"{state:<8} {q['id']}{detail}")

n = len(golden["queries"])
print(f"\n{n - fail - pend}/{n} passed · {fail} failed · {pend} pending")
sys.exit(1 if fail + pend > 0 else 0)
