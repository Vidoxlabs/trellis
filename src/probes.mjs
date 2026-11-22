// Trellis default probe lists: what each family member is probed on, from
// four points. The core never imports a sibling; each check receives its
// subject through injection (namespace + parsed package.json). Probes cite
// the contract they hold; summaries state the guarantee.

import { probe } from './point.mjs';

function requireExports(namespace, names) {
  const missing = names.filter((name) => namespace[name] === undefined);
  if (missing.length > 0) return { ok: false, message: `missing exports: ${missing.join(', ')}` };
  return { ok: true, message: `${names.length} exports present` };
}

function expectThrow(fn, label) {
  try {
    fn();
    return { ok: false, message: `${label}: expected a rejection, none was raised` };
  } catch (error) {
    return { ok: true, message: `${label} rejected: ${error.message.split('.')[0]}` };
  }
}

function parseVersion(value) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(typeof value === 'string' ? value : '');
  return match ? match.slice(1).map(Number) : null;
}

function olderThan(have, need) {
  for (let index = 0; index < 3; index += 1) {
    if (have[index] !== need[index]) return have[index] < need[index];
  }
  return false;
}

// A claim arrives with a version. Probing it against a checkout that predates
// the claim would probe something the subject never said (probes.md, "not a
// superset"), so that case is declared unknown with both versions named. A
// subject at or past the version is held to the claim and can fail.
function since(version, claim, check) {
  const need = parseVersion(version);
  return (subject, subjects) => {
    const have = parseVersion(subject?.namespace?.VERSION);
    if (have === null) {
      return { unknown: true, message: `${claim} arrived in ${version}; the subject declares no x.y.z VERSION` };
    }
    if (olderThan(have, need)) {
      return { unknown: true, message: `${claim} arrived in ${version}; this checkout declares ${subject.namespace.VERSION}` };
    }
    return check(subject, subjects);
  };
}

// True when the subject declares an x.y.z VERSION at or past `version`.
function atLeast(namespace, version) {
  const have = parseVersion(namespace?.VERSION);
  return have !== null && !olderThan(have, parseVersion(version));
}

// The forget request a myosotis checkout accepts. From 0.4.0 a forget is confirmed
// and keyed, and a bare id is refused; before it, the id alone was the request.
function forgetRequest(namespace, id) {
  return atLeast(namespace, '0.4.0') ? { id, confirmed: true, key: `trellis-${id}` } : id;
}

// The skill input a drosera checkout accepts. From 0.4.0 a skill also carries
// procedure, guardrails, and verification; before it, name, summary, and
// instructions were the whole shape.
function skillInput(namespace, fields) {
  if (!atLeast(namespace, '0.4.0')) return fields;
  return {
    ...fields,
    procedure: ['Read the face.'],
    guardrails: ['Call nothing the run did not admit.'],
    verification: ['The recorded intent matches the face.'],
  };
}

function rejects(fn) {
  try {
    fn();
    return false;
  } catch {
    return true;
  }
}

export const FAMILY_MEMBERS = Object.freeze([
  'seed', 'capillary', 'myosotis', 'aestivation', 'drosera',
]);

