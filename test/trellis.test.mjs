// Trellis engine tests. The core never imports a sibling; fixtures stand in
// as subjects with real shapes, and the verdict math is checked on the record.

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  POINTS,
  ProbeError,
  probe,
  probeList,
  runProbe,
  verdict,
  rollup,
  familyGrid,
  FAMILY_MEMBERS,
  defaultProbes,
  myosotisProbes,
  seedProbes,
  aestivationProbes,
  droseraProbes,
  crossProbes,
  VERSION,
} from '../src/index.mjs';
import { readFileSync } from 'node:fs';

const pass = () => ({ ok: true });
const fail = () => ({ ok: false, message: 'declared fail' });

test('the set of points is exactly the four', () => {
  assert.deepEqual([...POINTS].sort(), ['behavior', 'consistency', 'operational', 'shape']);
});

test('a probe check is a function by construction: prose is rejected', () => {
  const good = probe({
    id: 'well-formed', point: 'shape', applies: 'seed',
    summary: 'Guarantee stated.', check: pass,
  });
  assert.equal(good.point, 'shape');
  assert.throws(
    () => probe({ id: 'x', point: 'shape', applies: 'seed', summary: 's', check: 'check the exports' }),
    /check must be a function/
  );
});

test('a probe with an unknown point or empty applies is rejected', () => {
  assert.throws(() => probe({ id: 'x', point: 'vibes', applies: 'seed', summary: 's', check: pass }), /point must be one of/);
  assert.throws(() => probe({ id: 'x', point: 'shape', applies: '', summary: 's', check: pass }), /applies/);
});

test('a probe list refuses duplicate ids', () => {
  const a = probe({ id: 'dupe', point: 'shape', applies: 'seed', summary: 's', check: pass });
  assert.throws(() => probeList([a, a]), /duplicate probe id/);
});

test('execution fails closed: a thrown check is a failed probe, never a skip', () => {
  const throwing = probe({
    id: 'throwing', point: 'behavior', applies: 'seed', summary: 's',
    check: () => { throw new Error('invariant broken'); },
  });
  const result = runProbe(throwing, { seed: { namespace: {}, pkg: null } });
  assert.equal(result.status, 'fail');
  assert.match(result.detail, /probe threw: invariant broken/);
});

test('an absent subject is a declared unknown, never a silent skip', () => {
  const p = probe({ id: 'needs-seed', point: 'shape', applies: 'seed', summary: 's', check: pass });
  const result = runProbe(p, {});
  assert.equal(result.status, 'unknown');
  assert.match(result.detail, /checkout absent/);
  const nullSubject = runProbe(p, { seed: null });
  assert.equal(nullSubject.status, 'unknown');
});

test('a check may declare unknown with its reason', () => {
  const p = probe({
    id: 'needs-both', point: 'consistency', applies: '*',
    summary: 's',
    check: (_subject, subjects) => (!subjects.seed || !subjects.drosera
      ? { unknown: true, message: 'needs both checkouts' }
      : { ok: true }),
  });
  const result = runProbe(p, { seed: { namespace: {}, pkg: null } });
  assert.equal(result.status, 'unknown');
  assert.match(result.detail, /needs both checkouts/);
});

test('verdict math is a strictness order, not an average', () => {
  const results = (statuses) => statuses.map((status, index) => ({ status, id: `r-${index}` }));
  assert.equal(verdict(results(['pass', 'pass'])).verdict, 'pass');
  assert.equal(verdict(results(['pass', 'unknown'])).verdict, 'unknown');
  assert.equal(verdict(results(['pass', 'unknown', 'fail'])).verdict, 'fail');
  const oneFail = verdict(results(['pass', 'fail', 'unknown']));
  assert.deepEqual(oneFail.failures, ['r-1']);
});

test('rollup counts by status and carries the verdict', () => {
  const up = rollup([{ status: 'pass' }, { status: 'pass' }, { status: 'fail' }]);
  assert.deepEqual(
    { pass: up.pass, fail: up.fail, unknown: up.unknown, verdict: up.verdict },
    { pass: 2, fail: 1, unknown: 0, verdict: 'fail' }
  );
});

test('the grid runs probes against injected subjects and keeps points separate', () => {
  const subjects = { seed: { namespace: {}, pkg: null } };
  const probes = [
    probe({ id: 'seed-shape', point: 'shape', applies: 'seed', summary: 's', check: pass }),
    probe({ id: 'seed-broken', point: 'behavior', applies: 'seed', summary: 's', check: fail }),
    probe({ id: 'ghost-shape', point: 'shape', applies: 'ghost', summary: 's', check: pass }),
  ];
  const grid = familyGrid({ subjects, probes });
  assert.equal(grid.verdict, 'fail');
  const seedBucket = grid.bySubject.seed;
  assert.equal(seedBucket.points.shape.pass, 1);
  assert.equal(seedBucket.points.behavior.fail, 1);
  assert.equal(grid.bySubject.ghost.verdict, 'unknown');
  assert.deepEqual(grid.failures, ['seed-broken']);
  assert.ok(grid.unknowns.includes('ghost-shape'));
});

