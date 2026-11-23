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
  capillaryProbes,
  runProbeAsync,
  familyGridAsync,
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
  assert.deepEqual(unknown.map((r) => r.id), [
    'myosotis-stale-projection-refused', 'myosotis-reconsent-by-sequence', 'myosotis-forget-confirmed-and-keyed',
    'myosotis-personal-provenance-required', 'myosotis-bounded-recall',
  ]);
  for (const result of unknown) assert.match(result.detail, /arrived in (0\.[234]\.0|1\.[01]\.0); this checkout declares 0\.1\.0/);
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

// Myosotis 0.4.0 and drosera 0.4.0 changed their call shapes on purpose: a forget is
// confirmed and keyed, and a skill carries procedure, guardrails, and verification.
// The probes speak each version's shape and hold the new claims from 0.4.0.

const sha = (text) => `d${text.length.toString(16).padStart(63, '0')}`;

function memoryFixture040({ bareIdForgets = false, keyBumpsAgain = false, projectsText = false } = {}) {
  const kinds = new Set(['organizational', 'personal-consented', 'active-thread', 'unconfirmed']);
  const open = () => ({ epoch: 0, records: [], tombstones: [], receipts: [] });
  const active = (store) => store.records.filter((r) => r.state === 'active');
  const projection = (store) => ({
    stamp: store.epoch,
    records: active(store).map((r) => (projectsText ? { ...r } : { id: r.id, digest: r.digest })),
  });
  return {
    VERSION: '0.4.0',
    MEMORY_KINDS: kinds,
    memoryRecord: (input) => {
      if (!input || !input.id || !input.text || !input.scope || !kinds.has(input.kind)) throw new Error('invalid memory record');
      return { ...input };
    },
    requiresConsent: (kind) => kind === 'personal-consented',
    consentState: ({ grants = [] } = {}) => ({ hasConsentFor: (scope) => grants.some((g) => g.scope === scope) }),
    openStore: open,
    admitMemory: (store, state, input) => {
      if (!kinds.has(input.kind)) return { store, admitted: false, reason: 'invalid memory record' };
      if (input.kind === 'personal-consented' && !state.hasConsentFor(input.scope)) return { store, admitted: false, reason: 'consent required' };
      const records = store.records.map((r) => (r.id === input.supersedes ? { ...r, state: 'superseded' } : r));
      const record = { ...input, supersedes: input.supersedes ?? null, digest: sha(input.text), state: 'active' };
      return { store: { ...store, records: [...records, record] }, admitted: true, record };
    },
    forgetMemory: (store, request) => {
      const bare = typeof request === 'string';
      if (bare && !bareIdForgets) return { store, status: 'refused', reason: 'confirmation-required', forgotten: null };
      const { id, confirmed, key } = bare ? { id: request, confirmed: true, key: request } : request;
      if (confirmed !== true) return { store, status: 'refused', reason: 'confirmation-required', forgotten: null };
      if (store.receipts.some((r) => r.key === key)) {
        // The defect under test: a replay that moves the epoch a second time.
        if (keyBumpsAgain) return { store: { ...store, epoch: store.epoch + 1 }, status: 'replayed', forgotten: null };
        return { store, status: 'replayed', forgotten: null };
      }
      let hit = store.records.find((r) => r.id === id);
      if (!hit) return { store, status: 'unknown', forgotten: null };
      const chain = [];
      for (let at = hit; at; at = store.records.find((r) => r.id === at.supersedes)) chain.push(at);
      const epoch = store.epoch + 1;
      return {
        store: {
          epoch,
          records: store.records.filter((r) => !chain.includes(r)),
          tombstones: [...store.tombstones, ...chain.map((r) => ({ id: r.id, namedId: id, digest: r.digest, epoch }))],
          receipts: [...store.receipts, { key, id, epoch }],
        },
        status: 'forgotten',
        forgotten: hit,
      };
    },
    recallAll: active,
    projectionStamp: (store) => store.epoch,
    projectionIsValid: (store, stamp) => stamp === store.epoch,
    buildProjection: projection,
    readProjection: (store, given) => (given.stamp === store.epoch
      ? { status: 'current', records: given.records }
      : { status: 'refused', reason: 'stale', records: null }),
    recallCurrent: (store, given) => (given.stamp === store.epoch
      ? { projection: given, records: active(store), rebuilt: false }
      : { projection: projection(store), records: active(store), rebuilt: true }),
  };
}

