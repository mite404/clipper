# Queue thread resume files

Preserved on 2026-11-15 before the Amp project switched its primary repository to GitHub. These
files are ignored on `main` and normally live only in the queue thread's orb
([T-2d1e888a](https://ampcode.com/threads/T-2d1e888a-23ff-4bf4-b2d1-551553f2ef0a)). This branch is
a copy for safekeeping. Do not merge it into `main`.

- `scripts/`: master list update templates, audio mix timing, screenshot helpers, and the scripts
  that break the exporter and the editor on purpose to prove the REF-17 and REF-19 tests fail.
- `review-20261115/`: raw output of the baseline code review behind `docs/refactor/refactor01.md`.

To restore, copy `.amp/in/orb-backup/` from this branch into the same path of a checkout.

Left out on purpose: `openscreen-capture-evidence.md`, because it holds measurements from the
owner's real recording.
