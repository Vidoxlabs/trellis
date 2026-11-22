// Trellis probes: deterministic checks, each dedicated to one point, each
// fail closed. Hooks in the tooling fabric set the shape rule; probes inherit.

export const POINTS = Object.freeze(
  new Set(['shape', 'behavior', 'consistency', 'operational'])
);

export class ProbeError extends Error {
  constructor(issues) {
    super(Array.isArray(issues) ? `invalid probe: ${issues.join('; ')}` : issues);
    this.name = 'ProbeError';
    this.issues = Array.isArray(issues) ? issues : [];
  }
}

export function probe({ id, point, applies, summary, check } = {}) {
  const issues = [];
  if (typeof id !== 'string' || !/^[a-z][a-z0-9-]*$/.test(id)) {
    issues.push('id must be kebab-case: lowercase letters, digits, or hyphens, starting with a letter');
  }
  if (!POINTS.has(point)) {
    issues.push(`point must be one of ${[...POINTS].join(', ')} (got ${JSON.stringify(point)})`);
  }
  if (typeof applies !== 'string' || applies.length === 0) {
    issues.push('applies must be a subject name or "*"');
  }
  if (typeof summary !== 'string' || summary.length === 0) {
    issues.push('summary must be a non-empty statement of what the probe guarantees');
  }
  if (typeof check !== 'function') {
    issues.push('check must be a function: probes are deterministic code, not prose');
  }
  if (issues.length > 0) throw new ProbeError(issues);
  return Object.freeze({ id, point, applies, summary, check });
}

export function probeList(probes = []) {
  if (!Array.isArray(probes)) throw new ProbeError('a probe list takes a list of probes');
  const byId = new Map();
  for (const item of probes) {
    const checked = item && Object.isFrozen(item) && POINTS.has(item.point) ? item : probe(item);
    if (byId.has(checked.id)) {
      throw new ProbeError(`duplicate probe id "${checked.id}": a probe list holds one probe per id`);
    }
    byId.set(checked.id, checked);
  }
  return Object.freeze([...byId.values()]);
}

const isThenable = (value) => value !== null
  && (typeof value === 'object' || typeof value === 'function')
  && typeof value.then === 'function';

function result(aProbe, status, detail) {
  return Object.freeze({
    id: aProbe.id,
    applies: aProbe.applies,
    point: aProbe.point,
    subject: aProbe.applies,
    status,
    detail,
  });
}

function subjectFor(aProbe, subjects) {
  return aProbe.applies === '*' ? subjects : (subjects[aProbe.applies] ?? null);
}

function settle(aProbe, verdict) {
  if (verdict && verdict.unknown === true) {
    return result(aProbe, 'unknown', verdict.message ?? 'probe declared unknown');
  }
  const passed = Boolean(verdict && verdict.ok === true);
  return result(aProbe, passed ? 'pass' : 'fail', verdict?.message ?? (passed ? 'ok' : 'check returned ok !== true'));
}

// Fail closed: a thrown probe is a failed probe, never a skipped one.
const thrown = (aProbe, error) => result(aProbe, 'fail', `probe threw: ${error?.message ?? String(error)}`);

/**
 * Run one probe and wait for nothing. A check that returns a promise was not
 * observed by this runner: the result is `unknown`, naming runProbeAsync, and the
 * promise's outcome is dropped rather than guessed.
 */
export function runProbe(aProbe, subjects) {
  const subject = subjectFor(aProbe, subjects);
  if (subject === null || subject === undefined) return result(aProbe, 'unknown', 'checkout absent');
  try {
    const verdict = aProbe.check(subject, subjects);
    if (isThenable(verdict)) {
      Promise.resolve(verdict).catch(() => {});
      return result(aProbe, 'unknown', 'the check is asynchronous; run it with runProbeAsync');
    }
    return settle(aProbe, verdict);
  } catch (error) {
    return thrown(aProbe, error);
  }
}

/** Run one probe and await its check. Same results as runProbe for a synchronous check. */
export async function runProbeAsync(aProbe, subjects) {
  const subject = subjectFor(aProbe, subjects);
  if (subject === null || subject === undefined) return result(aProbe, 'unknown', 'checkout absent');
  try {
    return settle(aProbe, await aProbe.check(subject, subjects));
  } catch (error) {
    return thrown(aProbe, error);
  }
}
