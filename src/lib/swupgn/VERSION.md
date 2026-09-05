# Vendored SWU-PGN reader

Source: forceteki `swupgn/src/`. Re-vendored 2026-09-04 against the published **SWU-PGN/1.0**
writer (`kind` on MOVE/CREATE_TOKEN/CARDS, `%%% STORY`, `%%% CARDS`, `attachedTo`, `RESOURCE`).
Re-synced 2026-09-05 against upstream `479b2b5f`: the only upstream change since was the
render wording `(cost N)`, which the normative `minimal.render.txt` pins.

## Conformance gate

`__tests__/vectors.test.ts` runs every vector under `__tests__/fixtures/vectors/` (copied
verbatim from forceteki `swupgn/test-vectors/`) through parse → fold → render and requires
byte-identical output (spec §20). `__tests__/fixtures/*-2026-09-05.swupgn` are real files the
fixed writer produced (organic game; a printed upgrade + advantage token whose host is then
defeated; a pilot whose vehicle is then destroyed) and pin the upgrade lifecycle between
keyframes. When upstream adds a vector, copy it in; when the writer changes, regenerate these.

`validate.ts` stays omitted (Node-only: fs/path + ajv).

## Version numbers do not order this format

A file saying `SWU-PGN/1.1` is **older** than `1.0` — the format was numbered 1.1 during
development and corrected at publication. Match the `Game` tag exactly, never `>=`.

## Client-owned divergences — preserve these when re-vendoring

- **`types.ts`** — `Annotation` carries `id`/`parent`/`ts` for the viewer's threaded discussion.
  These are now in the upstream `annotation.schema.json` and spec §15 (added 2026-09-05), so an
  exported file validates. Before that the schema said `additionalProperties: false` and this
  note wrongly claimed otherwise.
- **`parse.ts` Game-tag gate** — spec §18/§22.1: refuse any major other than 1, accept every
  `SWU-PGN/1.x` by shape. Upstream leaves this to `validate()`, which is Node-only and omitted
  here, so the reader itself has to say no.
- **`fold.ts` upgrade attach/detach** — `attachToHost` on a MOVE carrying `attachedTo` into an
  arena (the spec's normative binding, §10.1), idempotent with `PLAY_UPGRADE.target`; and
  `detachFromHosts` on ANY arena exit and on DEFEAT. Upstream's `upgrades[]` is append-only
  (§14 lists it un-gated) and relies on the next keyframe; a scrubber renders the frames in
  between, where a defeated Ascension Cable otherwise stays on its host for the rest of the
  round. Keyed on the zone transition, not `kind`, because the writer marks a pilot's exit
  `kind: "unit"` with no host.
- **`tokens.ts` `eventKind()`** — `kind` when stated, else `attachedTo` ⇒ upgrade (the §22.1
  fallback for a file that states no kind). Both `isStatusTokenCard` call sites use it.
- **`serialize.ts`** — emits `%%% STORY` (the document's own, or a fresh render) and
  `%%% CARDS` in the spec's canonical section order. Both are optional, but dropping them
  turned an annotated export into a file that named nothing.
- **`fold.ts` `snapToKeyframe()`** — merges a keyframe PER SEAT; upstream replaces wholesale
  and the spec says to ignore a keyframe missing a seat. Current writers always emit both
  seats, so this is a compatibility shim for the 1.1 files already in the wild, where a
  keyframe carrying one seat (or `"players": {}`) would otherwise erase a player.
- **`fold.ts` `foldFrames()`** — no upstream equivalent; upstream only needs a final state or
  a single `stateAt`. The scrubber needs every frame, and `events.map((_, i) => fold(...))`
  is O(n²). 3ms / 0.6MB on a 523-frame game.
- **`fold.ts` hand CONTENTS** — upstream tracks `handSize` on MOVE but only ever appends to
  `hand[]` from DRAW, so `hand[]` grows monotonically. Harmless upstream (it's outside the
  integrity gate); fatal here, because the board renders that array.
- **`fold.ts` The Force and Credits** — `TOKEN:the force` moving on and off a base drives
  `hasForce`; `TOKEN:credit…` moving on/off a base counts `credits`. Upstream sets neither.
- **`tokens.ts`** — client-only. Repairs the token lifecycle in pre-1.0 files (which emit no
  removal decrement) and classifies token upgrades when no `kind` is stated.
- **`parse.ts` `MAX_EVENTS`** — 200k-event ceiling. Upstream has none because it never builds
  per-frame snapshots; the viewer does, so an unbounded event count is an OOM on a shared file.
- **`fold.ts` untrusted-input guards** — seat validation (a `p` of `"__proto__"` resolved to
  Object.prototype and polluted it), non-object event records, scalar-where-array `cards`,
  and `base@[12]` only. Upstream folds server-generated files; the viewer folds uploads.
  `isSeat` and `asIdList` are exported for the client's own per-tab utilities.
- **`fold.ts` keyframe normalization** — `snapToKeyframe` ignores a keyframe that is not an
  object and coerces each seat to the `PlayerState` shape (`normalizePlayer`/`normalizeCard`:
  arrays, finite numbers, booleans; extra fields such as upstream's `power`/`hp`/`captured`
  ride through), capping every list at `MAX_KEYFRAME_LIST` (200) BEFORE the deep copy so a
  hostile keyframe is never cloned whole. A keyframe card without `upgrades` threw on the next
  arena exit and took the whole replay down. Every test in `fold.test.ts` under "a keyframe
  off an untrusted file".
- **`fold.ts` / `tokens.ts` same-arena re-attach** — a MOVE whose `from` and `to` are the same
  arena but which names a new `attachedTo` is an upgrade changing hosts: `dropInertRecords`
  keeps it and `applyMoveCounts` detaches then attaches. Upstream drops it as inert.
- **`parse.ts` record shape** — a record that parses to `null`, a number or a string is
  refused with its line number (§4 says every record is an object). It used to reach
  `events[i].seq` in the viewer and be persisted to IndexedDB before first render, so the
  `?id=` link crash-looped.
- **`cardNames.ts` / `render.ts` / `integrity.ts` untyped fields** — a non-string `name` in
  the CARDS index is ignored and newlines in a name are flattened (a rendered story line
  beginning `%%%` would end the STORY section of an export); `render()` treats a scalar
  `cards`/`found` as empty; `checkKeyframes` skips a seat that is not PlayerState-shaped and a
  keyframe that is not an object.
- **`fold.ts` discard CONTENTS** — dedup plus removal, same reason as hand contents: the
  viewer renders the pile keyed by card id, and `numCardsInDeck` subtracts its length.

Re-vendoring dropped MAX_EVENTS and the discard guards once already (caught by /review, not
by the test suite — they had no tests). Diff this list against upstream before accepting a
re-vendor, not just the test results.

Resolved upstream, do NOT re-apply: the `[Rounds]` NaN fallback, and keeping token upgrades
out of the arenas (now driven by `kind`).

Long-term: replace with a shared npm package (see spec "Long-term note").
