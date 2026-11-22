// Trellis grid: run a probe list against injected subjects and roll the
// results up per subject and per point. The grid never loads a sibling;
// absence is data, declared unknown.

import { probeList, runProbe } from './point.mjs';
import { verdict, rollup } from './score.mjs';

const POINT_ORDER = ['shape', 'behavior', 'consistency', 'operational'];

function emptyPoints() {
  const points = {};
  for (const point of POINT_ORDER) points[point] = { pass: 0, fail: 0, unknown: 0 };
  return points;
}

export function familyGrid({ subjects = {}, probes = [] } = {}) {
  const list = probeList(probes);
  const results = Object.freeze(list.map((aProbe) => runProbe(aProbe, subjects)));

  // A probe may apply to a subject absent from the map: that is where its
  // declared unknown lives, so the bucket exists even though the checkout
  // does not.
  const perSubjectResults = new Map();
  const bySubject = new Map();
  const bucketFor = (name) => {
    if (!perSubjectResults.has(name)) {
      perSubjectResults.set(name, []);
      bySubject.set(name, { points: emptyPoints() });
    }
    return name;
  };
  for (const name of Object.keys(subjects)) bucketFor(name);
  bucketFor('*');

  for (const result of results) {
    bucketFor(result.applies);
    perSubjectResults.get(result.applies).push(result);
    bySubject.get(result.applies).points[result.point][result.status] += 1;
  }

  const bySubjectOut = {};
  for (const [name, own] of perSubjectResults) {
    bySubjectOut[name] = Object.freeze({
      points: Object.freeze(bySubject.get(name).points),
      results: Object.freeze(own),
      ...rollup(own),
    });
  }

  const overall = verdict(results);
  return Object.freeze({
    results,
    bySubject: Object.freeze(bySubjectOut),
    verdict: overall.verdict,
    failures: overall.failures,
    unknowns: overall.unknowns,
  });
}