test('the myosotis probes speak the 0.4.0 forget shape and pass a faithful 0.4.0 fixture', () => {
  const subject = { namespace: memoryFixture040(), pkg: null };
  const results = myosotisProbes
    .filter((p) => p.id !== 'myosotis-reconsent-by-sequence')            // consent ordering is not modeled here
    .map((p) => runProbe(p, { myosotis: subject }));
  assert.deepEqual(results.filter((r) => r.status === 'fail').map((r) => [r.id, r.detail]), []);
  assert.deepEqual(results.filter((r) => r.status === 'unknown').map((r) => r.id), [
    'myosotis-personal-provenance-required', 'myosotis-bounded-recall',
  ]);
});

test('the 0.4.0 forget probe fails a fixture that forgets a bare id, re-bumps a key, or projects text', () => {
  const p = byId(myosotisProbes, 'myosotis-forget-confirmed-and-keyed');
  const bare = runProbe(p, { myosotis: { namespace: memoryFixture040({ bareIdForgets: true }), pkg: null } });
  assert.equal(bare.status, 'fail');
  assert.match(bare.detail, /unconfirmed forget changed the store/);
  const rebump = runProbe(p, { myosotis: { namespace: memoryFixture040({ keyBumpsAgain: true }), pkg: null } });
  assert.equal(rebump.status, 'fail');
  assert.match(rebump.detail, /bumped the epoch again/);
  const copies = runProbe(p, { myosotis: { namespace: memoryFixture040({ projectsText: true }), pkg: null } });
  assert.equal(copies.status, 'fail');
  assert.match(copies.detail, /second copy of the text/);
});

const LISTS = ['procedure', 'guardrails', 'verification'];

function skillSubject040({ deprecatedMoves = false } = {}) {
  const vendors = SEED_FORBIDDEN.slice(0, 8);
  const TRANSITIONS = { draft: ['promoted', 'deprecated'], promoted: ['deprecated'], deprecated: deprecatedMoves ? ['draft'] : [] };
  const skill = (input) => {
    if (!/^[a-z][a-z0-9-]*$/.test(input.name ?? '')) throw new Error('name');
    if (input.name.split('-').some((word) => vendors.includes(word))) throw new Error('vendor or product name');
    for (const field of LISTS) if (!Array.isArray(input[field]) || input[field].length === 0) throw new Error(field);
    return Object.freeze({ ...input, lifecycle: input.lifecycle ?? 'draft' });
  };
  return {
    namespace: {
      VERSION: '0.4.0',
      VENDOR_NAMES: new Set(vendors),
      LIFECYCLE_STATES: ['draft', 'promoted', 'deprecated'],
      skill,
      skillPack: (items) => items.map(skill),
      transitionSkill: (record, to) => {
        if (!TRANSITIONS[record.lifecycle].includes(to)) throw new Error('cannot move');
        return skill({ ...record, lifecycle: to });
      },
    },
    pkg: null,
  };
}

test('the drosera probes and the vendor agreement speak the 0.4.0 skill shape', () => {
  const drosera = skillSubject040();
  for (const id of ['drosera-skill-names-refuse-vendors', 'drosera-skill-record-and-lifecycle']) {
    const result = runProbe(byId(droseraProbes, id), { drosera });
    assert.equal(result.status, 'pass', `${id}: ${result.detail}`);
  }
  const agreement = runProbe(byId(crossProbes, 'vendor-list-agreement'), { seed: grammarSubject(), drosera });
  assert.equal(agreement.status, 'pass', agreement.detail);
});

// Drosera 1.0.0 also requires triggers, inputs, outputs, examples, and sources.
const SECTION_LISTS_100 = ['triggers', 'inputs', 'outputs', 'examples', 'sources'];