export const seedProbes = Object.freeze([
  probe({
    id: 'seed-tool-id-surface',
    point: 'shape',
    applies: 'seed',
    summary: 'The tool-id contract surface is exported: parser, formatter, validator, registry check, reserved domains, VERSION.',
    check: ({ namespace }) =>
      requireExports(namespace, [
        'VERSION', 'parseToolId', 'formatToolId', 'isValidToolId',
        'isWellFormedRegistryEntry', 'RESERVED_DOMAINS',
      ]),
  }),
  probe({
    id: 'seed-grammar-edges-reject',
    point: 'behavior',
    applies: 'seed',
    summary: 'The neutral tool-id grammar rejects vendor segments, infrastructure-like segments, unknown verbs, and over-long IDs, exactly as the contract says.',
    check: ({ namespace }) => {
      const rejects = [
        ['memory.openai.read', 'vendor segment'],
        ['v1.node.read', 'infrastructure-like segment'],
        ['memory.note.insert', 'unknown verb'],
        ['a.b.c.d.e.read', 'five segments'],
        ['Memory.read', 'uppercase'],
      ];
      for (const [id, label] of rejects) {
        const outcome = expectThrow(() => namespace.parseToolId(id), label);
        if (outcome.ok === false) return outcome;
      }
      const parts = namespace.parseToolId('memory.note.create');
      if (parts.domain !== 'memory' || parts.resource !== 'note' || parts.verb !== 'create') {
        return { ok: false, message: `valid ID parsed to wrong parts: ${JSON.stringify(parts)}` };
      }
      return { ok: true, message: 'grammar edges reject and valid IDs parse to their parts' };
    },
  }),
  probe({
    id: 'seed-registry-entry-validates',
    point: 'behavior',
    applies: 'seed',
    summary: 'Registry entry shape validates a well-formed entry and names the errors of a malformed one.',
    check: ({ namespace }) => {
      const good = namespace.isWellFormedRegistryEntry({
        toolId: 'memory.note.create',
        connector: 'memory-binding',
        effect: 'write',
        realm: 'conversation',
        thirdPartyEgress: false,
        ownerGate: false,
        inputSchema: { type: 'object' },
      });
      if (good.ok !== true) {
        return { ok: false, message: `well-formed entry rejected: ${good.errors.join('; ')}` };
      }
      const bad = namespace.isWellFormedRegistryEntry({
        toolId: 'memory.note.create',
        connector: '',
        effect: 'sometimes',
        realm: '',
        thirdPartyEgress: 'no',
        ownerGate: 'no',
        inputSchema: null,
      });
      if (bad.ok !== false || bad.errors.length === 0) {
        return { ok: false, message: 'malformed entry did not name its errors' };
      }
      return { ok: true, message: `registry entry validates and names ${bad.errors.length} errors when malformed` };
    },
  }),
  probe({
    id: 'seed-reserved-domains-anchor',
    point: 'consistency',
    applies: 'seed',
    summary: 'The reserved domains still hold the family anchors: the memory domain and the context domain.',
    check: ({ namespace }) => {
      for (const domain of ['memory', 'context']) {
        if (!namespace.RESERVED_DOMAINS.has(domain)) {
          return { ok: false, message: `reserved domain "${domain}" is gone; the family leans on it` };
        }
      }
      return { ok: true, message: 'memory and context domains are reserved' };
    },
  }),
  probe({
    id: 'seed-admission-holds-at-intent',
    point: 'behavior',
    applies: 'seed',
    summary: 'An attempt copies its objective\'s admission list, an intent naming a tool off that list is refused, and an attempt carrying no list admits nothing.',
    check: since('0.2.0', 'admission at intent', ({ namespace }) => {
      let objective = namespace.createObjective({
        id: 'o-1', intent: 'Read one note.', acceptance: 'note-read', allowedTools: ['memory.note.read'],
      });
      objective = namespace.transition(namespace.transition(objective, 'ready'), 'running');
      const attempt = namespace.createAttemptRecord({ objective });
      if (JSON.stringify(attempt.allowedTools) !== JSON.stringify(['memory.note.read'])) {
        return { ok: false, message: `attempt did not copy the admission list: ${JSON.stringify(attempt.allowedTools)}` };
      }
      const intent = { argumentsDigest: 'a'.repeat(64), scope: 'one note' };
      const admitted = namespace.recordIntent(attempt, { toolId: 'memory.note.read', ...intent });
      if (admitted.recordedIntents.length !== 1) {
        return { ok: false, message: 'an admitted intent was not recorded' };
      }
      const offList = expectThrow(() => namespace.recordIntent(attempt, { toolId: 'memory.note.delete', ...intent }), 'intent off the admission list');
      if (offList.ok === false) return offList;
      const { allowedTools: _dropped, ...bare } = attempt;
      const noList = expectThrow(() => namespace.recordIntent(bare, { toolId: 'memory.note.read', ...intent }), 'intent on an attempt with no admission list');
      if (noList.ok === false) return noList;
      return { ok: true, message: 'admission is enforced when the intent is recorded' };
    }),
  }),
  probe({
    id: 'seed-rollback-posture-declared',
    point: 'behavior',
    applies: 'seed',
    summary: 'An entry with no rollback declares the unsupported posture, and a registry whose compensating tool is not registered names that defect.',
    check: since('0.2.0', 'rollback postures', ({ namespace }) => {
      const entry = (toolId, rollback) => ({
        toolId, connector: 'memory-binding', effect: 'write', realm: 'conversation',
        thirdPartyEgress: false, ownerGate: false, inputSchema: { type: 'object' },
        ...(rollback ? { rollback } : {}),
      });
      if (namespace.rollbackPosture(entry('memory.note.create')) !== 'unsupported') {
        return { ok: false, message: 'an entry that declares no rollback did not read as unsupported' };
      }
      const create = entry('memory.note.create', { posture: 'compensating_action', compensatingTool: 'memory.note.delete' });
      const dangling = namespace.checkRegistry([create]);
      if (dangling.ok !== false || !dangling.errors.some((error) => /memory\.note\.delete/.test(error))) {
        return { ok: false, message: `an unregistered compensating tool was not named: ${JSON.stringify(dangling)}` };
      }
      const whole = namespace.checkRegistry([create, entry('memory.note.delete')]);
      if (whole.ok !== true) {
        return { ok: false, message: `a registry holding its compensating tool failed: ${whole.errors.join('; ')}` };
      }
      return { ok: true, message: 'rollback posture defaults to unsupported; compensating tools must be registered' };
    }),
  }),
  probe({
    id: 'seed-resume-skips-and-stops',
    point: 'behavior',
    applies: 'seed',
    summary: 'A resume does not run a step a previous attempt completed, and stops after the first failed step.',
    check: since('0.3.0', 'step resume', async ({ namespace }) => {
      const calls = [];
      const run = await namespace.resumeSteps({
        steps: [{ id: 'prepare' }, { id: 'apply' }, { id: 'verify' }],
        completed: ['prepare'],
        execute: async (step) => { calls.push(step.id); return { ok: step.id !== 'apply', detail: 'refused' }; },
      });
      if (calls.includes('prepare')) return { ok: false, message: 'a completed step ran again' };
      if (calls.includes('verify')) return { ok: false, message: 'a step after the failure ran' };
      const outcomes = run.steps.map((step) => step.outcome).join(',');
      if (run.status !== 'failed' || outcomes !== 'skipped,failed,not_reached') {
        return { ok: false, message: `resume reported ${run.status}: ${outcomes}` };
      }
      return { ok: true, message: 'completed steps carried, the run stopped at the failure' };
    }),
  }),
  probe({
    id: 'seed-lease-refuses-second-runner',
    point: 'behavior',
    applies: 'seed',
    summary: 'A lease names its holder and expiry, refuses a second runner while live, and may be replaced once expired.',
    check: since('0.3.0', 'run leases', ({ namespace }) => {
      const t0 = Date.parse('2026-01-01T00:00:00.000Z');
      const lease = namespace.claimLease(null, { holder: 'runner-a', ttlMs: 60_000, now: t0 });
      if (lease.holder !== 'runner-a' || Date.parse(lease.expiresAt) !== t0 + 60_000) {
        return { ok: false, message: `the lease did not record its holder and expiry: ${JSON.stringify(lease)}` };
      }
      for (const holder of ['runner-b', 'runner-a']) {
        if (!rejects(() => namespace.claimLease(lease, { holder, ttlMs: 60_000, now: t0 + 1_000 }))) {
          return { ok: false, message: `a live lease admitted a second claim by "${holder}"` };
        }
      }
      const next = namespace.claimLease(lease, { holder: 'runner-b', ttlMs: 60_000, now: t0 + 60_000 });
      if (next.holder !== 'runner-b') return { ok: false, message: 'an expired lease could not be replaced' };
      return { ok: true, message: 'live leases refuse a second runner; expired ones are replaced' };
    }),
  }),
  probe({
    id: 'seed-caller-admission-fails-closed',
    point: 'behavior',
    applies: 'seed',
    summary: 'Caller admission denies a missing registry, an unknown or disabled caller, and an unmapped command, and admits only a mapped tool on the caller\'s list.',
    check: since('0.3.0', 'caller admission', ({ namespace }) => {
      const registry = {
        callers: [
          { id: 'maintainer', enabled: true, allowedTools: ['docs.file.read'] },
          { id: 'retired', enabled: false, allowedTools: ['docs.file.read'] },
        ],
        commands: [{ command: ['docs', 'read'], toolId: 'docs.file.read' }],
      };
      const cases = [
        [undefined, { callerId: 'maintainer', command: ['docs', 'read'] }, 'registry-unavailable'],
        [registry, { callerId: 'stranger', command: ['docs', 'read'] }, 'caller-unknown'],
        [registry, { callerId: 'retired', command: ['docs', 'read'] }, 'caller-disabled'],
        [registry, { callerId: 'maintainer', command: ['docs', 'purge'] }, 'command-unmapped'],
      ];
      for (const [given, call, code] of cases) {
        const decision = namespace.admitCaller(given, call);
        if (decision.admitted !== false || decision.code !== code) {
          return { ok: false, message: `expected a ${code} denial, got ${JSON.stringify(decision)}` };
        }
      }
      const admitted = namespace.admitCaller(registry, { callerId: 'maintainer', command: ['docs', 'read'] });
      if (admitted.admitted !== true || admitted.toolId !== 'docs.file.read') {
        return { ok: false, message: `a mapped, allowed call was not admitted: ${JSON.stringify(admitted)}` };
      }
      return { ok: true, message: 'admission denies four ways and admits a mapped, allowed tool' };
    }),
  }),
]);