test('a cross probe receives the whole subject map', () => {
  let saw = null;
  const cross = probe({
    id: 'cross-sees-all', point: 'consistency', applies: '*',
    summary: 's',
    check: (_subject, subjects) => { saw = Object.keys(subjects).sort(); return { ok: true }; },
  });
  const grid = familyGrid({
    subjects: { seed: { namespace: {}, pkg: null }, myosotis: { namespace: {}, pkg: null } },
    probes: [cross],
  });
  assert.deepEqual(saw, ['myosotis', 'seed']);
  assert.equal(grid.bySubject['*'].points.consistency.pass, 1);
});

// A fixture subject with the myosotis shape, semantics intact — the default
// probes must pass against a faithful implementation and fail against a
// broken one.
function memoryFixture({ brokenForget = false } = {}) {
  const store0 = { epoch: 0, records: [] };
  const memoryRecord = (input) => {
    const kinds = new Set(['organizational', 'personal-consented', 'active-thread', 'unconfirmed']);
    if (!input || !input.id || !input.text || !input.scope || !kinds.has(input.kind)) {
      throw new Error('invalid memory record');
    }
    return Object.freeze({ ...input });
  };
  const consentState = ({ grants = [], revocations = [] } = {}) => {
    const revoked = new Set(revocations.map((r) => `${r.subject}::${r.scope}`));
    const active = grants.filter((g) => !revoked.has(`${g.subject}::${g.scope}`));
    return { hasConsentFor: (scope) => active.some((g) => g.scope === scope) };
  };
  return {
    VERSION: '0.1.0',
    MEMORY_KINDS: new Set(['organizational', 'personal-consented', 'active-thread', 'unconfirmed']),
    memoryRecord,
    requiresConsent: (kind) => kind === 'personal-consented',
    consentState,
    openStore: () => store0,
    admitMemory: (store, state, input) => {
      let record;
      try {
        record = memoryRecord(input);
      } catch (error) {
        return { store, admitted: false, reason: error.message };
      }
      if (input.kind === 'personal-consented' && !state.hasConsentFor(input.scope)) {
        return { store, admitted: false, reason: 'consent required' };
      }
      return { store: { epoch: store.epoch, records: [...store.records, record] }, admitted: true };
    },
    forgetMemory: (store, id) => {
      const hit = store.records.find((r) => r.id === id);
      if (!hit) {
        return { store, status: 'unknown', forgotten: null };
      }
      if (brokenForget) {
        // The lie this fabric exists to catch: remove without the epoch bump.
        return { store: { epoch: store.epoch, records: store.records.filter((r) => r.id !== id) }, status: 'forgotten', forgotten: hit };
      }
      return {
        store: { epoch: store.epoch + 1, records: store.records.filter((r) => r.id !== id) },
        status: 'forgotten', forgotten: hit,
      };
    },
    recallAll: (store) => store.records,
    projectionStamp: (store) => store.epoch,
    projectionIsValid: (store, stamp) => stamp === store.epoch,
  };
}

test('the default myosotis probes pass against a faithful 0.1.0 fixture, and later claims stay unknown', () => {
  const subject = { namespace: memoryFixture(), pkg: null };
  const results = myosotisProbes.map((p) => runProbe(p, { myosotis: subject }));
  assert.deepEqual(results.filter((r) => r.status === 'fail'), []);
  const unknown = results.filter((r) => r.status === 'unknown');
  assert.deepEqual(unknown.map((r) => r.id), ['myosotis-stale-projection-refused', 'myosotis-reconsent-by-sequence']);
  for (const result of unknown) assert.match(result.detail, /arrived in 0\.[23]\.0; this checkout declares 0\.1\.0/);
});

test('a broken forget fails the structural probe and nothing launders it', () => {
  const subject = { namespace: memoryFixture({ brokenForget: true }), pkg: null };
  const results = myosotisProbes.map((p) => runProbe(p, { myosotis: subject }));
  const structural = results.find((r) => r.id === 'myosotis-forget-is-structural');
  assert.equal(structural.status, 'fail');
  assert.match(structural.detail, /epoch/);
  const honest = results.filter((r) => r.status === 'pass');
  assert.ok(honest.some((r) => r.id === 'myosotis-consent-precedes-keep'));
});