function skillSubject100({ acceptsMissing = null } = {}) {
  const previous = skillSubject040().namespace;
  const skill = (input) => {
    for (const field of SECTION_LISTS_100) {
      if (field === acceptsMissing) continue;
      if (!Array.isArray(input[field]) || input[field].length === 0) throw new Error(field);
    }
    return previous.skill(input);
  };
  const TRANSITIONS = { draft: ['promoted', 'deprecated'], promoted: ['deprecated'], deprecated: [] };
  return {
    namespace: {
      ...previous,
      VERSION: '1.0.0',
      skill,
      skillPack: (items) => items.map(skill),
      transitionSkill: (record, to) => {
        if (!TRANSITIONS[record.lifecycle].includes(to)) throw new Error('cannot move');
        return skill({ ...record, lifecycle: to });
      },
      skillCatalog: (entries) => {
        const listed = entries.map((entry) => ({ ...entry, skill: skill(entry.skill), slug: entry.skill.name }))
          .filter((entry) => entry.skill.lifecycle === 'promoted' && entry.license === 'MIT');
        return {
          list: () => listed,
          read: (slug) => { const item = listed.find((entry) => entry.slug === slug); if (!item) throw new Error('unavailable'); return item; },
        };
      },
    },
    pkg: null,
  };
}

test('the drosera probes and the vendor agreement speak the 1.0.0 skill shape', () => {
  const drosera = skillSubject100();
  for (const id of ['drosera-skill-names-refuse-vendors', 'drosera-skill-record-and-lifecycle', 'drosera-catalog-public-skills']) {
    const result = runProbe(byId(droseraProbes, id), { drosera });
    assert.equal(result.status, 'pass', `${id}: ${result.detail}`);
  }
  const agreement = runProbe(byId(crossProbes, 'vendor-list-agreement'), { seed: grammarSubject(), drosera });
  assert.equal(agreement.status, 'pass', agreement.detail);
});

test('the record probe fails a drosera 1.0.0 that accepts a skill without a required section list', () => {
  const p = byId(droseraProbes, 'drosera-skill-record-and-lifecycle');
  for (const field of SECTION_LISTS_100) {
    const result = runProbe(p, { drosera: skillSubject100({ acceptsMissing: field }) });
    assert.equal(result.status, 'fail');
    assert.match(result.detail, new RegExp(`without ${field} was accepted`));
  }
});

// Drosera 2.0.0 promotes only through review: intake, draft, review, promoted, deprecated.
function skillSubject200({ promotesDraft = false } = {}) {
  const previous = skillSubject100().namespace;
  const TRANSITIONS = {
    intake: ['draft', 'deprecated'],
    draft: promotesDraft ? ['review', 'promoted', 'deprecated'] : ['review', 'deprecated'],
    review: ['promoted', 'draft', 'deprecated'],
    promoted: ['deprecated'],
    deprecated: [],
  };
  return {
    namespace: {
      ...previous,
      VERSION: '2.0.0',
      LIFECYCLE_STATES: ['intake', 'draft', 'review', 'promoted', 'deprecated'],
      transitionSkill: (record, to) => {
        if (!TRANSITIONS[record.lifecycle].includes(to)) throw new Error('cannot move');
        return previous.skill({ ...record, lifecycle: to });
      },
    },
    pkg: null,
  };
}

test('the drosera probes promote through review for a 2.0.0 checkout', () => {
  const drosera = skillSubject200();
  for (const id of ['drosera-skill-record-and-lifecycle', 'drosera-catalog-public-skills', 'drosera-skill-names-refuse-vendors']) {
    const result = runProbe(byId(droseraProbes, id), { drosera });
    assert.equal(result.status, 'pass', `${id}: ${result.detail}`);
  }
});

test('the record probe fails a drosera 2.0.0 that promotes a draft directly or keeps three states', () => {
  const p = byId(droseraProbes, 'drosera-skill-record-and-lifecycle');
  const direct = runProbe(p, { drosera: skillSubject200({ promotesDraft: true }) });
  assert.equal(direct.status, 'fail');
  assert.match(direct.detail, /draft was promoted without review/);
  const three = skillSubject200();
  three.namespace.LIFECYCLE_STATES = ['draft', 'promoted', 'deprecated'];
  assert.match(runProbe(p, { drosera: three }).detail, /lifecycle states drifted/);
});

test('the lifecycle probe fails a drosera whose deprecated skills move, and is unknown before 0.4.0', () => {
  const p = byId(droseraProbes, 'drosera-skill-record-and-lifecycle');
  const moving = runProbe(p, { drosera: skillSubject040({ deprecatedMoves: true }) });
  assert.equal(moving.status, 'fail');
  assert.match(moving.detail, /deprecated skill moved to draft/);
  const older = runProbe(p, { drosera: skillSubject() });
  assert.equal(older.status, 'unknown');
  assert.match(older.detail, /arrived in 0\.4\.0; this checkout declares 0\.3\.0/);
});

