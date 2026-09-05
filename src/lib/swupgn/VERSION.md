# Vendored SWU-PGN reader

Source: forceteki `swupgn/src/`. Re-vendored 2026-09-05 at upstream **`78566bda`** ("Land the
replay client's nine findings"). `swupgn/src/` is byte-identical through upstream `dd7f9af4`;
the three commits after `78566bda` touch only the spec text (regroup readies the exhausted
resources one `READY_RESOURCES` at a time; a reader tolerates a no-op one) and a spec comment.
The spec is `docs/SWU-PGN-1.0-SPEC.md` at that commit.

`types.ts`, `integrity.ts` and `render.ts` are **verbatim** (types.ts: one closing brace
re-indented for this repo's eslint, whitespace only). `fold.ts`, `parse.ts` and `cardNames.ts`
are upstream plus the client-owned blocks listed below. `validate.ts` stays omitted (Node-only:
fs/path + ajv). `tokens.ts`, `serialize.ts` and `foldFrames` are client-only.

## What 78566bda changed in the format (all handled here)

- Resources are counted, never named: `EXHAUST_RESOURCES` / `READY_RESOURCES {p, amount}`,
  clamped to the bucket; `exhausted: true` on a `MOVE` out of `resource`; per-card
  `READY`/`EXHAUST` of a resource is no longer written.
- `TAKE_CONTROL` with `zone: "base"` shifts a credit or the Force; `exhausted` on a stolen
  resource shifts the exhausted bucket.
- Credits and the Force fold from the two reserved token names (§6.1) moving on/off `base`.
- `CAPTURE.p` is the captor's controller and `by` names the captor; `CardInstanceState.captured`
  lists what a unit holds; `RESCUE`, a `MOVE` from `capture`, and the captor leaving play clear it.
- `attachedTo` is applied by the fold on the arena-bound MOVE (never for `TOKEN:` ids); exits
  are host-less and detach keys on the zone transition or `DEFEAT`. `DEPLOY_LEADER` with
  `kind: "upgrade"` attaches to `target`.
- Token upgrades classify by type: anything that is not Shield/Experience is a `STATUS_TOKEN`
  under its own name (`weakness` included), an open list.
- Keyframe cards carry snapshot `power`/`hp` (not gated) and `captured` (gated). The gate now
  compares `resourcesExhausted`, `credits`, `hasForce`, and per card `upgrades`/`captured` as
  sets. A keyframe missing a seat or malformed is ignored and reported (§13).
- Render wording: `plays X on Host`, `deploys X as a pilot on Vehicle`, `captures X with Y`,
  `holds X` in the board summary; the resource counters print nothing.

## Conformance gate

`__tests__/vectors.test.ts` runs every vector under `__tests__/fixtures/vectors/` (all five,
copied verbatim from forceteki `swupgn/test-vectors/`: `minimal`, `organic`, `upgrades`,
`pilot`, `capture`) through parse → fold → render and requires byte-identical render and a
byte-identical fold apart from the two pile contents below; every vector must also pass
`checkKeyframes` with no mismatch (spec §20 step 5). Step 2 (`validate()`) is asserted
upstream on the same bytes. `__tests__/fixtures/sample-game.swupgn` is a pre-1.0 file and
pins the compatibility shims.

## Version numbers do not order this format

A file saying `SWU-PGN/1.1` is **older** than `1.0` — the format was numbered 1.1 during
development and corrected at publication. Match the `Game` tag exactly, never `>=`.

## Client-owned divergences — preserve these when re-vendoring

- **`parse.ts` Game-tag gate** — spec §18/§22.1: refuse any major other than 1, accept every
  `SWU-PGN/1.x` by shape. Upstream leaves this to `validate()`, which the client does not ship.
- **`parse.ts` `MAX_EVENTS`** — 200k-event ceiling. Upstream has none because it never builds
  per-frame snapshots; the viewer does, so an unbounded event count is an OOM on a shared file.
- **`parse.ts` record shape** — a record that parses to `null`, a number, a string or an
  array is refused with its line number (§4 says every record is an object). It used to reach
  `events[i].seq` in the viewer and be persisted to IndexedDB before first render, so the
  `?id=` link crash-looped. Upstream leaves this to `validate()`.
- **`fold.ts` hand and discard CONTENTS** — upstream only counts on MOVE and appends to
  `hand[]` from DRAW / `discard[]` from DISCARD, PLAY_EVENT and DEFEAT, so both grow
  monotonically. Harmless upstream (outside the integrity gate); fatal here, because the board
  renders both arrays keyed by card id. The client adds AND removes on MOVE and dedupes the
  summary records. This is the one place the vectors' `.fold.json` is not reproduced byte for
  byte: the client's piles are upstream's minus the cards that actually left the zone, and
  `vectors.test.ts` asserts exactly that.
- **`fold.ts` keyframe snap** — `snapToKeyframe` merges PER SEAT: a seat with the shape the
  fold dereferences (§13's `isCompleteKeyframe`, applied per seat) is snapped with every
  scalar coerced (`normalizePlayer`/`normalizeCard`) and every list capped at
  `MAX_KEYFRAME_LIST` (200) BEFORE the deep copy, so a hostile keyframe is never cloned whole;
  a seat that is missing or malformed is ignored and the folded seat kept. Upstream replaces
  wholesale and ignores the whole keyframe. Pre-1.0 files in the wild carry one-seat keyframes,
  and replacing wholesale erased that player's board. Compatibility shim. Also filters a token
  upgrade or an attached card that an early writer listed as its own arena card. Snapshot
  `power`/`hp` ride through when numeric. `isCompleteKeyframe`/`hasSnapKeyframe`/`emptyState`
  are exported for the verbatim `integrity.ts` and `render.ts`.
- **`fold.ts` `foldFrames()`** — no upstream equivalent; the scrubber needs every frame and
  `events.map((_, i) => fold(...))` is O(n²).
- **`fold.ts` `eventKind()` fallback** — `kind` when stated, else `attachedTo` ⇒ upgrade (the
  §22.1 fallback for a file that states no kind).
- **`fold.ts` pre-1.0 token filter** — `isStatusTokenCard` short-circuits a token upgrade's
  own records before the switch. Equivalent to upstream for a 1.0 record (a token never joins
  an arena, `attachTo` skips `TOKEN:` ids, its DEFEAT finds nothing); needed for a 1.1 file
  that states no `kind`, where the token would otherwise fold into an arena.
- **`fold.ts` same-arena re-attach** — a MOVE whose `from` and `to` are the same arena but
  which names a new `attachedTo` is an upgrade changing hosts: `dropInertRecords` keeps it and
  `applyMoveCounts` detaches then attaches. Upstream drops it as inert; the writer never emits
  one.
- **`fold.ts` reserved-token predicates** — `countBaseToken` uses `tokens.ts`'s
  `isCreditToken`/`isForceToken`, which accept the pre-1.0 `TOKEN:The Force` as well as the
  §6.1 `TOKEN:the-force#…`. Upstream matches the prefix only.
- **`fold.ts` non-object event skip** — `reduce()` returns unchanged for a `null`/scalar
  record (defence in depth behind the parse guard; `foldFrames` keeps the frame slot).
- **`cardNames.ts` untyped fields** — a `null` index entry is skipped; a non-string `name` is
  ignored and newlines in a name are flattened (a rendered story line beginning `%%%` would
  end the STORY section of an export).
- **`tokens.ts`** — client-only. Repairs the token lifecycle in pre-1.0 files (which emit no
  removal decrement), drops inert records, classifies token upgrades when no `kind` is stated,
  recovers a pilot's host from the keyframes when the writer named none, and resolves token
  art ids for both id shapes.
- **`serialize.ts`** — client-only: emits `%%% STORY` (the document's own, or a fresh render)
  and `%%% CARDS` in the spec's canonical section order.
- **`types.ts` Annotation threading** — `id`/`parent`/`ts` are upstream now (spec §15).
  Nothing client-owned remains in types.ts.

Re-vendoring dropped MAX_EVENTS and the discard guards once already (caught by /review, not
by the test suite — they had no tests). Diff this list against upstream before accepting a
re-vendor, not just the test results.

Resolved upstream, do NOT re-apply: the `[Rounds]` NaN fallback; keeping token upgrades out of
the arenas (driven by `kind`); the seat/`__proto__` guard, `arr()` for scalar-where-array
fields and the primitive-keyframe guard (upstream has all three); attach-from-`attachedTo`,
detach-on-exit and `hasForce` (upstream folds them now); the `(cost N)` render wording.

Long-term: replace with a shared npm package (see spec "Long-term note").
