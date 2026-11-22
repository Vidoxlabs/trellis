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
} from '../src/index.mjs';

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

test('the default myosotis probes pass against a faithful fixture', () => {
  const subject = { namespace: memoryFixture(), pkg: null };
  const results = myosotisProbes.map((p) => runProbe(p, { myosotis: subject }));
  const failed = results.filter((r) => r.status !== 'pass');
  assert.deepEqual(failed, []);
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