// The engine waits for an asynchronous check only when asked to. The synchronous
// runner reports what it did not observe as unknown, never as a pass.

test('the synchronous runner declares an asynchronous check unknown; the async runner observes it', async () => {
  const later = probe({ id: 'later', point: 'behavior', applies: 'seed', summary: 's', check: async () => ({ ok: false, message: 'broken' }) });
  const subjects = { seed: { namespace: {}, pkg: null } };
  const sync = runProbe(later, subjects);
  assert.equal(sync.status, 'unknown');
  assert.match(sync.detail, /runProbeAsync/);
  const awaited = await runProbeAsync(later, subjects);
  assert.equal(awaited.status, 'fail');
  assert.equal(awaited.detail, 'broken');
  const rejecting = probe({ id: 'rejecting', point: 'behavior', applies: 'seed', summary: 's', check: async () => { throw new Error('boom'); } });
  assert.equal(runProbe(rejecting, subjects).status, 'unknown');           // the dropped rejection is not unhandled
  assert.match((await runProbeAsync(rejecting, subjects)).detail, /probe threw: boom/);
  const grid = await familyGridAsync({ subjects, probes: [later, probe({ id: 'now', point: 'shape', applies: 'seed', summary: 's', check: pass })] });
  assert.equal(grid.verdict, 'fail');
  assert.equal(grid.bySubject.seed.points.behavior.fail, 1);
  assert.equal(grid.bySubject.seed.points.shape.pass, 1);
});

function seedFixture030({ reruns = false, runsPastFailure = false, sameHolderReclaims = false, admitsDisabled = false } = {}) {
  return {
    VERSION: '0.3.0',
    resumeSteps: async ({ steps, completed = [], execute }) => {
      const outcomes = [];
      let failed = false;
      for (const step of steps) {
        if (completed.includes(step.id) && !reruns) { outcomes.push({ id: step.id, outcome: 'skipped' }); continue; }
        if (failed && !runsPastFailure) { outcomes.push({ id: step.id, outcome: 'not_reached' }); continue; }
        const result = await execute(step);
        if (result.ok) outcomes.push({ id: step.id, outcome: 'succeeded' });
        else { failed = true; outcomes.push({ id: step.id, outcome: 'failed' }); }
      }
      return { status: failed ? 'failed' : 'complete', steps: outcomes };
    },
    claimLease: (current, { holder, ttlMs, now }) => {
      const live = current && now < Date.parse(current.expiresAt);
      if (live && !(sameHolderReclaims && current.holder === holder)) throw new Error('lease held');
      return { leaseId: `l-${now}`, holder, acquiredAt: new Date(now).toISOString(), expiresAt: new Date(now + ttlMs).toISOString() };
    },
    admitCaller: (registry, { callerId, command }) => {
      if (!registry?.callers || !registry?.commands) return { admitted: false, code: 'registry-unavailable' };
      const caller = registry.callers.find((c) => c.id === callerId);
      if (!caller) return { admitted: false, code: 'caller-unknown' };
      if (!caller.enabled && !admitsDisabled) return { admitted: false, code: 'caller-disabled' };
      const mapping = registry.commands.find((c) => c.command.join(' ') === command.join(' '));
      if (!mapping) return { admitted: false, code: 'command-unmapped' };
      if (!caller.allowedTools.includes(mapping.toolId)) return { admitted: false, code: 'tool-not-allowed' };
      return { admitted: true, callerId, toolId: mapping.toolId };
    },
  };
}

const runSeed = (id, options) => runProbeAsync(byId(seedProbes, id), { seed: { namespace: seedFixture030(options), pkg: null } });

test('the seed 0.3.0 probes pass a faithful fixture and fail each broken one', async () => {
  for (const id of ['seed-resume-skips-and-stops', 'seed-lease-refuses-second-runner', 'seed-caller-admission-fails-closed']) {
    const result = await runSeed(id);
    assert.equal(result.status, 'pass', `${id}: ${result.detail}`);
  }
  assert.match((await runSeed('seed-resume-skips-and-stops', { reruns: true })).detail, /completed step ran again/);
  assert.match((await runSeed('seed-resume-skips-and-stops', { runsPastFailure: true })).detail, /after the failure ran/);
  assert.match((await runSeed('seed-lease-refuses-second-runner', { sameHolderReclaims: true })).detail, /second claim by "runner-a"/);
  assert.match((await runSeed('seed-caller-admission-fails-closed', { admitsDisabled: true })).detail, /caller-disabled/);
  const older = await runProbeAsync(byId(seedProbes, 'seed-resume-skips-and-stops'), { seed: { namespace: { VERSION: '0.2.0' }, pkg: null } });
  assert.equal(older.status, 'unknown');
});