export const capillaryProbes = Object.freeze([
  probe({
    id: 'capillary-retrieval-surface',
    point: 'shape',
    applies: 'capillary',
    summary: 'The retrieval contract surface is exported: sources, packets, relations, ledger audit, budgets, VERSION.',
    check: ({ namespace }) =>
      requireExports(namespace, [
        'VERSION', 'recordSource', 'buildContextPacket', 'relationRecord',
        'isSoundLedger', 'BLOOM_BASELINE',
      ]),
  }),
  probe({
    id: 'capillary-packets-declare-their-cuts',
    point: 'behavior',
    applies: 'capillary',
    summary: 'A packet declares truncation (shortened, carried, cut) and lists out-of-budget items with their reason — never silent.',
    check: ({ namespace }) => {
      const item = (id, length) => ({
        id,
        sourceId: 'src-1',
        sourceDigest: 'a'.repeat(64),
        text: 'x'.repeat(length),
      });
      // totalBudget 3000, perItemBudget 3000: the first item spends the whole
      // budget (5000 chars, carried 3000, cut 2000, shortened declared), so
      // the second item finds take <= 0 and lands in omitted with its reason.
      const packet = namespace.buildContextPacket({
        items: [item('long', 5000), item('left-out', 2000)],
        totalBudget: 3000,
        perItemBudget: 3000,
      });
      const [admitted] = packet.items;
      if (admitted.shortened !== true || admitted.cut !== 2000 || admitted.carried !== 3000) {
        return { ok: false, message: `truncation not declared honestly: ${JSON.stringify(admitted)}` };
      }
      const [omitted] = packet.omitted;
      if (omitted.id !== 'left-out' || omitted.reason !== 'out-of-budget') {
        return { ok: false, message: `omission not declared with reason: ${JSON.stringify(packet.omitted)}` };
      }
      return { ok: true, message: 'truncation and omission are declared, never silent' };
    },
  }),
  probe({
    id: 'capillary-digest-gates-admission',
    point: 'behavior',
    applies: 'capillary',
    summary: 'A source without a 64-hex digest never records, and an item without its source digests never enters a packet.',
    check: ({ namespace }) => {
      const badSource = expectThrow(
        () => namespace.recordSource({ id: 's', title: 't', digest: 'not-hex', origin: 'text', originRef: 'r' }),
        'source with a malformed digest'
      );
      if (badSource.ok === false) return badSource;
      const badItem = expectThrow(
        () => namespace.buildContextPacket({
          items: [{ id: 'i', sourceId: 's', sourceDigest: 'short', text: 'x' }],
        }),
        'item with a malformed source digest'
      );
      if (badItem.ok === false) return badItem;
      return { ok: true, message: 'digests gate admission at both layers' };
    },
  }),
  probe({
    id: 'capillary-ledger-audits-its-writer',
    point: 'behavior',
    applies: 'capillary',
    summary: 'The ledger soundness audit catches dangling endpoints and duplicate relations; a sound ledger passes.',
    check: ({ namespace }) => {
      const source = { id: 'src-1', title: 't', digest: 'a'.repeat(64), origin: 'text', originRef: 'r' };
      const relation = { type: 'references', from: 'src-1', to: 'src-2' };
      const dangling = namespace.isSoundLedger({ sources: [source], relations: [relation] });
      if (dangling.ok !== false) {
        return { ok: false, message: 'dangling endpoint ledger passed the audit' };
      }
      const ok = namespace.isSoundLedger({ sources: [source], relations: [] });
      if (ok.ok !== true) {
        return { ok: false, message: `sound ledger failed the audit: ${ok.errors.join('; ')}` };
      }
      return { ok: true, message: 'ledger audit catches what a writer would hide' };
    },
  }),
  probe({
    id: 'capillary-unknown-sources-declared',
    point: 'behavior',
    applies: 'capillary',
    summary: 'A source that could not be read is recorded as unknown with a null digest, its excerpts never enter a packet even with a digest attached, and the packet lists it.',
    check: since('0.2.0', 'unknown sources', ({ namespace }) => {
      const unknown = namespace.recordUnknownSource({
        id: 'src-9', title: 'Gone', origin: 'url', originRef: 'r', reason: 'read-failed',
      });
      if (unknown.status !== 'unknown' || unknown.digest !== null || namespace.isUnknownSource(unknown) !== true) {
        return { ok: false, message: `unreadable source not recorded as unknown: ${JSON.stringify(unknown)}` };
      }
      const packet = namespace.buildContextPacket({
        items: [
          { id: 'kept', sourceId: 'src-1', sourceDigest: 'a'.repeat(64), text: 'known text' },
          { id: 'filled-in', sourceId: 'src-9', sourceDigest: 'a'.repeat(64), text: 'from elsewhere' },
        ],
        unknownSources: [unknown],
      });
      if (JSON.stringify(packet.items.map((item) => item.id)) !== JSON.stringify(['kept'])) {
        return { ok: false, message: `an unknown source's excerpt entered the packet: ${JSON.stringify(packet.items.map((item) => item.id))}` };
      }
      const omitted = packet.omitted.find((item) => item.id === 'filled-in');
      if (omitted?.reason !== 'unknown-source') {
        return { ok: false, message: `the excerpt was not omitted with its reason: ${JSON.stringify(packet.omitted)}` };
      }
      if (!Array.isArray(packet.unknown) || packet.unknown[0]?.sourceId !== 'src-9' || packet.unknown[0]?.reason !== 'read-failed') {
        return { ok: false, message: `the packet did not list the unknown source: ${JSON.stringify(packet.unknown)}` };
      }
      return { ok: true, message: 'unknown sources are recorded, kept out, and listed' };
    }),
  }),
  probe({
    id: 'capillary-relevance-and-recency-separate',
    point: 'behavior',
    applies: 'capillary',
    summary: 'Packet items carry relevance and recency as separate fields, neither filled in from the other, and an item with a fused score is refused.',
    check: since('0.3.0', 'separate ranking dimensions', ({ namespace }) => {
      const digest = 'a'.repeat(64);
      const packet = namespace.buildContextPacket({
        items: [
          { id: 'i-1', sourceId: 's', sourceDigest: digest, text: 'one', relevance: 0.9 },
          { id: 'i-2', sourceId: 's', sourceDigest: digest, text: 'two', recency: 1_700_000_000_000 },
        ],
      });
      const [first, second] = packet.items;
      if (first.relevance !== 0.9 || first.recency !== null || second.relevance !== null || second.recency !== 1_700_000_000_000) {
        return { ok: false, message: `the dimensions were merged or filled in: ${JSON.stringify(packet.items)}` };
      }
      if (packet.items.some((item) => Object.hasOwn(item, 'score'))) {
        return { ok: false, message: 'a packet item carried a fused score' };
      }
      return expectThrow(
        () => namespace.buildContextPacket({ items: [{ id: 'i-3', sourceId: 's', sourceDigest: digest, text: 'x', score: 0.5 }] }),
        'item with a fused score',
      );
    }),
  }),
  probe({
    id: 'capillary-moved-epoch-refuses-packet',
    point: 'behavior',
    applies: 'capillary',
    summary: 'A packet is refused when the deletion epoch at the end of the read differs from the epoch at its start, and the refusal carries no items.',
    check: since('0.3.0', 'deletion-epoch guard', async ({ namespace }) => {
      const digest = 'a'.repeat(64);
      const rows = async () => ({ items: [{ id: 'i-1', sourceId: 's', sourceDigest: digest, text: 'before the forget' }] });
      let epoch = 3;
      const moved = await namespace.buildEpochGuardedPacket({
        readEpoch: async () => epoch,
        read: async () => { const read = await rows(); epoch += 1; return read; },
      });
      if (moved.refused !== true || moved.code !== 'deletion-epoch-changed' || Object.hasOwn(moved, 'items')) {
        return { ok: false, message: `a read the epoch moved under was served: ${JSON.stringify(moved)}` };
      }
      const stable = await namespace.buildEpochGuardedPacket({ readEpoch: async () => 4, read: rows });
      if (stable.deletionEpoch !== 4 || stable.items?.length !== 1) {
        return { ok: false, message: 'a read under a stable epoch was not served with its epoch' };
      }
      return { ok: true, message: 'a moved epoch refuses the packet; a stable one serves it' };
    }),
  }),
]);

