# Vendored SWU-PGN reader

Source: forceteki `swupgn/src/`. Re-vendored 2026-09-11 at upstream **`463c3022`** ("docs: sync
the SWU-PGN docs with what the writer actually does"), on top of `3c4ed35d` ("Encode the whole
CR 1.16 game state") and `78566bda` ("Land the replay client's nine findings"). The spec is
`docs/SWU-PGN-1.0-SPEC.md` at that commit.

`types.ts` and `render.ts` are **verbatim** (no re-indent needed at `463c3022`; this repo's
eslint is clean on them as they stand). `integrity.ts` is verbatim apart from one line, the
keyframe snap — see the divergence list. `fold.ts`, `parse.ts` and `cardNames.ts` are
upstream plus the client-owned blocks listed below. `validate.ts` stays omitted (Node-only:
fs/path + ajv), and `actionLinks.ts` with it — see "Deliberately not ported". `tokens.ts`,
`serialize.ts` and `foldFrames` are client-only.

## What `463c3022` changed in the format (all handled here)

- **`LEADER_FLIP {p, card, onStartingSide}`** — a double-sided leader (Chancellor Palpatine,
  `TWI#017`) never deploys: its Action turns the card over in place in the base zone, changing
  its title, aspects and traits. No `MOVE`, no `DEPLOY_LEADER`, and nothing else in the stream
  implies it. `onStartingSide` is the resulting face, stated and never toggled, so applying it
  twice is applying it once and a reader that snapped to a keyframe can apply it with no
  history. The fold sets it on `leaderOwner(card) ?? player(p)`, seeding the seat's `leader`
  entry from the flip when nothing has named it yet; the gate compares it only when the
  keyframe states it (absent means "not a double-sided leader", never `false`); the story
  prints `<player> flips <name>`. The board passes it to `s3CardImageURL`, which already keys
  the back-face art off it — before this a flipped leader replayed as its front side forever.
- **`PlayerState.baseEpicActionUsed`** — an `ABILITY_ACTIVATE` with `epic: true` whose `card`
  is `base@N` is the BASE spending its Epic Action. Twelve bases carry one, and CR 1.16 counts
  it as game state. A base ref resolves straight to a seat (§6.3), so it is checked first and
  anything else falls through to the leader's own flag; the leader's single `epicActionUsed`
  stays one boolean, because a leader has exactly one Epic Action and both forms of it share
  the limit. Gated when the keyframe states it, against `?? false`. The board draws the same
  epic-action token on the base card.
- **`PlayerState.resources[]`** — WHICH cards are in the resource row, in the order they were
  resourced. Reconstructable because every `MOVE` names its card; the ready/exhausted SPLIT is
  not, so the two counts stay the authority on ready state. Added on `→ resource`, removed on
  `resource →`, and moved between seats by a `TAKE_CONTROL` with `zone: "resource"` — without
  that last part the card stays in the losing seat's row and the gate reports a mismatch on
  BOTH seats for the rest of the game. Stays **absent** until a MOVE or a keyframe supplies
  one. Gated as a set. The board draws the row from it, falling back to the client's MOVE scan
  for a file written before it existed.
- **`ReducedState.active`** — whose turn it is. **Keyframe-supplied and deliberately not
  derived**: deriving it means modelling passing and priority, exactly the rules knowledge this
  format exists to spare a reader, and the engine has not chosen one when `PHASE_START` fires.
  Exact at every keyframe, stale between them, so it is **not** part of the §14 gate and the
  client surfaces no turn indicator from it (the trays' turn aura stays `replayLiveCues`'s own
  per-frame derivation, which is a different claim). Stored only when the record names a real
  seat — `Seat` is erased at runtime, and an unguarded write puts arbitrary JSON in a field a
  reader indexes `players[active]` with.
- **`CREATE_TOKEN` places only into an arena** — `zone` must be `ground` or `space`. A token
  named in any other zone is not in play yet; placing it put a card in `cards[]` with a
  non-arena zone that no keyframe agrees with. Its `MOVE` into the arena is what puts it in
  play, exactly as for a printed card (§12.1 step 3).
- **`for` on any record** — names the top-level action a record belongs to, because the engine
  performs part of an action before it announces it (an attack's target `CHOICE` and the
  attacker's `EXHAUST` are `R2.A.5a`/`R2.A.5b` and belong to the `ATTACK` at `R2.A.6`). The
  move list starts each action's span at the first record filed under it
  (`replayMoves.firstFrameByAction`), so the highlight no longer sits on the previous action
  while the attacker is being chosen and exhausted on screen.
- **`EndDate`, `Match`, `GameNumber` header tags** — when the game ended (with `Date`, the
  duration), an opaque match id stable across a Bo3 (`sha256:<hex>` of the lobby id; a writer
  MUST NOT emit the lobby id itself), and which game of it this is. `parse` conditionally
  spreads each; `serialize` emits each when present (and `RecorderErrors` with them, which it
  had been dropping); the panel header shows `formatGameMeta` — `12m 31s · game 2 of match
  9f3a1c2`, each part only when the file states it.
- **`MAX_ZONE_LIST = 1000`** on every zone-list insert. It matters more here than upstream:
  this parses untrusted uploaded files in a browser, and `addOnce` scans the list, so one
  `{"t":"DRAW","cards":[…200k unique strings…]}` is ~2e10 string comparisons and a hung tab.
  Past the cap the id is dropped rather than the file rejected — degrading is the fold's
  contract, and no honest file comes near 1000.
- **`hand` and `discard` CONTENTS are now GATED** (§14). They were ungated on the belief that
  only the counts were reconstructable; every `MOVE` names its card, so both lists are exact.
  `hand` compares as a set (a hand is unordered), `discard` in order (a pile is ordered, §11).
  Upstream's five vectors produced 45 mismatches before this and none after. This also
  **retires the client's one fold divergence**: upstream folds both from `MOVE` and dedupes by
  id now, exactly as the client already did, so `vectors.test.ts` asserts `.fold.json` byte for
  byte with no carve-out.

## What 3c4ed35d changed in the format (all handled here)

- A unit entering play exhausted gets an `EXHAUST` right after its arrival (the normal case);
  one entering ready gets nothing. Before this every replay showed a just-played unit ready.
- `STATS {card, power, hp, keywords?}`: the engine's live values, written whenever they change
  and snapshotted in keyframes. The fold sets them on the card; the gate compares them when a
  keyframe carries them. The board shows them outright; the static reconstruction in
  `swupgnBoardAdapter.effectiveStats` is now only for files written before `STATS`.
- `ReducedState.initiativeTaken`, `PlayerState.deckSize`, `PlayerState.leader {id, deployed,
  exhausted, epicActionUsed}`; `epic: true` on `DEPLOY_LEADER` / `ABILITY_ACTIVATE`.
  `EXHAUST`/`READY` also set the leader's flag; the leader's `MOVE` arena→base undeploys it.
  All gated when the keyframe carries them; `deckSize` first-keyframe-exempt like `baseHp`.
- Render: `resources ready/total   deck n   leader deployed|exhausted|ready` on the board line
  and ` power/hp` after each unit; `STATS` prints nothing.
- Regroup writes `READY_RESOURCES` only for the exhausted resources; a reader tolerates a
  no-op one.

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
- Keyframe cards carry `captured` (gated). The gate compares `resourcesExhausted`, `credits`,
  `hasForce`, and per card `upgrades`/`captured` as sets. A keyframe missing a seat or
  malformed is ignored and reported (§13).
- Render wording: `plays X on Host`, `deploys X as a pilot on Vehicle`, `captures X with Y`,
  `holds X` in the board summary; the resource counters print nothing.

## UI coverage: where each §11 field renders

Every field of `ReducedState` (spec §11) reaches the screen through `swupgnBoardAdapter.adaptState`,
which builds the live board's `gameState` shape; the components are the live game's own. The
client never derives what the file states: card data is used for names, art, aspects, and two
fallbacks noted below. Verified per vector at the final frame by
`src/app/_utils/__tests__/vectorsBoard.test.ts`, and per field by `swupgnBoardAdapter.test.ts`.

| §11 field | Adapter output | Component |
|---|---|---|
| `round`, `phase` | `gameState.phase`; the round comes from the current `seq` | `TransportControls` (round/phase label, round marks) |
| `initiative` | `players[id].hasInitiative` | `Board` initiative token |
| `initiativeTaken` | `gameState.initiativeClaimed` (older file: `initiative != null`) | `Board` initiative token (filled = taken) |
| `baseHp` / `baseMaxHp` | `base.hp` = printed HP (card data) or the keyframe's `baseMaxHp`; `base.damage` = max − `baseHp`. Before the first keyframe the fold holds the placeholder 30, so `Replay.context.baseHpByFrame` supplies card-data HP for that window only (§21) | `LeaderBaseCard` (base) |
| `handSize`, `hand[]` | `cardPiles.hand`: the named cards, padded to `handSize` with face-down placeholders (a Perspective file); fog-of-war hides identities and keeps the count | `PlayerHand` |
| `deckSize` | `numCardsInDeck` = the file's `deckSize`; falls back to the INIT-order tracker (`deckTracker`); `undefined` when neither is known (absent ≠ zero) | `DeckDiscard` |
| `resourcesReady` / `resourcesExhausted` | `availableResources` = ready; `cardPiles.resources` = ready + exhausted | `Resources` (`ready/total`) |
| `resources[]` | the row's membership, straight from the fold; a file that states none falls back to the client's `hand → resource` MOVE scan, face-down for the remainder | `Resources` |
| `baseEpicActionUsed` | `base.epicActionSpent` | `LeaderBaseCard` (base) epic-action token |
| `active` | **nothing.** Keyframe-supplied and stale between keyframes (§11), so no turn indicator is derived from it. The trays' turn aura is `replayLiveCues.activeSeatByFrame`, a per-frame derivation from the seat each record names — a different claim, and never presented as the file's | — |
| `credits` | `cardPiles.credits` (one placeholder per credit) | `Credits` |
| `hasForce` | `forceToken.active` | `LeaderBaseCard` (Force token on the base) |
| `discard[]` | `cardPiles.discard` | `DeckDiscard` |
| `leader.id` | `leader.uuid` (header leader as fallback) | `LeaderBaseCard` |
| `leader.deployed` | `leader.zone` = `base` (art) or `leader` (deployed placeholder); a pilot leader rides on its host as a parented upgrade card | `LeaderBaseCard`, `UnitsBoard`/`GameCard` |
| `leader.exhausted` | `leader.exhausted` while undeployed (dimmed); the arena card's or the pilot card's flag while deployed. Older file: `Replay.context.leaderExhaustByFrame` (EXHAUST/READY scan) | `LeaderBaseCard`, `GameCard` |
| `leader.epicActionUsed` | `leader.epicActionSpent` | `LeaderBaseCard` epic-action token |
| `leader.onStartingSide` | `leader.onStartingSide`, which `s3CardImageURL` turns into the back-face art (`017-base2.webp`). Absent stays absent — `false` would ask for a back face the card does not have | `LeaderBaseCard` (leader art) |
| `cards[].zone` | `groundArena` / `spaceArena` | `UnitsBoard` |
| `cards[].damage`, `exhausted` | `damage`, `exhausted` (exhausted rotates the card). A unit whose entering `EXHAUST` is still a few records ahead is drawn exhausted from its arrival frame (`entryExhaust.ts`, display only; the fold is untouched) | `GameCard` |
| `cards[].power`, `hp` | `power`, `hp` from `STATS`/keyframes. A pre-STATS file gets `effectiveStats` (printed + attachments + Grit from card data) and `statsReconstructed: true`, drawn as a `≈` marker with a tooltip | `GameCard` power/HP badges |
| `cards[].keywords` | `keywords` (chips along the card's top edge, verbatim), `sentinel` (the live board's Sentinel icon) | `GameCard` |
| `cards[].upgrades` | one parented arena card per printed upgrade / pilot, named and aspected for the banner | `UnitsBoard` → `GameCard` upgrade bars |
| `cards[].shields`, `experience`, `statusTokens` | one parented `token` card per counter (`Shield`, `Experience`, `Advantage`, `Weakness`, any other name titled from the token) | `GameCard` token badges; an unknown token name renders as a named bar |
| `cards[].captured` | `cardPiles.capturedZone`, one card per captive with `parentCardId` = captor; a `base@N` captor is held nowhere (§21) | `UnitsBoard` → `GameCard` captured strip |
| controller vs owner | `controllerId` = the seat whose list holds the card; `ownerId` from the file's DECKS/header (`ownerSeatMap`), so a `TAKE_CONTROL`ed card shows the stolen icon | `GameCard` status icons |

Live-play cues the board shows around the cards, rebuilt per frame from the file
(`replayLiveCues.ts`): whose action it is (`isActionPhaseActivePlayer`, the trays' turn aura;
the seat each record names, opening each action phase on the initiative holder), the attack in
progress (`isAttacker`/`isDefender` on the attacker, the target unit or the target base, for the
ATTACK and the consequences filed under its seq), and the last card played
(`clientUIProperties.lastPlayedCard`, the opponent tray's preview). Playback holds a player's
action for the full beat and its consequences for a fraction (`frameHoldMs`).

Beyond the board: the panel header shows `formatGameMeta` — the game's duration (`Date` →
`EndDate`) and `game N of match <short>` (`Match`/`GameNumber`, §5.2), each part only when the
file states it. `StoryTab` shows the file's own `%%% STORY` (or a fresh `render()`), and its
click-to-seek follows the story's numbering exactly (`storySeek`: the eight numbered types,
reset per round and per phase). `Replay.context` captions every frame with `replayAction.frameAction`, worded
per the §16 table (mechanism records print nothing) and named with the story's `nm()`
(`storyName`: copy suffix kept, `base@N` → "Player N's base"). `ResourcingReport` shows
`paid` (Σ `EXHAUST_RESOURCES`) beside the printed `cost`. `FileHealth` shows every
`checkKeyframes` mismatch (`seq`/`path`/`expected`/`got`), damaged keyframes, `RecorderErrors`,
the §5.3/§6.2/§10.1/§13/§18 notes (`fileIssues`) and which earlier writer produced the file
(`writerGeneration`, one line per detectable row of §22/§22.1, with what it costs the replay).

## Conformance gate

`__tests__/vectors.test.ts` runs every vector under `__tests__/fixtures/vectors/` (all five,
copied verbatim from forceteki `swupgn/test-vectors/`: `minimal`, `organic`, `upgrades`,
`pilot`, `capture`) through parse → fold → render and requires a byte-identical render and a
byte-identical fold, with no carve-out; every vector must also pass
`checkKeyframes` with no mismatch (spec §20 step 5), and survive serialize → parse with an
identical fold and render. Step 2 (`validate()`) is asserted upstream on the same bytes.
`src/app/_utils/__tests__/vectorsBoard.test.ts` takes each vector one level up, through
`adaptState`, and asserts every §11 field against `.fold.json`, plus a clean `FileHealth`.
`src/app/_utils/__tests__/swupgnCompat.test.ts` has one test per row of the §22 and §22.1
tables. `__tests__/fixtures/sample-game.swupgn` is a pre-1.0 file and pins the compatibility
shims.

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
- **`integrity.ts` keyframe snap** — upstream ends each comparison with
  `s = JSON.parse(JSON.stringify(e.keyframe))`, deep-cloning the RAW keyframe.
  `isCompleteKeyframe` only proves `cards`/`hand`/`discard` are arrays and each card is *some*
  object; it validates no per-card field. So a keyframe card with no `statusTokens` rode into
  `reduce()` and the next `STATUS_TOKEN` threw on `c.statusTokens[token]`, and one with no
  `upgrades` threw on the next arena exit at `c.upgrades.indexOf`. Harmless upstream, where
  `checkKeyframes` runs on the writer's own state; fatal here, where `FileHealth` runs it on an
  uploaded file inside a render-time `useMemo` with no error boundary — one shared file blanked
  the Replay page for everyone who opened it. The client calls `snapToKeyframe` instead, which
  normalizes and caps every list before the clone and makes the gate measure what the viewer
  actually folds. Both regression paths are pinned in `integrity.test.ts`.
- **`fold.ts` keyframe snap** — `snapToKeyframe` merges PER SEAT: a seat with the shape the
  fold dereferences (§13's `isCompleteKeyframe`, applied per seat) is snapped with every
  scalar coerced (`normalizePlayer`/`normalizeCard`) and every list capped at
  `MAX_KEYFRAME_LIST` (200) BEFORE the deep copy, so a hostile keyframe is never cloned whole
  (`resources` is capped with them, and `baseEpicActionUsed`, `leader.onStartingSide` and the
  top-level `active` ride through only when well-typed, absent staying absent);
  a seat that is missing or malformed is ignored and the folded seat kept. Upstream replaces
  wholesale and ignores the whole keyframe. Pre-1.0 files in the wild carry one-seat keyframes,
  and replacing wholesale erased that player's board. Compatibility shim. Also filters a token
  upgrade or an attached card that an early writer listed as its own arena card. `power`/`hp`,
  `keywords`, `deckSize`, `leader` and `initiativeTaken` ride through when well-typed.
  `isCompleteKeyframe`/`hasSnapKeyframe`/`emptyState` are exported for the verbatim
  `integrity.ts` and `render.ts`.
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
  and `%%% CARDS` in the spec's canonical section order, and every optional §5.2 header tag the
  document carries (`EndDate`, `Match`, `GameNumber`, `RecorderErrors`) — dropping one would
  quietly relabel a partial file as complete, or orphan a game from its match.
- **`types.ts` Annotation threading** — `id`/`parent`/`ts` are upstream now (spec §15).
  Nothing client-owned remains in types.ts.

Re-vendoring dropped MAX_EVENTS and the discard guards once already (caught by /review, not
by the test suite — they had no tests). Diff this list against upstream before accepting a
re-vendor, not just the test results.

## Deliberately not ported from `463c3022`

- **`actionLinks.ts` (`linkActionSteps`)** — the writer-side pass that stamps `for` on a file
  whose writer did not. This is a reader: it uses `for` when the file carries it and loses only
  the grouping when it does not. If it is ever ported, the **action-typed precursor sets** must
  come with it exactly — `ATTACK` may be preceded only by `CHOICE`/`MODAL_CHOICE`/`EXHAUST`,
  every other top-level action also by `MOVE`/`STATS`/`EXHAUST_RESOURCES` — because one shared
  set gets an **Ambush** unit wrong: it is played and attacks in the same phase, so the play's
  own `MOVE` and `STATS` sit immediately before the `ATTACK` naming the same card, and the
  attack steals them. Keep the rule that a run is filed only if something in it names the
  action's card; a wrong link is worse than none.

Resolved upstream, do NOT re-apply: the `[Rounds]` NaN fallback; keeping token upgrades out of
the arenas (driven by `kind`); the seat/`__proto__` guard, `arr()` for scalar-where-array
fields and the primitive-keyframe guard (upstream has all three); attach-from-`attachedTo`,
detach-on-exit and `hasForce` (upstream folds them now); the `(cost N)` render wording; the hand/discard
CONTENTS fold (upstream adds AND removes on MOVE and dedupes the summary records now, and
gates both in §14 — the client's version of this is retired, not divergent).

Long-term: replace with a shared npm package (see spec "Long-term note").