function capillaryFixture030({ fuses = false, servesMovedEpoch = false } = {}) {
  const build = ({ items }) => ({
    items: items.map((item) => {
      if (Object.hasOwn(item, 'score') && !fuses) throw new Error('fused score');
      return fuses
        ? { id: item.id, score: item.relevance ?? item.recency ?? 0, relevance: item.relevance ?? 0, recency: item.recency ?? 0 }
        : { id: item.id, relevance: item.relevance ?? null, recency: item.recency ?? null };
    }),
  });
  return {
    VERSION: '0.3.0',
    buildContextPacket: build,
    buildEpochGuardedPacket: async ({ readEpoch, read }) => {
      const start = await readEpoch();
      const rows = await read();
      const end = await readEpoch();
      if (start !== end && !servesMovedEpoch) return { refused: true, code: 'deletion-epoch-changed', epochStart: start, epochEnd: end };
      return { ...build(rows), deletionEpoch: start };
    },
  };
}

test('the capillary 0.3.0 probes pass a faithful fixture and fail each broken one', async () => {
  const run = (id, options) => runProbeAsync(byId(capillaryProbes, id), { capillary: { namespace: capillaryFixture030(options), pkg: null } });
  assert.equal((await run('capillary-relevance-and-recency-separate')).status, 'pass');
  assert.equal((await run('capillary-moved-epoch-refuses-packet')).status, 'pass');
  assert.match((await run('capillary-relevance-and-recency-separate', { fuses: true })).detail, /merged or filled in/);
  assert.match((await run('capillary-moved-epoch-refuses-packet', { servesMovedEpoch: true })).detail, /epoch moved under was served/);
});

function aestivationFixture040({ intentAddsTools = false, mutatesPlan = false, judgeMayApply = false } = {}) {
  const real = new WeakSet();
  const digestOf = (value) => JSON.stringify(value).length.toString(16).padStart(64, '0');
  return {
    VERSION: '0.4.0',
    intentAssessment: (input) => {
      if (!intentAddsTools && ('tools' in input || 'memoryWrites' in input)) throw new Error('grants nothing');
      const record = Object.freeze({ label: input.label, needs: input.needs ?? [], tools: input.tools });
      real.add(record);
      return record;
    },
    admitWithIntent: (admission, assessment) => {
      if (!intentAddsTools && !real.has(assessment)) throw new Error('not an assessment');
      return {
        allowedTools: [...admission.allowedTools, ...(intentAddsTools ? ['memory.note.write'] : [])],
        memoryWrites: [...(admission.memoryWrites ?? [])],
      };
    },
    planProposal: ({ id, objective, steps }) => ({ id, objective, steps, digest: digestOf({ id, objective, steps }) }),
    verdictRecord: (input) => ({ reasons: [], ...input }),
    correctPlan: ({ previous, verdict, author, steps }) => {
      if (author === verdict.judge && !judgeMayApply) throw new Error('reviewer cannot apply');
      if (mutatesPlan) previous.steps = steps;
      const proposal = { id: previous.id, objective: previous.objective, steps, digest: digestOf({ steps }) };
      return { proposal, correction: { previousDigest: previous.digest, digest: proposal.digest } };
    },
  };
}

test('the aestivation 0.4.0 probes pass a faithful fixture and fail each broken one', () => {
  const run = (id, options) => runProbe(byId(aestivationProbes, id), { aestivation: { namespace: aestivationFixture040(options), pkg: null } });
  assert.equal(run('aestivation-intent-grants-nothing').status, 'pass');
  assert.equal(run('aestivation-correction-new-digest').status, 'pass');
  assert.match(run('aestivation-intent-grants-nothing', { intentAddsTools: true }).detail, /carrying tools was accepted/);
  assert.match(run('aestivation-correction-new-digest', { judgeMayApply: true }).detail, /judge applied its own/);
  assert.match(run('aestivation-correction-new-digest', { mutatesPlan: true }).detail, /reviewed plan was mutated/);
  const older = runProbe(byId(aestivationProbes, 'aestivation-correction-new-digest'), { aestivation: { namespace: { VERSION: '0.3.0' }, pkg: null } });
  assert.equal(older.status, 'unknown');
});

