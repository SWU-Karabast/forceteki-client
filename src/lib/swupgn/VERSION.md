# Vendored SWU-PGN reader

Source: forceteki `swupgn/src/`. Re-vendored 2026-09-04 against the published **SWU-PGN/1.0**
writer (`kind` on MOVE/CREATE_TOKEN/CARDS, `%%% STORY`, `%%% CARDS`, `attachedTo`, `RESOURCE`).

`validate.ts` stays omitted (Node-only: fs/path + ajv).

## Version numbers do not order this format

A file saying `SWU-PGN/1.1` is **older** than `1.0` — the format was numbered 1.1 during
development and corrected at publication. Match the `Game` tag exactly, never `>=`.

## Client-owned divergences — preserve these when re-vendoring

- **`types.ts`** — `Annotation` carries `id`/`parent`/`ts` for the viewer's threaded discussion.
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
- **`fold.ts` The Force** — `TOKEN:the force` moving on and off a base drives `hasForce`;
  upstream never sets it.
- **`tokens.ts`** — client-only. Repairs the token lifecycle in pre-1.0 files (which emit no
  removal decrement) and classifies token upgrades when no `kind` is stated.
- **`serialize.ts`** — client-owned; no upstream counterpart.

Resolved upstream, do NOT re-apply: the `[Rounds]` NaN fallback, and keeping token upgrades
out of the arenas (now driven by `kind`).

Long-term: replace with a shared npm package (see spec "Long-term note").