function seedFixture() {
  const VERBS = new Set(['read', 'write', 'create', 'update', 'delete', 'list', 'search', 'execute', 'cancel', 'verify']);
  return {
    VERSION: '0.1.0',
    RESERVED_DOMAINS: new Set(['vcs', 'docs', 'edge', 'telemetry', 'memory', 'ingest', 'compute', 'context']),
    parseToolId: (id) => {
      if (!id.startsWith('memory.note.create')) return null;
      return { domain: 'memory', resource: 'note', sub: null, verb: 'create' };
    },
  };
}

test('a fixture namespace with drifting reserved domains fails the anchor probe', () => {
  const drift = { namespace: { ...seedFixture(), RESERVED_DOMAINS: new Set(['docs']) }, pkg: null };
  const results = seedProbes.map((p) => runProbe(p, { seed: drift }));
  const anchor = results.find((r) => r.id === 'seed-reserved-domains-anchor');
  assert.equal(anchor.status, 'fail');
  assert.match(anchor.detail, /memory/);
});

test('the default probe lists cover each member from at least two in-process points', () => {
  for (const [name, list] of [
    ['seed', seedProbes],
    ['capillary', defaultProbes.filter((p) => p.applies === 'capillary')],
    ['myosotis', myosotisProbes],
    ['aestivation', defaultProbes.filter((p) => p.applies === 'aestivation')],
    ['drosera', defaultProbes.filter((p) => p.applies === 'drosera')],
  ]) {
    const points = new Set(list.map((p) => p.point));
    // The operational point approaches through the bundle runner; these
    // lists cover the points that load-bearing behavior can check in-process.
    assert.ok(points.has('shape'), `${name} probes its shape`);
    assert.ok(points.has('behavior'), `${name} probes its behavior`);
  }
});

test('the family members list is exactly the five module repos', () => {
  assert.deepEqual([...FAMILY_MEMBERS].sort(), ['aestivation', 'capillary', 'drosera', 'myosotis', 'seed']);
});

test('an empty grid is a pass, and the grid freezes its results', () => {
  const grid = familyGrid({ subjects: {}, probes: [] });
  assert.equal(grid.verdict, 'pass');
  assert.equal(Object.isFrozen(grid), true);
  assert.throws(() => { grid.results.push('x'); }, TypeError);
});

// Claims that arrived after 0.1.0. Each probe holds its claim from the
// version that made it, and fails a subject at that version that breaks it.

const byId = (list, id) => list.find((p) => p.id === id);

test('a claim is probed only from the version that made it', () => {
  const p = byId(seedProbes, 'seed-admission-holds-at-intent');
  const older = runProbe(p, { seed: { namespace: { VERSION: '0.1.9' }, pkg: null } });
  assert.equal(older.status, 'unknown');
  assert.match(older.detail, /arrived in 0\.2\.0; this checkout declares 0\.1\.9/);
  const undeclared = runProbe(p, { seed: { namespace: {}, pkg: null } });
  assert.equal(undeclared.status, 'unknown');
  assert.match(undeclared.detail, /declares no x\.y\.z VERSION/);
  // At the version, the claim is held: a namespace that cannot honor it fails, it is not excused.
  const atVersion = runProbe(p, { seed: { namespace: { VERSION: '0.10.0' }, pkg: null } });
  assert.equal(atVersion.status, 'fail');
});

function runModelFixture({ admitsAnything = false } = {}) {
  return {
    VERSION: '0.2.0',
    createObjective: (input) => ({ ...input, status: 'draft' }),
    transition: (objective, to) => ({ ...objective, status: to }),
    createAttemptRecord: ({ objective }) => ({ objectiveId: objective.id, allowedTools: [...objective.allowedTools], recordedIntents: [] }),
    recordIntent: (attempt, intent) => {
      if (!admitsAnything && !(Array.isArray(attempt.allowedTools) && attempt.allowedTools.includes(intent.toolId))) {
        throw new Error('not admitted');
      }
      return { ...attempt, recordedIntents: [...attempt.recordedIntents, intent] };
    },
  };
}

test('the admission probe passes a faithful run model and fails one that admits anything', () => {
  const p = byId(seedProbes, 'seed-admission-holds-at-intent');
  assert.equal(runProbe(p, { seed: { namespace: runModelFixture(), pkg: null } }).status, 'pass');
  const broken = runProbe(p, { seed: { namespace: runModelFixture({ admitsAnything: true }), pkg: null } });
  assert.equal(broken.status, 'fail');
  assert.match(broken.detail, /off the admission list/);
});