export const myosotisProbes = Object.freeze([
  probe({
    id: 'myosotis-memory-surface',
    point: 'shape',
    applies: 'myosotis',
    summary: 'The memory contract surface is exported: kinds, records, consent, store, recollection, stamps, VERSION.',
    check: ({ namespace }) =>
      requireExports(namespace, [
        'VERSION', 'MEMORY_KINDS', 'memoryRecord', 'requiresConsent', 'consentState',
        'openStore', 'admitMemory', 'forgetMemory', 'recallAll', 'projectionStamp',
        'projectionIsValid',
      ]),
  }),
  probe({
    id: 'myosotis-forget-is-structural',
    point: 'behavior',
    applies: 'myosotis',
    summary: 'A real forget removes the record and bumps the epoch, projections stamped before fail closed after, and a miss is declared unknown with no state change.',
    check: ({ namespace }) => {
      const store = namespace.openStore();
      const state = namespace.consentState({});
      const admitted = namespace.admitMemory(store, state, {
        id: 'n-1', kind: 'organizational', scope: 'team', text: 'Pinned note.',
      });
      if (admitted.admitted !== true) {
        return { ok: false, message: `organizational admission refused: ${admitted.reason}` };
      }
      const stamp = namespace.projectionStamp(admitted.store);
      if (namespace.projectionIsValid(admitted.store, stamp) !== true) {
        return { ok: false, message: 'fresh projection stamp reported invalid' };
      }
      const forgotten = namespace.forgetMemory(admitted.store, forgetRequest(namespace, 'n-1'));
      if (forgotten.status !== 'forgotten' || forgotten.store.epoch !== store.epoch + 1) {
        return { ok: false, message: 'forget did not remove and bump the epoch' };
      }
      if (namespace.projectionIsValid(forgotten.store, stamp) !== false) {
        return { ok: false, message: 'stale projection failed open: resurrection is structurally possible' };
      }
      const miss = namespace.forgetMemory(forgotten.store, forgetRequest(namespace, 'not-there'));
      if (miss.status !== 'unknown' || miss.store.epoch !== forgotten.store.epoch) {
        return { ok: false, message: 'a forget miss was not declared unknown without state change' };
      }
      return { ok: true, message: 'forget is structural: removed, bumped, failed closed, misses declared' };
    },
  }),
  probe({
    id: 'myosotis-consent-precedes-keep',
    point: 'behavior',
    applies: 'myosotis',
    summary: 'Personal-consented memory is refused admission without a live grant, and the refuse carries its reason.',
    check: ({ namespace }) => {
      const store = namespace.openStore();
      const refused = namespace.admitMemory(store, namespace.consentState({}), {
        id: 'p-1', kind: 'personal-consented', scope: 'personal', text: 'Prefers mornings.',
      });
      if (refused.admitted !== false || !/consent/.test(refused.reason)) {
        return { ok: false, message: `personal memory admitted without consent: ${JSON.stringify(refused)}` };
      }
      const grant = namespace.consentState({
        grants: [{ subject: 'ada', scope: 'personal', grantedBy: 'ada' }],
      });
      const admitted = namespace.admitMemory(store, grant, {
        id: 'p-1', kind: 'personal-consented', scope: 'personal', text: 'Prefers mornings.',
      });
      if (admitted.admitted !== true) {
        return { ok: false, message: `personal memory refused despite a live grant: ${admitted.reason}` };
      }
      return { ok: true, message: 'consent precedes keep, grant admits, refuse carries reason' };
    },
  }),
  probe({
    id: 'myosotis-kinds-stay-closed',
    point: 'behavior',
    applies: 'myosotis',
    summary: 'The memory class set is exactly the four distinguishable classes, and unknown kinds are rejected.',
    check: ({ namespace }) => {
      const expected = ['active-thread', 'organizational', 'personal-consented', 'unconfirmed'];
      const actual = [...namespace.MEMORY_KINDS].sort();
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        return { ok: false, message: `kind set drifted: ${actual.join(', ')}` };
      }
      return expectThrow(
        () => namespace.memoryRecord({ id: 'n', kind: 'permanent', scope: 's', text: 'x' }),
        'unknown memory kind'
      );
    },
  }),
  probe({
    id: 'myosotis-stale-projection-refused',
    point: 'behavior',
    applies: 'myosotis',
    summary: 'A projection built before a forget is refused and serves no records, and current recall rebuilds without the forgotten record.',
    check: since('0.2.0', 'refusing projections', ({ namespace }) => {
      let store = namespace.openStore();
      for (const id of ['secret-1', 'o-2']) {
        ({ store } = namespace.admitMemory(store, namespace.consentState({}), {
          id, kind: 'organizational', scope: 'team', text: `note ${id}`,
        }));
      }
      const before = namespace.buildProjection(store);
      const { store: after } = namespace.forgetMemory(store, forgetRequest(namespace, 'secret-1'));
      const read = namespace.readProjection(after, before);
      if (read.status !== 'refused' || read.records !== null) {
        return { ok: false, message: `a stale projection was served: ${JSON.stringify(read)}` };
      }
      const current = namespace.recallCurrent(after, before);
      if (current.rebuilt !== true || current.records.some((record) => record.id === 'secret-1')) {
        return { ok: false, message: 'current recall returned the forgotten record' };
      }
      return { ok: true, message: 'stale projections are refused; recall rebuilds without the forgotten record' };
    }),
  }),
  probe({
    id: 'myosotis-reconsent-by-sequence',
    point: 'behavior',
    applies: 'myosotis',
    summary: 'A grant sequenced after a revocation is re-consent, a later revocation ends it, a tie goes to the revocation, and an unsequenced side lets the revocation win.',
    check: since('0.3.0', 'sequenced re-consent', ({ namespace }) => {
      const grant = (sequence) => namespace.consentGrant({ subject: 'ada', scope: 'ada-space', grantedBy: 'ada', sequence });
      const revoke = (sequence) => namespace.revokeConsent({ subject: 'ada', scope: 'ada-space', sequence });
      const live = (grants, revocations) => namespace.consentState({ grants, revocations }).hasConsentFor('ada-space');
      const cases = [
        ['grant after revocation', [grant(1), grant(3)], [revoke(2)], true],
        ['revocation after re-consent', [grant(1), grant(3)], [revoke(2), revoke(4)], false],
        ['tie', [grant(2)], [revoke(2)], false],
        ['unsequenced revocation', [grant(9)], [revoke(undefined)], false],
      ];
      for (const [label, grants, revocations, expected] of cases) {
        if (live(grants, revocations) !== expected) {
          return { ok: false, message: `${label}: consent read ${!expected}, the contract says ${expected}` };
        }
      }
      return { ok: true, message: 'consent follows the sequence; ties and unsequenced records go to the revocation' };
    }),
  }),
  probe({
    id: 'myosotis-forget-confirmed-and-keyed',
    point: 'behavior',
    applies: 'myosotis',
    summary: 'A forget without confirmation changes nothing, a repeated key does not bump the epoch again, a forget tombstones the supersede chain under the named id with no text, and a projection holds ids and digests, not text.',
    check: since('0.4.0', 'confirmed, keyed forget with tombstones', ({ namespace }) => {
      const none = namespace.consentState({});
      let store = namespace.openStore();
      const admit = (input) => {
        const result = namespace.admitMemory(store, none, { kind: 'organizational', scope: 'team', ...input });
        if (result.admitted !== true) throw new Error(`admission refused: ${result.reason}`);
        store = result.store;
      };
      admit({ id: 'v1', text: 'The window is Tuesday.' });
      admit({ id: 'v2', text: 'The window is Thursday.', supersedes: 'v1' });
      admit({ id: 'other', text: 'Unrelated note.' });

      const projection = namespace.buildProjection(store);
      if (JSON.stringify(projection).includes('Thursday')) {
        return { ok: false, message: 'a projection carried a second copy of the text' };
      }
      for (const request of ['v2', { id: 'v2', key: 'k-1' }]) {
        const refused = namespace.forgetMemory(store, request);
        if (refused.status !== 'refused' || refused.store !== store) {
          return { ok: false, message: `an unconfirmed forget changed the store: ${JSON.stringify(refused.status)}` };
        }
      }
      const first = namespace.forgetMemory(store, { id: 'v2', confirmed: true, key: 'k-1' });
      if (first.status !== 'forgotten' || first.store.epoch !== store.epoch + 1) {
        return { ok: false, message: 'a confirmed forget did not remove and bump the epoch once' };
      }
      const tombstones = first.store.tombstones ?? [];
      const named = ['v1', 'v2'].every((id) => tombstones.some((t) => t.id === id && t.namedId === 'v2'));
      if (!named) return { ok: false, message: 'the superseded record was not tombstoned under the named id' };
      if (JSON.stringify(tombstones).includes('Tuesday')) {
        return { ok: false, message: 'a tombstone kept the forgotten text' };
      }
      const again = namespace.forgetMemory(first.store, { id: 'v2', confirmed: true, key: 'k-1' });
      if (again.store.epoch !== first.store.epoch) {
        return { ok: false, message: 'repeating the same forget key bumped the epoch again' };
      }
      return { ok: true, message: 'forget is confirmed and keyed; chains tombstone under the named id; projections carry no text' };
    }),
  }),
]);

