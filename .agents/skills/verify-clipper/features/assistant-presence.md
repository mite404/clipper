# Assistant presence

Once an agent connects (CLIP-51), the header's Assistant button becomes a presence chip - the
agent's avatar with a live dot and its display name - whose popover carries the name card and the
session's live tool-call count. Disconnect, or any edit to the model server, model id or key,
reverts the plain button. A request runs only inside a connected session.

## Sub-features

- Never connected or disconnected: the plain Assistant button, no chip, no dot.
- Connect probes the model server first: OpenRouter's key check, a local server's model list. A
  refusal keeps the plain button and shows the reason inline.
- The chip's popover names the agent as "<display name> (AI)" and announces the count with
  `aria-live`. The count follows each finished tool call while a request still runs.
- Escape and an outside press close the popover. "Open assistant" in it opens the drawer.
- The drawer shows Disconnect while connected; Send is enabled only in a session.
- `ui-presencechip` Normal and Stress Storybook records; the stress record fits 320px.

## Driving it with Playwright

`.agents/skills/verify-clipper/scripts/verify.mjs all` runs `tests/agent-presence.spec.ts` against
the production preview with a mocked model host: the disconnected-to-connected transition, the live
count held mid-request, a refused key, and disconnect on config edit. `tests/agent.spec.ts` connects
before its mocked request. `tests/presence-chip.spec.ts` drives the Storybook records.

## Gotchas

The session lives in a module-level store in `src/agent.ts`, read with `useSession`; the bridge
itself has no connection state. The display name comes from the model id, so a typed custom id names
the chip. Closing the drawer never disconnects; only Disconnect or a config edit does.