test('the digest probe isolates digest validation on a classified source', () => {
  const namespace = {
    VERSION: '1.0.0',
    recordSource: (input) => {
      if (!input.evidenceClass || !input.confidence) throw new Error('classification required');
      return input;
    },
    buildContextPacket: () => { throw new Error('item digest invalid'); },
  };
  const result = runProbe(byId(capillaryProbes, 'capillary-digest-gates-admission'), { capillary: { namespace } });
  assert.equal(result.status, 'fail');
  assert.match(result.detail, /source with a malformed digest/);
});

test('the consent probe supplies valid personal metadata to myosotis 1.0.0', () => {
  const previous = memoryFixture040();
  const namespace = {
    ...previous, VERSION: '1.0.0',
    admitMemory: (store, state, input) => {
      if (input.kind === 'personal-consented' && (!input.sensitivity || input.provenance?.source !== 'explicit-user')) {
        return { store, admitted: false, reason: 'personal record fields required' };
      }
      return previous.admitMemory(store, state, input);
    },
  };
  const result = runProbe(byId(myosotisProbes, 'myosotis-consent-precedes-keep'), { myosotis: { namespace } });
  assert.equal(result.status, 'pass', result.detail);
});

// Seed 0.7.0 aborts before execute for its four abort codes, and an abort is not a dry run.
const ABORT_CODES_070 = ['operator-abort', 'lease-expired', 'policy-revoked', 'max-attempts-exceeded'];

function seedFixture070({ abortRunsSteps = false, abortsDryRun = false, codes = ABORT_CODES_070 } = {}) {
  const previous = seedFixture030();
  return {
    ...previous,
    VERSION: '0.7.0',
    resumeSteps: async (input) => {
      const { steps, completed = [], abort, dryRun = false } = input;
      if (abort === undefined || abortRunsSteps) return previous.resumeSteps(input);
      if (!codes.includes(abort)) throw new Error('abort must be a known code');
      if (dryRun && !abortsDryRun) throw new Error('abort and dryRun cannot be combined');
      return {
        status: 'aborted',
        abortCode: abort,
        completed: [...completed],
        steps: steps.map((step) => ({ id: step.id, outcome: completed.includes(step.id) ? 'skipped' : 'not_reached' })),
      };
    },
  };
}

test('the seed 0.7.0 abort probe passes a faithful fixture and fails each broken one', async () => {
  const p = byId(seedProbes, 'seed-abort-skips-execution');
  const run = (options) => runProbeAsync(p, { seed: { namespace: seedFixture070(options), pkg: null } });
  const faithful = await run();
  assert.equal(faithful.status, 'pass', faithful.detail);
  assert.match((await run({ abortRunsSteps: true })).detail, /aborted run \(operator-abort\) called execute/);
  assert.match((await run({ abortsDryRun: true })).detail, /abort together with a dry run was accepted/);
  const short = await run({ codes: ABORT_CODES_070.slice(0, 3) });
  assert.equal(short.status, 'fail');
  assert.match(short.detail, /max-attempts-exceeded was refused/);  // the probe holds its own list of codes
});

// Drosera 2.1.0 leaves a notice for review → promoted and for a move to deprecated.
function skillSubject210({ noticeForAnyPair = false, dropsApprover = false } = {}) {
  const previous = skillSubject200().namespace;
  return {
    namespace: {
      ...previous,
      VERSION: '2.1.0',
      transitionSkill: (record, to, { approver, reason } = {}) => Object.freeze({
        ...previous.transitionSkill(record, to),
        ...(to === 'promoted' ? { promotedBy: approver } : {}),
        ...(to === 'deprecated' ? { deprecatedReason: reason } : {}),
      }),
      lifecycleNotice: (before, after) => {
        if (before.lifecycle === 'review' && after.lifecycle === 'promoted') {
          return Object.freeze({ name: after.name, from: 'review', to: 'promoted', ...(dropsApprover ? {} : { approver: after.promotedBy }) });
        }
        if (after.lifecycle === 'deprecated' && before.lifecycle !== 'deprecated') {
          return Object.freeze({ name: after.name, from: before.lifecycle, to: 'deprecated', reason: after.deprecatedReason });
        }
        if (noticeForAnyPair) return Object.freeze({ name: after.name, from: before.lifecycle, to: after.lifecycle });
        throw new Error('not a lifecycle notice');
      },
    },
    pkg: null,
  };
}