export const aestivationProbes = Object.freeze([
  probe({
    id: 'aestivation-loop-surface',
    point: 'shape',
    applies: 'aestivation',
    summary: 'The loop contract surface is exported: stages, plans, verdicts, ledger, gate, VERSION.',
    check: ({ namespace }) =>
      requireExports(namespace, [
        'VERSION', 'STAGE_KINDS', 'validatePlan', 'planProposal', 'DECISIONS',
        'verdictRecord', 'latestVerdict', 'isSoundVerdictLedger', 'assemblyGate',
      ]),
  }),
  probe({
    id: 'aestivation-deterministic-outranks-judgment',
    point: 'behavior',
    applies: 'aestivation',
    summary: 'An approved but invalid plan stays held at plan-invalid, an unreviewed valid plan waits, and a revise holds.',
    check: ({ namespace }) => {
      const invalid = namespace.validatePlan([
        { stage: 'assemble', title: 'First' },
        { stage: 'review', title: 'Too late' },
      ]);
      if (invalid.ok !== false) {
        return { ok: false, message: 'assemble-before-review passed the rule pack' };
      }
      const approval = namespace.verdictRecord({ planId: 'p-1', decision: 'approve', judge: 'reviewer' });
      const held = namespace.assemblyGate({ validation: invalid, verdicts: [approval], planId: 'p-1' });
      if (held.permitted !== false || held.held !== 'plan-invalid') {
        return { ok: false, message: `an approval rescued an invalid plan: ${JSON.stringify(held)}` };
      }
      const unreviewed = namespace.assemblyGate({
        validation: { ok: true, errors: [] }, verdicts: [], planId: 'p-1',
      });
      if (unreviewed.held !== 'awaiting-verdict') {
        return { ok: false, message: `unreviewed plan did not wait: ${JSON.stringify(unreviewed)}` };
      }
      const revise = namespace.verdictRecord({
        planId: 'p-1', decision: 'revise', judge: 'reviewer', reasons: ['Order.'],
      });
      const held2 = namespace.assemblyGate({
        validation: { ok: true, errors: [] }, verdicts: [revise], planId: 'p-1',
      });
      if (held2.held !== 'revisions-requested') {
        return { ok: false, message: `revise verdict did not hold assembly: ${JSON.stringify(held2)}` };
      }
      return { ok: true, message: 'gate order holds: plan-invalid, awaiting-verdict, revisions-requested' };
    },
  }),
  probe({
    id: 'aestivation-revises-carry-reasons',
    point: 'behavior',
    applies: 'aestivation',
    summary: 'A revise verdict without reasons refuses to record, and the ledger keeps append-only history with the latest verdict in force.',
    check: ({ namespace }) => {
      const refused = expectThrow(
        () => namespace.verdictRecord({ planId: 'p-1', decision: 'revise', judge: 'reviewer' }),
        'reasonless revise'
      );
      if (refused.ok === false) return refused;
      const revise = namespace.verdictRecord({
        planId: 'p-1', decision: 'revise', judge: 'reviewer', reasons: ['Add review.'],
      });
      const approve = namespace.verdictRecord({ planId: 'p-1', decision: 'approve', judge: 'reviewer' });
      if (namespace.latestVerdict([revise, approve], 'p-1').decision !== 'approve') {
        return { ok: false, message: 'latest verdict does not win' };
      }
      return { ok: true, message: 'revise carries reasons; the ledger keeps both; latest wins' };
    },
  }),
  probe({
    id: 'aestivation-gate-trusts-sound-ledgers-only',
    point: 'behavior',
    applies: 'aestivation',
    summary: 'A hand-built approval with no judge holds the gate as ledger-unsound and is never surfaced as the verdict.',
    check: since('0.2.0', 'ledger soundness at the gate', ({ namespace }) => {
      const gate = namespace.assemblyGate({
        validation: { ok: true, errors: [] },
        verdicts: [{ planId: 'p-1', decision: 'approve' }],
        planId: 'p-1',
      });
      if (gate.permitted !== false || gate.held !== 'ledger-unsound' || gate.verdict !== null) {
        return { ok: false, message: `a forged approval was trusted: ${JSON.stringify({ permitted: gate.permitted, held: gate.held })}` };
      }
      return { ok: true, message: 'a forged approval holds the gate as ledger-unsound' };
    }),
  }),
  probe({
    id: 'aestivation-review-binds-to-digest',
    point: 'behavior',
    applies: 'aestivation',
    summary: 'Given the plan digest, an approval of that exact plan permits, and an approval of a changed plan holds as review-stale.',
    check: since('0.3.0', 'digest-bound review', ({ namespace }) => {
      const steps = [
        { stage: 'work', title: 'Write the change' },
        { stage: 'review', title: 'Review the change' },
        { stage: 'assemble', title: 'Assemble the release' },
      ];
      const reviewed = namespace.planProposal({ id: 'p-1', objective: 'Ship it', steps });
      const changed = namespace.planProposal({ id: 'p-1', objective: 'Ship it', steps: [steps[0], { stage: 'work', title: 'Slipped in' }, steps[1], steps[2]] });
      if (reviewed.digest === changed.digest) {
        return { ok: false, message: 'a step added after review left the digest unchanged' };
      }
      const approval = namespace.verdictRecord({ planId: 'p-1', planDigest: reviewed.digest, decision: 'approve', judge: 'reviewer' });
      const exact = namespace.assemblyGate({
        validation: namespace.validatePlan(reviewed.steps), verdicts: [approval], planId: 'p-1', planDigest: reviewed.digest,
      });
      if (exact.permitted !== true) {
        return { ok: false, message: `an approval of the exact plan did not permit: ${exact.held}` };
      }
      const stale = namespace.assemblyGate({
        validation: namespace.validatePlan(changed.steps), verdicts: [approval], planId: 'p-1', planDigest: changed.digest,
      });
      if (stale.permitted !== false || stale.held !== 'review-stale') {
        return { ok: false, message: `an approval of an earlier version opened the gate: ${JSON.stringify({ permitted: stale.permitted, held: stale.held })}` };
      }
      return { ok: true, message: 'an approval opens the gate only for the version it read' };
    }),
  }),
  probe({
    id: 'aestivation-intent-grants-nothing',
    point: 'behavior',
    applies: 'aestivation',
    summary: 'An intent assessment that carries a tool or a memory write is refused, and composing a real one with an admission adds neither.',
    check: since('0.4.0', 'read-only intent', ({ namespace }) => {
      for (const field of ['tools', 'memoryWrites']) {
        if (!rejects(() => namespace.intentAssessment({ label: 'x', [field]: ['docs.file.write'] }))) {
          return { ok: false, message: `an assessment carrying ${field} was accepted` };
        }
      }
      const assessment = namespace.intentAssessment({ label: 'recall', needs: ['durable-memory'] });
      const composed = namespace.admitWithIntent({ allowedTools: ['docs.file.read'], memoryWrites: [] }, assessment);
      if (JSON.stringify(composed.allowedTools) !== '["docs.file.read"]' || composed.memoryWrites.length !== 0) {
        return { ok: false, message: `intent widened the admission: ${JSON.stringify(composed)}` };
      }
      if (!rejects(() => namespace.admitWithIntent({ allowedTools: [] }, { ...assessment, tools: ['docs.file.write'] }))) {
        return { ok: false, message: 'a look-alike assessment composed with an admission' };
      }
      return { ok: true, message: 'intent is advisory: it adds no tool and no memory write' };
    }),
  }),
  probe({
    id: 'aestivation-correction-new-digest',
    point: 'behavior',
    applies: 'aestivation',
    summary: 'A correction is a new proposal with a new digest, the reviewed plan is unchanged, and the judge who asked for the revision cannot apply it.',
    check: since('0.4.0', 'plan corrections', ({ namespace }) => {
      const previous = namespace.planProposal({
        id: 'plan-1', objective: 'o',
        steps: [{ stage: 'work', title: 'Draft' }, { stage: 'review', title: 'Review' }],
      });
      const before = JSON.stringify(previous);
      const verdict = namespace.verdictRecord({
        planId: 'plan-1', planDigest: previous.digest, decision: 'revise', judge: 'reviewer', reasons: ['verify it'],
      });
      const steps = [...previous.steps, { stage: 'verify', title: 'Verify' }];
      if (!rejects(() => namespace.correctPlan({ previous, verdict, author: 'reviewer', steps }))) {
        return { ok: false, message: 'the judge applied its own requested patch' };
      }
      const { proposal, correction } = namespace.correctPlan({ previous, verdict, author: 'implementer', steps });
      if (JSON.stringify(previous) !== before) return { ok: false, message: 'the reviewed plan was mutated' };
      if (proposal.digest === previous.digest || correction.previousDigest !== previous.digest || correction.digest !== proposal.digest) {
        return { ok: false, message: `the correction did not store a new, linked digest: ${JSON.stringify(correction)}` };
      }
      return { ok: true, message: 'corrections mint a new digest; the judge does not apply its own patch' };
    }),
  }),
]);

