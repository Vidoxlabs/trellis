// Trellis verdict math: a strictness order, not an average. Fail outranks
// unknown, unknown outranks pass, and nothing is ever silently passed.

export function verdict(results = []) {
  const failures = results.filter((r) => r.status === 'fail');
  if (failures.length > 0) {
    return Object.freeze({
      verdict: 'fail',
      failures: Object.freeze(failures.map((r) => r.id)),
      unknowns: Object.freeze(
        results.filter((r) => r.status === 'unknown').map((r) => r.id)
      ),
    });
  }
  const unknowns = results.filter((r) => r.status === 'unknown');
  if (unknowns.length > 0) {
    return Object.freeze({
      verdict: 'unknown',
      failures: Object.freeze([]),
      unknowns: Object.freeze(unknowns.map((r) => r.id)),
    });
  }
  return Object.freeze({ verdict: 'pass', failures: Object.freeze([]), unknowns: Object.freeze([]) });
}

export function rollup(results = []) {
  const counts = { pass: 0, fail: 0, unknown: 0 };
  for (const result of results) {
    counts[result.status] += 1;
  }
  return Object.freeze({
    ...counts,
    verdict: verdict(results).verdict,
  });
}
