import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const master = readFileSync(path.join(root, 'docs/master-tickets.md'), 'utf8');
const review = readFileSync(path.join(root, 'docs/refactor/refactor01.md'), 'utf8');
const idPattern = /\b(?:CLIP|REF|VERIFY|BOOT|DOC|CAPTURE|D)-\d+[a-z]?\b/g;
const definitions = [
  ...master.matchAll(/<a id="([a-z]+-\d+[a-z]?)"><\/a>\[([^\]]+)\]\(([^)]+)\)/g),
];
const ids = definitions.map(([, , id]) => id);
const ranked = review.split('## Ranked findings')[1].split('## Full report')[0];
const findingRows = ranked
  .split('\n')
  .filter((line) => /^\|/.test(line) && /\| #\d+\s*\|/.test(line));

assert.equal(new Set(ids).size, ids.length, 'Duplicate operational ticket ID');
assert.ok(ids.length > 0, 'No operational ticket definitions');
for (const [line, anchor, id, target] of definitions) {
  assert.equal(anchor, id.toLowerCase(), `Wrong anchor for ${id}`);
  assert.ok(
    master.split('\n').some((row) => row.startsWith(`| ${line}`)),
    `${id} is not leftmost`,
  );
  if (!target.startsWith('#')) {
    const file = path.join(root, 'docs', target);
    const detail = readFileSync(file, 'utf8');
    assert.equal(path.basename(file), `${id}.md`, `Filename mismatch for ${id}`);
    assert.equal(detail.split('\n')[0], `# ${id}`, `H1 mismatch for ${id}`);
    assert.ok(detail.includes('master-tickets.md#'), `Missing authoritative status link for ${id}`);
  }
}
for (const id of [...master.matchAll(idPattern)].map(([id]) => id)) {
  assert.ok(ids.includes(id), `Orphan ticket reference ${id}`);
}
for (const file of readdirSync(path.join(root, 'docs/tickets'))) {
  if (file.endsWith('.md')) assert.ok(ids.includes(file.slice(0, -3)), `Orphan detail ${file}`);
}
assert.equal(findingRows.length, 34, 'Expected 34 retained baseline findings');
assert.deepEqual(
  findingRows.map((row) => +row.match(/#(\d+)/)[1]),
  Array.from({ length: 38 }, (_, i) => i + 1).filter((id) => ![11, 19, 27, 30].includes(id)),
  'Missing, duplicate or renumbered finding',
);
for (const row of findingRows) {
  assert.match(
    row,
    /^\| \[(?:CLIP|REF|D)-/,
    'Historical ticket mapping must be leftmost and linked',
  );
  for (const id of row.match(idPattern) ?? [])
    assert.ok(ids.includes(id), `Unmapped finding ${id}`);
}
for (const row of master.split('\n').filter((line) => /\|\s*[RTA]\d+\s*\|/.test(line))) {
  assert.match(row, /^\| \[(?:CLIP|REF|VERIFY|D)-/, 'Informational note has no linked disposition');
}
for (const group of ['R', 'T', 'A']) {
  const sources = [...master.matchAll(new RegExp(`\\|\\s*${group}(\\d+)\\s*\\|`, 'g'))].map(
    (m) => +m[1],
  );
  assert.deepEqual(
    sources.sort((a, b) => a - b),
    Array.from({ length: 11 }, (_, i) => i + 1),
    `Expected one disposition for each of 11 ${group} review notes`,
  );
}
console.log(
  `Ticket audit OK: ${ids.length} unique IDs, 34 findings, 33 informational dispositions`,
);