export const droseraProbes = Object.freeze([
  probe({
    id: 'drosera-tooling-surface',
    point: 'shape',
    applies: 'drosera',
    summary: 'The tooling contract surface is exported: faces, packs, skills, hooks, recipes, cookbooks, effects, events, VERSION.',
    check: ({ namespace }) =>
      requireExports(namespace, [
        'VERSION', 'EFFECT_CLASSES', 'parseToolId', 'toolFace', 'toolPack', 'skill',
        'skillPack', 'EVENTS', 'hook', 'hookPack', 'runHooks', 'recipe', 'cookbook',
        'checkRecipe',
      ]),
  }),
  probe({
    id: 'drosera-hooks-fail-closed',
    point: 'behavior',
    applies: 'drosera',
    summary: 'A throwing hook check is a failed check with its error recorded, and a check returning ok false fails with its message.',
    check: ({ namespace }) => {
      const pack = namespace.hookPack([
        namespace.hook({
          id: 'throwing', event: 'before-tool', summary: 's',
          check: () => { throw new Error('invariant broken'); },
        }),
        namespace.hook({
          id: 'refusing', event: 'before-tool', summary: 's',
          check: () => ({ ok: false, message: 'args malformed' }),
        }),
      ]);
      const results = namespace.runHooks(pack, 'before-tool', {});
      if (results[0].passed !== false || !/check threw/.test(results[0].detail)) {
        return { ok: false, message: `a thrown check did not fail closed: ${JSON.stringify(results[0])}` };
      }
      if (results[1].passed !== false || !/args malformed/.test(results[1].detail)) {
        return { ok: false, message: 'a refusing check did not carry its message' };
      }
      return { ok: true, message: 'hook dispatch fails closed with reasons recorded' };
    },
  }),
  probe({
    id: 'drosera-cookbook-references-resolve',
    point: 'behavior',
    applies: 'drosera',
    summary: 'A recipe referencing a face the pack does not hold is a check-time defect naming the face.',
    check: ({ namespace }) => {
      const tools = namespace.toolPack([
        namespace.toolFace({ id: 'memory.note.list', effect: 'read', connector: 'b', summary: 'List notes.' }),
      ]);
      const skills = namespace.skillPack([
        namespace.skill(skillInput(namespace, { name: 'pre-flight', summary: 's', instructions: 'i' })),
      ]);
      const recipe = namespace.recipe({
        id: 'retire', objective: 'o',
        steps: [{ skill: 'pre-flight' }, { tool: 'memory.note.list' }, { tool: 'memory.ghost.delete' }],
      });
      const checked = namespace.checkRecipe(recipe, tools, skills);
      if (checked.ok !== false || !/memory\.ghost\.delete/.test(checked.errors[0])) {
        return { ok: false, message: `dangling reference not named at check time: ${JSON.stringify(checked)}` };
      }
      return { ok: true, message: 'dangling references are defects at check time, named' };
    },
  }),
  probe({
    id: 'drosera-faces-carry-their-effect',
    point: 'behavior',
    applies: 'drosera',
    summary: 'A face with an effect outside the closed set is rejected, keeping the class honest on the definition.',
    check: ({ namespace }) =>
      expectThrow(
        () => namespace.toolFace({
          id: 'memory.note.create', effect: 'sometimes', connector: 'b', summary: 's',
        }),
        'face with a non-closed effect'
      ),
  }),
  probe({
    id: 'drosera-packs-revalidate-frozen-entries',
    point: 'behavior',
    applies: 'drosera',
    summary: 'A pack checks every entry it is given: a frozen object that is not a valid face, skill, hook, or recipe is refused.',
    check: since('0.2.0', 'pack revalidation', ({ namespace }) => {
      const frozen = [
        ['tool pack', () => namespace.toolPack([Object.freeze({ id: 'Memory.Note.Read', effect: 'read', connector: 'c', summary: 's' })])],
        ['skill pack', () => namespace.skillPack([Object.freeze(skillInput(namespace, { name: 'PreFlight', summary: 's', instructions: 'i' }))])],
        ['hook pack', () => namespace.hookPack([Object.freeze({ id: 'args-ok', event: 'before-tool', summary: 's', check: 'prose' })])],
        ['cookbook', () => namespace.cookbook([Object.freeze({ id: 'empty', objective: 'o', steps: Object.freeze([]) })])],
      ];
      for (const [label, build] of frozen) {
        if (!rejects(build)) return { ok: false, message: `${label} accepted a frozen invalid entry` };
      }
      return { ok: true, message: 'every pack revalidates frozen entries' };
    }),
  }),
  probe({
    id: 'drosera-skill-names-refuse-vendors',
    point: 'behavior',
    applies: 'drosera',
    summary: 'A skill name with a vendor word is refused, whole words only, while protocol words stay allowed.',
    check: since('0.3.0', 'vendor words in skill names', ({ namespace }) => {
      const make = (name) => () => namespace.skill(skillInput(namespace, { name, summary: 's', instructions: 'i' }));
      for (const name of ['claude-review', 'review-with-gemini']) {
        if (!rejects(make(name))) return { ok: false, message: `skill "${name}" was accepted` };
      }
      for (const name of ['claudette-notes', 'http-caching']) {
        if (rejects(make(name))) return { ok: false, message: `skill "${name}" was refused; the contract allows it` };
      }
      return { ok: true, message: 'vendor words refused; substrings and protocol words allowed' };
    }),
  }),
  probe({
    id: 'drosera-skill-record-and-lifecycle',
    point: 'behavior',
    applies: 'drosera',
    summary: 'A skill needs procedure, guardrails, and verification beside its summary, and its lifecycle is draft, promoted, or deprecated, with deprecated terminal.',
    check: since('0.4.0', 'skill records and lifecycle', ({ namespace }) => {
      const full = skillInput(namespace, { name: 'pre-flight', summary: 's' });
      for (const field of ['procedure', 'guardrails', 'verification']) {
        const { [field]: _dropped, ...missing } = full;
        if (!rejects(() => namespace.skill(missing))) {
          return { ok: false, message: `a skill without ${field} was accepted` };
        }
      }
      const states = [...(namespace.LIFECYCLE_STATES ?? [])];
      if (JSON.stringify(states) !== JSON.stringify(['draft', 'promoted', 'deprecated'])) {
        return { ok: false, message: `lifecycle states drifted: ${states.join(', ')}` };
      }
      const draft = namespace.skill(full);
      if (draft.lifecycle !== 'draft') return { ok: false, message: 'a new skill did not start as a draft' };
      const promoted = namespace.transitionSkill(draft, 'promoted', { approver: 'reviewer' });
      const deprecated = namespace.transitionSkill(promoted, 'deprecated', { reason: 'replaced' });
      if (promoted.lifecycle !== 'promoted' || deprecated.lifecycle !== 'deprecated' || draft.lifecycle !== 'draft') {
        return { ok: false, message: 'a transition did not land, or changed the record it was given' };
      }
      for (const to of ['draft', 'promoted', 'deprecated']) {
        if (!rejects(() => namespace.transitionSkill(deprecated, to, { approver: 'reviewer', reason: 'again' }))) {
          return { ok: false, message: `a deprecated skill moved to ${to}` };
        }
      }
      return { ok: true, message: 'skills carry procedure, guardrails, verification; deprecated is terminal' };
    }),
  }),
]);

