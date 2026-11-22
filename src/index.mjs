// Trellis: the testing lattice. Pass, fail, unknown — fail outranks unknown,
// unknown outranks pass, and health is a dated run, never a standing truth.

export { POINTS, ProbeError, probe, probeList, runProbe, runProbeAsync } from './point.mjs';
export { verdict, rollup } from './score.mjs';
export { familyGrid, familyGridAsync } from './grid.mjs';
export {
  FAMILY_MEMBERS,
  seedProbes,
  capillaryProbes,
  myosotisProbes,
  aestivationProbes,
  droseraProbes,
  crossProbes,
  defaultProbes,
} from './probes.mjs';

export const VERSION = '0.6.1';

export function about() {
  const lines = [
    `trellis ${VERSION}`,
    'the testing lattice: multi-point probes over the family',
    '',
    'modules:',
    '  point    the four test points and the probe record, fail closed',
    '  score    verdict math: fail > unknown > pass, nothing silently passed',
    '  grid     the multi-point grid over injected subjects',
    '  probes   the default probe lists for each family member and the cross probes',
    '',
    'points: shape, behavior, consistency, operational',
    'the core never imports a sibling; subjects are injected',
    'health claims are dated runs kept in docs/evidence/',
  ];
  return lines.join('\n');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(about());
}
