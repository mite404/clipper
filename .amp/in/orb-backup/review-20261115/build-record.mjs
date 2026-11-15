// Builds docs/refactor/refactor01.md from the review run's report.md.
// Usage: node build-record.mjs <report.md> <out.md>, then prettier --write the output.
import { readFileSync, writeFileSync } from 'node:fs';

const [reportPath, outPath] = process.argv.slice(2);

// finding number -> [ticket, risk tier] as queued in docs/master-tickets.md
const TICKETS = {
  1: ['REF-1', 'Medium'],
  2: ['REF-15', 'Medium'],
  3: ['REF-21, REF-22', 'Medium, Large'],
  4: ['REF-13', 'Small'],
  5: ['REF-16', 'Medium'],
  6: ['REF-8', 'Small'],
  7: ['REF-7', 'Small'],
  8: ['REF-4', 'Small'],
  9: ['REF-11', 'Small'],
  10: ['REF-4', 'Small'],
  12: ['REF-4', 'Small'],
  13: ['REF-5', 'Small'],
  14: ['REF-23 (decision D-1)', 'Large'],
  15: ['REF-10', 'Small'],
  16: ['REF-6', 'Medium'],
  17: ['REF-1', 'Medium'],
  18: ['REF-18', 'Medium'],
  20: ['REF-19, REF-24', 'Medium, Large'],
  21: ['REF-9', 'Small'],
  22: ['REF-2', 'Small'],
  23: ['REF-12', 'Small'],
  24: ['REF-23 (decision D-1)', 'Large'],
  25: ['REF-3', 'Medium'],
  26: ['REF-3', 'Medium'],
  28: ['REF-21', 'Medium'],
  29: ['CLIP-7 acceptance (round-trip test)', 'Medium'],
  31: ['REF-17', 'Medium'],
  32: ['REF-14', 'Small'],
  33: ['REF-14', 'Small'],
  34: ['REF-14', 'Small'],
  35: ['Decision D-2', '-'],
  36: ['REF-20', 'Medium'],
  37: ['REF-11', 'Small'],
  38: ['REF-10', 'Small'],
};

// The three decision items are named in prose in the report, not in its summary list.
const DECISIONS = [
  { n: 14, sev: 'P2', loc: 'src/timeline.ts:45', title: 'Zoom anchoring under ripple insert is undecided' },
  { n: 24, sev: 'P2', loc: 'src/App.tsx:947', title: 'Unit of the stored zoom focus is undecided' },
  { n: 35, sev: 'P3', loc: '.github/workflows/ci.yml:3', title: 'CI does not run on pull requests' },
].map((d) => ({ ...d, validated: 'Not eligible (decision)' }));

const report = readFileSync(reportPath, 'utf8')
  // house style: plain dash in prose; code spans (odd segments) keep `npm run x -- args`
  .replace(/^.*$/gm, (line) =>
    line
      .split('`')
      .map((part, i) => (i % 2 ? part : part.replaceAll(' -- ', ' - ')))
      .join('`'),
  )
  .replace(/^## Actionable Findings Summary$/m, '### Actionable Findings Summary');

const actionable = [...report.matchAll(/^- #(\d+) (P\d) `([^`]+)` (.*?) - (.*)$/gm)].map(
  ([, n, sev, loc, title, rest]) => ({
    n: Number(n),
    sev,
    loc,
    title,
    validated: rest.includes('validator confirmed') ? 'Confirmed' : 'Not validated',
  }),
);
if (actionable.length !== 31) throw new Error(`expected 31 actionable findings, got ${actionable.length}`);

const ranked = [...actionable, ...DECISIONS].sort(
  (a, b) => a.sev.localeCompare(b.sev) || a.n - b.n,
);
const rows = ranked.map(({ n, sev, loc, title, validated }, i) => {
  const [ticket, risk] = TICKETS[n] ?? [];
  if (!ticket) throw new Error(`finding #${n} has no ticket`);
  return `| ${i + 1} | #${n} | ${sev} | ${title} | \`${loc}\` | ${validated} | ${risk} | ${ticket} |`;
});

const header = `# Refactor 01: baseline code review record

This is the record of the one whole-codebase review of Clipper at baseline
[\`5a9bc1f\`](https://github.com/mite404/clipper/commit/5a9bc1f44c21fad089a25c5cbd4ad05530624a9c),
run on 2026-11-15 with \`ce-code-review\`. It is a snapshot for the owner's records. It is not a
queue and is not updated as tickets land: [docs/master-tickets.md](../master-tickets.md) is the
only live list, and it cites the finding numbers used here.

## Outcome

- Verdict: **Ready with fixes**. 34 findings: 0 P0, 3 P1, 24 P2, 7 P3.
- 31 findings are actionable. 3 are decisions for the owner (#14, #24, #35).
- "Confirmed" below means an independent validator re-inspected the finding and agreed, several
  times by reproducing it. Only #1 to #8 were validated. The other 26 findings rest on one
  reviewer pass each and are marked "Not validated"; treat them as claims to reproduce in the
  ticket's failing test before fixing.
- All reviewers ran on one model, so agreement between them is not independent evidence. The
  adversarial lens ran in-process. Security and project-standards lenses did not run; the
  [Coverage](#coverage) section says why.
- Nothing was changed by the review. Fixes land as separately tested tickets.

## Ranked findings

Ranked by severity, then by stable finding number. "Risk" is the size of the refactor ticket that
carries the fix (small, medium or large), as queued in the master list at the time of writing.

| Rank | Finding | Severity | Issue | Location | Validation | Risk | Ticket |
| --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

Finding numbers 11, 19, 27 and 30 are absent: those candidates were moved to residual risks and
testing gaps, listed under [Coverage](#coverage).

## Full report

The report below is the review's own output, kept verbatim apart from line wrapping and dash
style. Line numbers refer to the tree at \`5a9bc1f\`. The run directory it names was under \`/tmp\`
in the reviewing orb and is not preserved; the report text here is the copy of record.

`;

writeFileSync(outPath, header + report.replace(/^## Code Review Results\n/, '### Review results\n'));