// Cross-family probes: agreements between siblings, declared by applies '*'.
export const crossProbes = Object.freeze([
  probe({
    id: 'grammar-mirror-agreement',
    point: 'consistency',
    applies: '*',
    summary: 'Drosera\'s local mirror of seed\'s tool-id grammar accepts and rejects identically on the corpus; agreement is observed with both present.',
    check: (_subjects, subjects) => {
      const seed = subjects.seed;
      const drosera = subjects.drosera;
      if (!seed || !drosera) {
        return { unknown: true, message: 'grammar agreement needs both the seed and drosera checkouts present' };
      }
      const valid = ['memory.note.create', 'docs.file.metadata.read', 'vcs.repo.read', 'telemetry.search'];
      const invalid = ['memory.note.insert', 'memory.openai.read', 'v1.node.read', 'Memory.read'];
      for (const id of valid) {
        let seedParts;
        let droseraParts;
        try {
          seedParts = seed.namespace.parseToolId(id);
        } catch (error) {
          return { ok: false, message: `seed rejected a corpus-valid ID "${id}": ${error.message}` };
        }
        try {
          droseraParts = drosera.namespace.parseToolId(id);
        } catch (error) {
          return { ok: false, message: `drosera mirror rejected a corpus-valid ID "${id}" the grammar admits: ${error.message}` };
        }
        if (JSON.stringify(seedParts) !== JSON.stringify(droseraParts)) {
          return { ok: false, message: `mirrors parsed "${id}" differently` };
        }
      }
      for (const id of invalid) {
        const seedRejected = (() => { try { seed.namespace.parseToolId(id); return false; } catch { return true; } })();
        const droseraRejected = (() => { try { drosera.namespace.parseToolId(id); return false; } catch { return true; } })();
        if (seedRejected !== droseraRejected) {
          return { ok: false, message: `mirrors disagree on corpus-invalid ID "${id}": seed ${seedRejected ? 'rejects' : 'accepts'}, drosera ${droseraRejected ? 'rejects' : 'accepts'}` };
        }
        if (!seedRejected) {
          return { ok: false, message: `seed accepted corpus-invalid ID "${id}"` };
        }
      }
      return { ok: true, message: 'both parsers agree on the corpus: 4 valid, 4 invalid' };
    },
  }),
  probe({
    id: 'versions-declared',
    point: 'consistency',
    applies: '*',
    summary: 'Every present subject declares a VERSION in x.y.z form; declarations are required, equality is not.',
    check: (_subjects, subjects) => {
      const missing = [];
      for (const [name, subject] of Object.entries(subjects)) {
        if (!subject) continue;
        const version = subject.namespace.VERSION;
        if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
          missing.push(name);
        }
      }
      if (missing.length > 0) {
        return { ok: false, message: `no x.y.z VERSION declared: ${missing.join(', ')}` };
      }
      return { ok: true, message: 'every present subject declares its version' };
    },
  }),
  probe({
    id: 'vendor-list-agreement',
    point: 'consistency',
    applies: '*',
    summary: 'Drosera\'s vendor list is the vendor half of seed\'s forbidden segments on the corpus: every word drosera refuses in a skill name, seed refuses as a tool-id segment, and the corpus words seed forbids that drosera allows are protocol words only.',
    check: (_subjects, subjects) => {
      const seed = subjects.seed;
      const drosera = subjects.drosera;
      if (!seed || !drosera) {
        return { unknown: true, message: 'vendor agreement needs both the seed and drosera checkouts present' };
      }
      const version = parseVersion(drosera.namespace.VERSION);
      if (version === null || olderThan(version, [0, 3, 0])) {
        return { unknown: true, message: `the vendor list arrived in drosera 0.3.0; this checkout declares ${drosera.namespace.VERSION}` };
      }
      const protocols = new Set(['http', 'https', 'websocket', 'grpc', 'sdk']);
      // The vendor words both contracts name, so a word one side drops is still tried,
      // plus candidates neither lists, so a word one side adds alone is caught.
      const documented = ['openai', 'anthropic', 'claude', 'chatgpt', 'gemini', 'grok', 'copilot', 'cursor'];
      const candidates = ['mistral', 'llama', 'deepseek', 'qwen', 'cohere', 'perplexity'];
      const corpus = [...new Set([...documented, ...drosera.namespace.VENDOR_NAMES, ...candidates, ...protocols])];
      for (const word of corpus) {
        const seedForbids = rejects(() => seed.namespace.parseToolId(`docs.${word}.read`));
        const droseraRefuses = rejects(() => drosera.namespace.skill(skillInput(drosera.namespace, { name: `${word}-notes`, summary: 's', instructions: 'i' })));
        if (droseraRefuses && !seedForbids) {
          return { ok: false, message: `drosera refuses "${word}" in a skill name, but seed admits it as a tool-id segment` };
        }
        if (seedForbids && !droseraRefuses && !protocols.has(word)) {
          return { ok: false, message: `seed forbids "${word}" as a segment, but drosera's vendor list lacks it` };
        }
        if (protocols.has(word) && droseraRefuses) {
          return { ok: false, message: `drosera refuses protocol word "${word}"; its contract allows protocol words` };
        }
      }
      return { ok: true, message: `the two lists agree on a ${corpus.length}-word corpus` };
    },
  }),
]);

export const defaultProbes = Object.freeze([
  ...seedProbes,
  ...capillaryProbes,
  ...myosotisProbes,
  ...aestivationProbes,
  ...droseraProbes,
  ...crossProbes,
]);
