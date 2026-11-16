# Clipper

Local-first React video editor. Source media stays in the browser. See README.md for the development
and verification commands, and `.agents/skills/verify-clipper/` for user journeys.

## Ticket delivery

- Keep ticket scope, state, dependencies, ownership and priority only in `docs/master-tickets.md`.
- Before assigning, implementing, reviewing, delivering or archiving a ticket, load
  [managing-tickets](.agents/skills/managing-tickets/SKILL.md).
- Respect existing assignments and path reservations. The coordinator owns the sole main push slot;
  delivery requires the ticket's accepted review, strict gates and exact-SHA green CI.
- Keep source media private and processing local. Preserve the shrink-only Fallow baseline.