test('the drosera 2.1.0 notice probe passes a faithful fixture and fails each broken one', () => {
  const p = byId(droseraProbes, 'drosera-lifecycle-notice-names-its-move');
  const faithful = runProbe(p, { drosera: skillSubject210() });
  assert.equal(faithful.status, 'pass', faithful.detail);
  assert.match(runProbe(p, { drosera: skillSubject210({ noticeForAnyPair: true }) }).detail, /draft to review move produced a lifecycle notice/);
  assert.match(runProbe(p, { drosera: skillSubject210({ dropsApprover: true }) }).detail, /promotion notice did not name its approver/);
  for (const id of ['drosera-skill-record-and-lifecycle', 'drosera-catalog-public-skills']) {
    const result = runProbe(byId(droseraProbes, id), { drosera: skillSubject210() });
    assert.equal(result.status, 'pass', `${id}: ${result.detail}`);
  }
});

// Drosera 2.2.0 reads a skill document's text and refuses one missing a required heading.
const SKILL_HEADINGS_220 = [
  'Summary', 'When to Use (Triggers)', 'Inputs', 'Outputs', 'Procedure / Steps',
  'Guardrails', 'Examples', 'Verification', 'Sources / Evidence',
];

function skillSubject220({ acceptsMissing = null, skipsSkill = false } = {}) {
  const previous = skillSubject210().namespace;
  const LIST_OF = {
    'When to Use (Triggers)': 'triggers', Inputs: 'inputs', Outputs: 'outputs', 'Procedure / Steps': 'procedure',
    Guardrails: 'guardrails', Examples: 'examples', Verification: 'verification', 'Sources / Evidence': 'sources',
  };
  return {
    namespace: {
      ...previous,
      VERSION: '2.2.0',
      skillFromMarkdown: (text) => {
        const sections = new Map();
        let current = null;
        for (const line of text.split('\n')) {
          const heading = /^##? (.+)$/.exec(line);
          if (heading) { current = heading[1]; sections.set(current, []); continue; }
          const item = /^- (.+)$/.exec(line);
          if (item && current) sections.get(current).push(item[1]);
        }
        for (const heading of SKILL_HEADINGS_220) {
          if (heading !== acceptsMissing && !(sections.get(heading)?.length > 0)) throw new Error(`missing heading "${heading}"`);
        }
        const input = {
          name: /^name: (.+)$/m.exec(text)?.[1],
          summary: /^description: (.+)$/m.exec(text)?.[1],
          ...Object.fromEntries(Object.entries(LIST_OF).map(([heading, field]) => [field, sections.get(heading) ?? ['filled in']])),
        };
        if (skipsSkill) return Object.freeze({ name: input.name, summary: input.summary, lifecycle: 'draft', sources: input.sources });
        return previous.skill(input);
      },
    },
    pkg: null,
  };
}

test('the drosera 2.2.0 document probe passes a faithful fixture and fails one that accepts a missing heading', () => {
  const p = byId(droseraProbes, 'drosera-skill-document-needs-every-heading');
  const faithful = runProbe(p, { drosera: skillSubject220() });
  assert.equal(faithful.status, 'pass', faithful.detail);
  for (const heading of ['Summary', 'Inputs', 'Sources / Evidence']) {
    const result = runProbe(p, { drosera: skillSubject220({ acceptsMissing: heading }) });
    assert.equal(result.status, 'fail');
    assert.ok(result.detail.includes(`without "${heading}" was accepted`), result.detail);
  }
  assert.match(runProbe(p, { drosera: skillSubject220({ skipsSkill: true }) }).detail, /does not pass skill\(\)/);
});

