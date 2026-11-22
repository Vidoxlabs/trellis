#!/usr/bin/env node
// Trellis bundle runner: wire the multi-point grid to the canonical family
// workspace — siblings as sibling checkouts beside this one (or pointed at by
// TRELLIS_FAMILY_ROOT). Loads each present member, runs the default probes,
// spawns each present member's npm test for the operational point, prints the
// dated report, exits nonzero on any fail. Absent members are declared
// unknown; absence is data.

import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  FAMILY_MEMBERS,
  defaultProbes,
  familyGridAsync,
  probe,
} from '../src/index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const familyRoot = process.env.TRELLIS_FAMILY_ROOT
  ?? path.resolve(here, '..', '..');

const subjects = {};
const absent = [];
for (const member of FAMILY_MEMBERS) {
  const entry = path.join(familyRoot, member, 'src', 'index.mjs');
  try {
    // Dynamic import of the sibling's entry; the engine itself stays pure.
    const namespace = await import(`file://${entry}`);
    let pkg = null;
    try {
      pkg = JSON.parse(readFileSync(path.join(familyRoot, member, 'package.json'), 'utf8'));
    } catch {
      pkg = null;
    }
    subjects[member] = { namespace, pkg };
  } catch {
    subjects[member] = null;
    absent.push(member);
  }
}

// Operational probes: each present member's own test suite, actually run.
const operational = FAMILY_MEMBERS.map((member) =>
  probe({
    id: `${member}-suite-runs-green`,
    point: 'operational',
    applies: member,
    summary: `The ${member} repository's own test suite runs to a zero exit code.`,
    check: () => {
      const run = spawnSync('npm test', {
        cwd: path.join(familyRoot, member),
        shell: true,
        encoding: 'utf8',
        timeout: 120_000,
      });
      if (run.status === 0) {
        const tail = (run.stdout ?? '').trimEnd().split('\n').findLast((line) => /^# (pass|tests)/.test(line)) ?? 'suite exit 0';
        return { ok: true, message: tail };
      }
      const reason = run.status === null ? 'timed out' : `exit ${run.status}`;
      const lastLine = (run.stdout ?? '').trimEnd().split('\n').at(-1) ?? '';
      return {
        ok: false,
        message: `${member}'s suite did not pass (${reason}): ${lastLine.slice(0, 200)}`,
      };
    },
  })
);

const grid = await familyGridAsync({
  subjects,
  probes: [...defaultProbes, ...operational],
});

const runDate = new Date().toISOString().slice(0, 10);
console.log(`trellis family grid — observed run ${runDate}`);
console.log(`family root: ${familyRoot === path.resolve(here, '..', '..') ? 'canonical workspace layout' : familyRoot}`);
console.log('');
const pointOrder = ['shape', 'behavior', 'consistency', 'operational'];
for (const member of [...FAMILY_MEMBERS, '*']) {
  const bucket = grid.bySubject[member];
  if (!bucket) continue;
  const label = member === '*' ? 'cross-family' : member;
  const cells = pointOrder.map((point) => {
    const cell = bucket.points[point];
    if (cell.pass + cell.fail + cell.unknown === 0) return '-';
    const marks = [
      cell.fail > 0 ? `fail:${cell.fail}` : null,
      cell.unknown > 0 ? `unknown:${cell.unknown}` : null,
      cell.pass > 0 ? `pass:${cell.pass}` : null,
    ].filter(Boolean).join(' ');
    return `${point} ${marks}`;
  });
  console.log(`${label.padEnd(12)} ${bucket.verdict.padEnd(8)} ${cells.join('  ')}`);
  for (const result of bucket.results) {
    if (result.status === 'pass') continue;
    console.log(`  ${result.status}: ${result.id} — ${result.detail}`);
  }
}
if (absent.length > 0) {
  console.log('');
  console.log(`absent checkouts (declared unknown): ${absent.join(', ')}`);
}
console.log('');
console.log(`family verdict: ${grid.verdict}`);
process.exit(grid.verdict === 'pass' ? 0 : grid.verdict === 'fail' ? 1 : 2);