function gateFixture({ ignoresDigest = false } = {}) {
  return {
    VERSION: '0.3.0',
    planProposal: ({ id, objective, steps }) => ({ id, objective, steps, digest: JSON.stringify(steps).length.toString(16).padStart(64, '0') }),
    validatePlan: () => ({ ok: true, errors: [] }),
    verdictRecord: (input) => ({ planDigest: null, reasons: [], ...input }),
    assemblyGate: ({ verdicts, planDigest }) => {
      const latest = verdicts.at(-1);
      if (!ignoresDigest && planDigest !== undefined && latest.planDigest !== planDigest) {
        return { permitted: false, held: 'review-stale', verdict: latest };
      }
      return { permitted: true, held: null, verdict: latest };
    },
  };
}

test('the digest probe fails a gate that lets an old approval open a changed plan', () => {
  const p = byId(aestivationProbes, 'aestivation-review-binds-to-digest');
  assert.equal(runProbe(p, { aestivation: { namespace: gateFixture(), pkg: null } }).status, 'pass');
  const broken = runProbe(p, { aestivation: { namespace: gateFixture({ ignoresDigest: true }), pkg: null } });
  assert.equal(broken.status, 'fail');
  assert.match(broken.detail, /earlier version opened the gate/);
});

const SEED_FORBIDDEN = ['openai', 'anthropic', 'claude', 'chatgpt', 'gemini', 'grok', 'copilot', 'cursor', 'http', 'https', 'websocket', 'grpc', 'sdk'];

function grammarSubject(forbidden = SEED_FORBIDDEN) {
  return {
    namespace: {
      VERSION: '0.2.0',
      parseToolId: (id) => {
        if (id.split('.').some((segment) => forbidden.includes(segment))) throw new Error('vendor or protocol name');
        return {};
      },
    },
    pkg: null,
  };
}

function skillSubject({ vendors = SEED_FORBIDDEN.slice(0, 8), version = '0.3.0' } = {}) {
  return {
    namespace: {
      VERSION: version,
      VENDOR_NAMES: new Set(vendors),
      skill: ({ name }) => {
        if (name.split('-').some((word) => vendors.includes(word))) throw new Error('vendor or product name');
        return { name };
      },
    },
    pkg: null,
  };
}

test('the vendor lists agree when drosera holds exactly the vendor half of seed', () => {
  const p = byId(crossProbes, 'vendor-list-agreement');
  const result = runProbe(p, { seed: grammarSubject(), drosera: skillSubject() });
  assert.equal(result.status, 'pass');
});

test('the vendor probe names a vendor seed forbids that drosera lacks', () => {
  const p = byId(crossProbes, 'vendor-list-agreement');
  const result = runProbe(p, { seed: grammarSubject(), drosera: skillSubject({ vendors: SEED_FORBIDDEN.slice(0, 7) }) });
  assert.equal(result.status, 'fail');
  assert.match(result.detail, /seed forbids "cursor".*lacks it/);
});

test('the vendor probe names a word drosera refuses that seed admits, and a refused protocol word', () => {
  const p = byId(crossProbes, 'vendor-list-agreement');
  const extra = runProbe(p, { seed: grammarSubject(), drosera: skillSubject({ vendors: [...SEED_FORBIDDEN.slice(0, 8), 'mistral'] }) });
  assert.equal(extra.status, 'fail');
  assert.match(extra.detail, /refuses "mistral".*seed admits it/);
  const protocol = runProbe(p, { seed: grammarSubject(), drosera: skillSubject({ vendors: [...SEED_FORBIDDEN.slice(0, 8), 'http'] }) });
  assert.equal(protocol.status, 'fail');
  assert.match(protocol.detail, /protocol word "http"/);
});

test('the vendor probe is unknown without both checkouts or before drosera 0.3.0', () => {
  const p = byId(crossProbes, 'vendor-list-agreement');
  assert.equal(runProbe(p, { seed: grammarSubject(), drosera: null }).status, 'unknown');
  const older = runProbe(p, { seed: grammarSubject(), drosera: skillSubject({ version: '0.2.0' }) });
  assert.equal(older.status, 'unknown');
  assert.match(older.detail, /arrived in drosera 0\.3\.0/);
});

test('the skill-name probe fails a drosera that refuses substrings', () => {
  const p = byId(droseraProbes, 'drosera-skill-names-refuse-vendors');
  const substring = {
    VERSION: '0.3.0',
    skill: ({ name }) => { if (/claude|gemini/.test(name)) throw new Error('vendor'); return { name }; },
  };
  const result = runProbe(p, { drosera: { namespace: substring, pkg: null } });
  assert.equal(result.status, 'fail');
  assert.match(result.detail, /claudette-notes/);
});

test('the exported version matches the package', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(VERSION, pkg.version);
});