const followUpProbes = [
  ['seed', 'seed-dry-run-skips-execution', '0.5.0', '0.4.0', seedFixture030(), /dry run called execute/],
  ['capillary', 'capillary-recorded-evidence-required', '1.0.0', '0.3.0', {
    recordSource: input => ({ ...input, status: 'recorded' }),
  }, /omitted evidenceClass/],
  ['capillary', 'capillary-bounded-read-envelope', '1.1.0', '1.0.0', {
    recordSource: input => input,
    readSource: ({ text }) => ({ ok: true, untrusted: true, text, truncated: false }),
  }, /bounded read did not declare the cut/],
  ['myosotis', 'myosotis-personal-provenance-required', '1.0.0', '0.4.0', memoryFixture040(), /model-inferred provenance/],
  ['myosotis', 'myosotis-bounded-recall', '1.1.0', '1.0.0', {
    recallBounded: () => ({ records: [] }),
  }, /inconsistent recall counts were accepted/],
  ['aestivation', 'aestivation-correction-keeps-scope', '0.5.0', '0.4.0', {
    ...aestivationFixture040(),
    correctPlan: () => { throw Object.assign(new Error('scope refused'), { code: 'authority-required' }); },
    assertCurrentPlanResult: () => { throw Object.assign(new Error('retired'), { code: 'order-superseded' }); },
  }, /scope refusal changed the active lineage/],
  ['seed', 'seed-failure-class-honest', '0.6.0', '0.5.0', seedFixture030(), /unknown failure class was reported as success/],
  ['capillary', 'capillary-search-refuses-fused-score', '1.2.0', '1.1.0', {
    recordSource: input => ({ ...input, status: 'recorded' }),
    searchSources: async () => ({ ok: true, untrusted: true, hits: [], count: 0 }),
  }, /fused score was accepted/],
  ['capillary', 'capillary-thread-declares-cuts', '1.3.0', '1.2.0', {
    readThread: () => ({ ok: true, untrusted: true, messages: [], count: 0, truncated: false, continuationAvailable: false }),
  }, /absent conversation returned an empty thread/],
  ['capillary', 'capillary-recent-uses-caller-recency', '1.3.0', '1.2.0', {
    listRecent: async ({ conversations }) => ({
      ok: true, untrusted: true, count: conversations.length, truncated: false, continuationAvailable: false,
      conversations: conversations.map(({ id, title, recency }) => ({ conversationId: id, title, recency })),
    }),
  }, /did not order by the caller's recency/],
  ['capillary', 'capillary-context-brief-invents-nothing', '1.3.0', '1.2.0', {
    contextBrief: ({ query = null }) => ({
      ok: true, untrusted: true, query,
      brief: { latestOperatorGoal: { sourceId: 'invented' }, latestVerifiedOutcome: null, openFollowups: [] },
    }),
  }, /brief invented a goal/],
  ['capillary', 'capillary-trace-keeps-missing-start', '1.3.0', '1.2.0', {
    traceSource: ({ startId }) => ({ ok: true, untrusted: true, startId, parentIds: ['invented'], stop: 'root', at: 'invented' }),
  }, /missing start was given a parent/],
  ['drosera', 'drosera-catalog-public-skills', '0.5.0', '0.4.0', {
    ...skillSubject040().namespace,
    skillCatalog: entries => ({ list: () => entries.map(entry => ({ ...entry, slug: entry.skill.name })) }),
  }, /catalog listed a skill outside its public rule/],
  ['seed', 'seed-abort-skips-execution', '0.7.0', '0.6.0', seedFixture030(), /aborted run \(operator-abort\) called execute/],
  ['drosera', 'drosera-lifecycle-notice-names-its-move', '2.1.0', '2.0.0',
    skillSubject210({ noticeForAnyPair: true }).namespace, /draft to review move produced a lifecycle notice/],
  ['drosera', 'drosera-skill-document-needs-every-heading', '2.2.0', '2.1.0',
    skillSubject220({ acceptsMissing: 'Guardrails' }).namespace, /without "Guardrails" was accepted/],
];

for (const [subject, id, version, earlier, broken, detail] of followUpProbes) {
  test(`${id} catches a regression and leaves earlier or absent subjects unknown`, async () => {
    const check = byId(defaultProbes, id);
    assert.ok(check, `missing probe ${id}`);
    const run = namespace => runProbeAsync(check, { [subject]: { namespace } });
    assert.equal((await runProbeAsync(check, {})).status, 'unknown');
    const older = await run({ VERSION: earlier });
    assert.equal(older.status, 'unknown');
    assert.ok(older.detail.includes(version));
    const failed = await run({ ...broken, VERSION: version });
    assert.equal(failed.status, 'fail');
    assert.match(failed.detail, detail);
  });
}

test('the exported version matches the package', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(VERSION, pkg.version);
});
