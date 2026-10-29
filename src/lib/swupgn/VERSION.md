# Vendored SWU-PGN reader

Source: forceteki `swupgn/src/`. Re-vendored 2026-10-29 at upstream **`c17ef7499`** (branch
`swu-game-notation`; "docs(swupgn): Appendix E names all ten scenario vectors"), the pre-landing
review hardening of the CR v9.0 coverage pass, on top of the earlier syncs at `6147b3c58` (client
`0d08708`, review fixes to `53d7c3b`), `18cd06297` (client `2f51623`), `a2c013963`, `950a65a82`
(client `2222127`) and `c233908d6`. Synced from that
commit, not from a working tree. The spec is `docs/SWU-PGN-1.0-SPEC.md` at that commit, and it is
**normative** (§2): the reference code, schemas and vectors are informative, and where they
disagree the text governs. The conformance suite (`swupgn/test-vectors/`: 13 positive vectors, 33
in `negative/`, `manifest.json` listing 46) is copied verbatim into `__tests__/fixtures/vectors/`.
The format is still 1.0; the forceteki writer is now `WriterRevision` 6, and the eleven real-game
vectors were regenerated from a clean commit (`forceteki@f74700d3f`).

`types.ts` is **verbatim**. `render.ts` and `integrity.ts` are verbatim apart from one line each,
the keyframe they read — see the divergence list. `fold.ts`, `parse.ts` and `cardNames.ts` are
upstream plus the client-owned blocks listed below. `actionLinks.ts` is a SUBSET: only
`isTopLevelActionRecord`, which `render.ts` imports (see "Deliberately not ported"). The replay UI
numbers with `swupgnMoves.isNumberedAction`, the same rule plus the kind-less fallback of
`isPlayerAction` for files written before `kind`; `homeworldsReplay.test.ts` holds the two to
the story's numbering on every vector. `ids.ts` is **verbatim** (it holds literal combining marks
in a regex, as upstream does). `validate.ts` stays omitted (Node-only: fs/path + ajv). `tokens.ts`,
`serialize.ts`, `displayText.ts` and `foldFrames` are client-only.

## What `6147b3c58..c17ef7499` changed (all handled here)

Three `/ship` review rounds against hostile input and two rules corrections (spec §22, the eight
bullets from "`nm(id)` cuts the name" to "`GAME_END.winner` is"). The format stays 1.0 and the
writer stays `WriterRevision` 6: no record or field was added, and `types.ts`, `ids.ts`,
`parse.ts` and the vectors did not change (`git diff --stat 6147b3c58 c17ef7499 --
swupgn/test-vectors` is empty, and `diff -r` of the vectors against the client's copy is clean).
Reader files: `fold.ts`, `integrity.ts`, `render.ts`, `cardNames.ts` (plus `actionLinks.ts`,
`validate.ts` and `event.schema.json`, which the client does not carry).

1. **`isRecord` ([F-04]).** Upstream's `reduce()`, `hasSnapKeyframe()` and `stateAt()` now skip
   an events line that is null, a scalar or an array. Taken as is, and used in the client's own
   `foldRange` and `stateAt` loops too. The client's "non-object event skip" divergence is
   **retired**: it tested `e == null || typeof e !== 'object'`, which let an array through, so
   upstream's is the wider of the two and covers every case the client's did. `parse.ts`'s
   client-owned record-shape guard (`not-object`) still refuses all four shapes before the fold
   sees them, so the fold's skip is defence in depth for a caller that builds events itself.
2. **The seat-wide attachment cap ([F-05], §12).** `attachmentsHeld()` and
   `seatHoldsMaxAttachments()` taken as is: `attachTo` and `CAPTURE` add nothing once the seat
   holds 1000 upgrades and captives between them, and `TAKE_CONTROL` does not move a unit whose
   attachments would take its new seat past 1000 (exactly 1000 moves). The keyframe half goes in
   the client's `isCompleteSeat`, not upstream's `isCompleteKeyframe` (see "keyframe list
   ceiling"), so a client snap, `stateAt`'s restart and `checkKeyframes` refuse the keyframes
   upstream refuses. It counts the RAW keyframe, before `snapToKeyframe` caps each card's lists
   at 200, as upstream counts it. `attachmentsHeld` reads `upgrades` through `arr()` (upstream
   reads `c.upgrades.length`) because `isCompleteSeat` calls it on a card nothing has normalized.
   One client test changed: "caps every keyframe list" had 900 cards × 900 upgrades on one
   seat, which is now a damaged keyframe; it keeps the 900 upgrades on one card.
3. **A keyframe seat's `leader`** must be absent, `null` or an object with a string `id`, or the
   keyframe is damaged. In `isCompleteSeat`.
4. **`PLAY_EVENT`** files its card only when no seat's discard holds it (§12.2); `endEffect`'s
   partial end builds a `Set`. Both taken as is.
5. **`integrity.ts`** taken verbatim (skips a non-record line, imports `isRecord`), with the
   client's one line (`snapToKeyframe`) re-applied.
6. **`cardNames.ts`**: `flatten` and the flattening `shorten` taken as is (the regex carries an
   `eslint-disable-next-line no-control-regex` the client's lint needs). `indexResolver` is
   unchanged. Its order is still newline runs to one space, `displayText`, then `shorten`, and it
   still DROPS bidi marks where upstream's `shorten` spaces them. Because `indexResolver` now calls
   the flattening `shorten`, a tab in a name (which `displayText` keeps) is a space; nothing else
   in a client name changes. `render.test.ts` checks that `shorten` on an `indexResolver` name is
   the identity, for ten hostile names (line breaks, U+2028/9, U+202E, NUL, NEL, ALM, tab, a
   5,000-character name, a bidi mark at the cut point).
7. **`render.ts`** taken verbatim (every name and ` #N` cut, unlisted ids too; non-record lines
   skipped; the 16,777,216-character stop; every output line through `flatten`), with the client's
   one line (the keyframe through `snapToKeyframe`) re-applied. The client's other paths that
   show a record as a line:
   - `replayAction.frameAction`, which is the caption, the move list (`buildMoveList`) and the
     WebM clip's caption, now runs `flatten(displayText(label))`. `displayText` keeps tab and line
     feed for notes; a caption is one line.
   - `replayAction.storyName`, the caption's `nm()`, cuts the name and the ` #N` as `render()`
     does, so an unlisted id or a crafted copy number is cut there too.
   - `replayDecisions.bookmarkLabel` (Decisions and Digest tabs) flattens the same way.
   - `StoryTab` shows `doc.story` or `render(doc).split('\n')`, each line through `displayText`.
     A STORY line read from a file cannot hold a line feed, since `parse()` splits on it, and
     `displayText` turns CR, U+2028 and U+2029 into spaces.
   - `effectWords.ts` already cut its texts with `shorten`, which now flattens. It still words
     each caption as `render()` does (`writerRevision6.test.ts`).
   - `serialize.ts` writes `doc.story` or a fresh `render()`. A fresh one is now flat; the
     client's `%%%` guard and its split on line breaks stay for a file's own STORY.
8. **`actionLinks.ts`**: `linkActionSteps` skips non-record lines. Not ported (see "Deliberately
   not ported"); `isTopLevelActionRecord` did not change.
9. **`GAME_END.winner` is 1, 2 or `"Draw"`** (`event.schema.json`; another value is a `schema`
   error, and §22 says an outcome a newer minor adds is a warning). `render.ts` is unchanged: it
   prints `${who(winner)} wins` for anything but `"Draw"`, and `who()` gives `''` for a non-seat,
   so a winner of 7 reads `***  wins — … ***`. The viewer itself says nothing false: File Health
   reports "N GAME_END naming a winner that is not Player 1, Player 2 or a draw: the replay names no
   winner for it (§10.2)", the caption reads `Game ends — <reason>`, `resultMismatch` still skips
   an unknown outcome, and the Replay page's result comes from the header's `Result`, not from
   `GAME_END`.
10. **A token changing arenas with its unit stays in play ([W-47], [V-07]).** File Health's
    `tokenNotOutside` rule now matches `validate.ts`'s `changesArena` exactly: an arena-to-arena
    MOVE is exempt unless the id is a well-formed Credit or the Force token (`TOKEN_ID` and
    `tokenNameOf`, upstream's test, not the client's looser `isCreditToken`). `tokens.ts` needs no
    change: `normalizeTokenEvents` rewrites only a MOVE to `outsideTheGame`, and `dropInertRecords`
    only a same-zone MOVE with no new host, so a token that only changed arenas is kept and the
    fold leaves it on the board (a token unit lands in `space`; a shield keeps its count on a host
    that changed arenas).
11. **An event played out of the other seat's deck** shows in its owner's discard only: in the
    fold, in `adaptState`'s discard pile (and so the pile's count), and the story still says the
    player played it. Hand-made fixture `__tests__/fixtures/c17ef7499-cross-seat-event.swupgn`.
12. **The attachment cap** has nothing to show. `fold.test.ts` folds a file of 3,000 attachments on
    one seat (and a loaded unit stolen back and forth) through `foldFrames` and checks the cap
    holds in every frame.
13. **Hostile text.** Hand-made fixture `__tests__/fixtures/c17ef7499-hostile-text.swupgn`:
    `\n`, `\r`, U+2028 and U+202E in CARDS names and a back side, a card id, effect text,
    `untilText`, an EFFECT_END reason, a NAME, a zone and the GAME_END reason (winner 7), and a
    5,000-character name. Every story line, caption, move-list label and bookmark is one line;
    the exported STORY has one line per record, equals `render()`, and the export round-trips
    through `serialize` → `parse` → `serialize` as a fixed point. A caption has one space fewer
    than the story line beside a bidi control: `displayText` drops it, `flatten` spaces it.
14. **Vectors.** Unchanged upstream and byte-identical here. Fold and render equality still hold
    on all 13 positive vectors with no `.fold.json` or `.render.txt` touched, and every
    well-formed negative still folds without touching `Object.prototype` (`manifest.test.ts`).

Tests: `fold.test.ts` and `render.test.ts` port every new `fold.spec`/`render.spec` case
(`stateAt`, `checkKeyframes` and `render` on non-record lines; the leader shape; the five cap
cases; one line for effect text, `untilText` and a name; unlisted ids and copy numbers cut;
control and bidi characters; long leader sides; the 16 MiB stop). Upstream's non-record case
parses a file with `null` lines, which the client's `parse()` refuses, so the client splices the
lines in after parsing. `src/app/_utils/__tests__/swupgnC17ef7499.test.ts` holds items 9 to 13,
using `validate.spec`'s token-zone and GAME_END cases as the File Health cases.

## What `18cd06297..6147b3c58` changed (all handled here)

The CR v9.0 coverage pass (spec §22 "CR v9.0 coverage pass (2026-10-28)"): every piece of game
state CR 1.16.1 lists is now a record the board carries, required of writers from revision 6.
Reader files: `types.ts`, `ids.ts`, `cardNames.ts`, `fold.ts`, `integrity.ts`, `render.ts`
(`parse.ts` and `actionLinks.ts` did not change). Ported by a three-way merge of upstream's diff
onto the client's copy; the conflicts were the client-owned blocks below.

1. **`types.ts`: verbatim.** `EffectDuration`, `EffectSeat`, `EffectEndReason`, `LimitPer`,
   `ActiveEffect`, `AbilityUse`; records `LOOK`, `NAME`, `ABILITY_RESET`, `EFFECT_START`,
   `EFFECT_END`; `simul` on any record, `CHOICE.blind`, `ABILITY_ACTIVATE.limit`/`usedBy`,
   `STATS.traits`/`blank`/`leaderUnit`/`copyOf`/`name`/`cost`/`aspects`, `TAKE_CONTROL.owner`,
   `SEARCH.owner`/`seen`, `MOVE.exhausted` into `resource`; on the board a card's
   `owner`/`upgradeControllers`/attributes and a seat's `abilityUses`/`foreignResources`, and the
   state's `effects`.
2. **`ids.ts`: verbatim** (`EFFECT_ID`, `fx@N`), in the barrel.
3. **`cardNames.ts`:** `shorten` is exported (render.ts imports it; the barrel exports it too).
   The client-owned `indexResolver` and its flatten → `displayText` → cut order are unchanged.
4. **`fold.ts`: upstream plus the client-owned blocks.** Every new rule of §12.2 is upstream's
   code verbatim: ROUND_START sets `initiative` from `active` and clears `phase`/`round` uses,
   PHASE_START clears `phase` uses; a MOVE into `resource` with `exhausted: true` counts as
   exhausted; a leader moving `base` → arena is deployed without a DEPLOY_LEADER; a token CAPTURE
   holds nothing; EFFECT_START/EFFECT_END build `effects`; a limited ABILITY_ACTIVATE counts into
   `abilityUses` (latest `max` kept), ABILITY_RESET removes entries; STATS replaces the attribute
   set; TAKE_CONTROL of an attached upgrade writes the host's `upgradeControllers`, a unit under
   the seat that does not own it gets `owner`, a resource steal keeps `foreignResources`; a card
   arriving from the other seat's pile is recorded with its `owner`. The client blocks that had
   to absorb the new fields:
   - `isCompleteSeat` (the client's per-seat §13 check) now refuses a seat whose
     `foreignResources` is present but not a capped list, whose `abilityUses` is not a capped list
     of complete uses, or one of whose cards has an `upgradeControllers` that is not a map:
     upstream's rule exactly, since later records rewrite all three. (Older optional lists are
     still read as absent when not an array; see the divergence list.)
   - `snapToKeyframe` carries the new state: each card's `owner` (a seat only), `upgradeControllers`
     (own, non-reserved keys whose value is a seat, `seatMap`), `traits`/`aspects` (capped string
     lists), `blank`/`leaderUnit` (true only), `copyOf`/`name` (strings), `cost` (finite); each
     seat's `foreignResources` and `abilityUses`; and the keyframe's `effects`, which REPLACE the
     folded list as upstream's snap does. Each stays absent when the keyframe does not carry it.
     A damaged `effects` (upstream would refuse the whole keyframe) keeps the folded effects, as a
     damaged seat keeps the folded seat (`isCompleteEffectList`, upstream's check split out).
   - `isCompleteKeyframe` calls `isCompleteSeat` for the per-seat checks; upstream's
     `isCompleteKeyframeCard` is still not ported (the snap normalizes cards instead).
   - `foldFrames` still produces one frame per record, each with the new fields (asserted in
     `writerRevision6.test.ts`).
   - The discard block (placed after the base-token counts in the client) sets `ownerSeat` as
     upstream's does.
5. **`integrity.ts`:** verbatim apart from the client's one `snapToKeyframe` line. The gate now
   compares `effects`, `abilityUses`, `foreignResources` and each card's owner, upgrade
   controllers, traits (as a multiset), `blank`, `leaderUnit` and copy fields, and clears
   `phase`/`round` uses before comparing a ROUND_START keyframe (`clearAbilityUses`).
6. **`render.ts`:** verbatim apart from the client's one keyframe line. New lines for
   EFFECT_START (who, source, `plainText(text)` cut like a name, targets or the seat, duration
   words), EFFECT_END (source looked up by id, partial targets, reason words), LOOK, NAME (cut like
   a card name) and " (used by …)"; a copy is named by its copied name; ABILITY_RESET prints
   nothing; `limit`, `blind`, `simul`, `SEARCH.owner`/`seen` change no line. `plainText` is in the
   barrel. §23: the story and every caption reach the DOM as React text (no
   `dangerouslySetInnerHTML` anywhere in the replay UI), and `text`'s icon markup is turned into
   plain words by `plainText` before it is shown, never rendered as HTML.
7. **`actionLinks.ts`: nothing to port.** `TOP_LEVEL_ACTIONS` and `isTopLevelActionRecord` are
   byte-identical at `18cd06297` and `6147b3c58`, and the file itself did not change.
8. **Lettered ability-made actions (§9.1).** An Ambush attack, an event's "attack with a unit",
   an ability that plays a unit is a lettered sub-step now (`control` R7.A.1c). Nothing in the
   client needed to change: `isNumberedAction` already refuses a lettered seq, so `storySeek`
   and the captions number like the story, and `buildBeats` keeps a lettered action in the beat
   of the action that caused it, which is what the scrubber steps by. The Moves tab is a seek
   list, not a numbered one: it still offers the Ambush ATTACK as a row (as it offers a DEFEAT),
   and seeking it lands on the end of the PLAY's beat. `homeworldsReplay.test.ts` holds numbered
   captions to the story on all 13 vectors; `writerRevision6.test.ts` pins R7.A.1c. One
   consequence fixed: a copy (Clone) is named by its copied name in the story, so
   `swupgnCardNames.sidedResolver` now names a unit with `copyOf`/`name` on its folded entry by
   that name (made safe and cut like an index name), and the board draws its copied art.
9. **`simul` groups are one instant (§10.2).** New `src/app/_utils/simulGroups.ts`: each group's
   span is its first member to its last (keyed by the `simul` value; overlapping spans merged).
   `Replay.context`'s `setCurrentIndex` settles every seek (slider, deep link, story line, move
   row, annotation, autoplay) on the end of the group it lands in; the per-record step goes over
   a group whole either way. Beat steps already end at a beat's end, which is never inside a group
   on any vector. Render needs nothing: it prints the members in file order.
10. **Initiative.** The board's initiative token (`hasInitiative`), the clip exporter and the
    trays' action-phase opening all read the folded `initiative`, which the fold now takes from
    `ROUND_START.active`. Nothing derives it from anything else.
11. **New board state** (UI coverage table below):
    - `effects`: a compact "Active effects" list under File Health (`ActiveEffects.tsx`), one line
      per effect in the story's words (source, what it applies to, how long), and a `✦` mark with
      a tooltip on each unit an effect targets (`effectNotes`). `effectWords.ts` mirrors
      render.ts's private `durationWords`/`endWords` word for word (test-held to `render()`); an
      active effect's `until` reads "until a condition is met", since the board keeps no
      `untilText`. A base targeted by an effect is listed, not marked.
    - `abilityUses`: a spent limited ability (`count` ≥ `max`) is listed in the same box
      ("ability used 1 of 1 for this round"). Unspent counts are not shown.
    - A copy: `clonedCardId`/`clonedCardName`, which the live `GameCard` already draws. A blank
      unit: `isBlanked`, GameCard's blank icon. `owner`: the unit's `ownerId`, so a stolen unit on
      its controller's side shows the stolen icon. An upgrade in its host's `upgradeControllers`
      stays drawn on its host (it is attached there) with `controllerId` = the controlling seat,
      so GameCard marks it too. `foreignResources`: nothing beyond the resource counts.
    - Not surfaced: `traits`, `leaderUnit`, a copy's `cost`/`aspects`, and SEARCH/LOOK/NAME
      (story and captions only).
12. **Notes the fold ignores** (LOOK, NAME, CHOICE.blind, SEARCH.seen/owner,
    ABILITY_ACTIVATE.usedBy) are in the story and the captions; nothing is hidden (§21 item 1).
13. **File Health.** Four counted warnings, one per new validator error, in the existing style:
    `round-start-active` ("ROUND_START without an active seat"), `token-zone`, `fortify-host` and
    `effect-end-unknown`. Fold, render and adapt survive all four negatives. A missing `active` is
    reported whatever the revision (Appendix C: forceteki revisions 1–5 wrote it), except on a
    pre-release file. KNOWN_EVENT_TYPES has the five new types, so a revision-6 file reports no
    unknown types. Also fixed: `writerGeneration` counted an upgrade moved onto another host in
    the same arena (`ground` → `ground` with `attachedTo`, allowed by §10.1) as an "early writer"
    exit MOVE.
14. **Older files.** `effects`, `abilityUses` and `foreignResources` stay absent for a file from
    revisions 1–5 (upstream's fold, and the client's snap keeps absent absent), and the viewer
    shows no effects box at all for one: `activeEffectRows`/`spentAbilityRows` return `null`, not
    `[]`. Pinned on upstream's `minimal-rev4.swupgn` fixture (copied into `__tests__/fixtures/`).
    `swupgnCompat` and `writerRevision5` stay green.
15. **Vectors.** Whole `test-vectors/` re-copied from git at `6147b3c58`: positives 13 (new
    `effects`, `visibility`, `control`), negatives 33 (new `effect-end-unknown`,
    `fortify-enemy-base`, `round-start-no-active`, `token-to-hand`; the others gained `active` on
    their ROUND_START). `minimal` is revision 6; `other-writer` DID change (its ROUND_START got
    `active`, its keyframes `foreignResources`/`abilityUses`/`effects`, its STATS `traits`, its
    regroup resource MOVEs `exhausted`). Fold and render equality hold for all 13 with no client
    change to derived files. `vectorsBoard.test.ts` asserts no `-dirty` Engine and no File Health
    line at all again.
16. **Export.** `serialize()` now writes the header in the file's own tag order (`ParseNotes.tagOrder`,
    a client-owned addition), so each real-game vector's header round-trips byte for byte
    (`writerRevision5.test.ts`); before, `HEADER_ORDER` put `EndDate` after `Date`. Every new
    record type and field rides through export unchanged and in order (`vectors.test.ts`
    round trip on all 13).

Tests: `__tests__/crCoverage.test.ts` ports upstream's new `fold`, `integrity`, `render` and
`parse` cases for this range verbatim (40 cases); `types.spec.ts`'s additions hold types to the
JSON schema the client does not copy, and `validate`/`actionLinks`/`writerLinks` specs cover code
the client does not ship. `src/app/_utils/__tests__/writerRevision6.test.ts` covers items 8–11,
13 and 14.

## What `a2c013963..18cd06297` changed (all handled here)

Reader commits `bfe77b72d` (integrity), `d6f016d03` (cardNames), `b379f99e5` (parse),
`6eccaecef` (validate), `3ecab132c` and `7d9a04b65` (actionLinks); writer commits `861983026`,
`d7e5e8d1e`, `b8d7d0a49`, `7d1a45dae`, `ccae9cc57`, `c89abd86a`, `4d110a699` and others that
reach a reader only through the vectors; spec commits `70d038e27`, `18cd06297`.

- **`actionLinks.ts`: nothing to port.** `3ecab132c` (a play's setup is linked from the
  writer's `markPlaySetup` mark, not from position) and `7d9a04b65` (walking back past the
  card's own MOVE ends the host's share of the run, marked or not) change only `linkActionSteps`,
  which the client does not port. `TOP_LEVEL_ACTIONS` and `isTopLevelActionRecord` are
  byte-identical at `a2c013963` and `18cd06297`; upstream also dropped its `isArena` import,
  which the subset never had.
- **`fold.ts`, `render.ts`, `ids.ts`, `types.ts`: unchanged** in this range (`git diff --stat`
  is empty for all four).
- **`cardNames.ts`: the §16 `nm()` cut.** A `name` or `backSideName` longer than 120 UTF-16 code
  units is cut to its first 119 and `…` (U+2026), so a hostile `%%% CARDS` index cannot make every
  story line grow without bound (no printed card's name is over 49). The client's
  `indexResolver` stays CLIENT-OWNED (see the divergence list) and applies the cut LAST: newlines
  flattened → `displayText` (bidi dropped, controls to a space) → cut. Flattening and bidi removal
  can only shorten a name, so cutting after them is what keeps every name the client SHOWS within
  120; upstream cuts the raw name, which is also what it shows. Upstream's "skip an entry whose
  `id` or `name` is not a string" filter is NOT ported over the client's own handling (already a
  listed divergence). Slicing is by code unit, as the spec says, so a cut at 119 can split a
  surrogate pair (see the report). Every place the client shows an index name goes through it:
  `Replay.context`'s `nameOf` is `indexResolver(doc.cards)` when the file has an index, and
  DeckTab, the deck tracker's rows, the board adapter's card names and tooltips, captions and
  `render()` all take that `nameOf`. `serialize()` writes the raw records (an export keeps the
  file's bytes) and nothing shows the file's own STORY prose.
- **`parse.ts`: the size cap counts UTF-8 bytes** (`b379f99e5`), verbatim: `utf8Length()` (a
  surrogate pair is 4 bytes, a lone surrogate 3), and only when `text.length` does not already
  exceed `maxBytes` (each UTF-16 unit is at least one byte). Message `file is over the
  <n>-byte limit`, code still `too-large`. The per-line cap (`maxLineLength`) is still in UTF-16
  code units. The client's earlier byte checks on an upload (`unzipReplay`'s inflated-size cap)
  stay; `parse()` does its own.
- **`result-mismatch` (validator only, `6eccaecef`).** The client has no validator and no table
  of validator codes, so parse accepts the file and the fold reads it. File Health
  (`swupgnFileIssues.resultMismatch`) adds a warning by the validator's rule (the last `GAME_END`
  counts, `1`→`P1`, `2`→`P2`, `"Draw"`→`Draw`, none → `Incomplete`; a `Result` 1.0 does not know
  is skipped): "The Result in the header doesn't match how the game ended (§10.2)." The replay
  header keeps showing the file's `Result` (via `resultOf`), and the `GAME_END` banner shows
  what the events say; the client picks neither over the other.
- **`integrity.ts`: `diffCard` loops** over the plain fields and the set fields (`bfe77b72d`).
  Same behaviour; ported, keeping the client's one `snapToKeyframe` line.
- **Writer revision 5** (Appendix C), checked from the reader's side in
  `src/app/_utils/__tests__/writerRevision5.test.ts`:
  - *An additional phase continues its phase's numbering* (§9.1). Nothing in the client reads a
    `.start`/`.end` suffix: `storySeek` resets on the PHASE_START record, `chapterMarks` ticks per
    PHASE_START, `entryExhaust` and `replayLiveCues` break on the record type. A synthetic round
    with two regroups (`R1.G.start…R1.G.end`, `R1.G.5…R1.G.9`) folds, shows two Regroup ticks, and
    a story line in the second regroup seeks to its record. An older file that repeats
    `R1.G.start` behaves as before: every seq lookup (deep link, `seekToSeq`, `beatAnchorSeqs`, an
    annotation's `ref`) takes the first occurrence, so a link to the second phase's edge lands on
    the first's.
  - *`[W-43]`* (§12.1): `MOVE deck→ground p:1` then `TAKE_CONTROL` to 2 takes the card from seat
    1's deck count, puts it in seat 2's `cards` and on Player 2's side of the board owned by
    Player 1, and the beat classifies as a `steal`.
  - *A resource given back* is a `TAKE_CONTROL` between resource rows: one resource each way,
    not numbered, not a `play` or `resource` transition, not counted by the resourcing report.
  - *`P1Id`/`P2Id` hash the account id.* Nothing in the client parses, shows or keys on them
    (replay storage ids hash names, date, result, leaders and the whole content).
  - `swupgnWriter.groupsByAdjacency` still means forceteki revisions 1–3; its comment already
    says "revision 4 on", which covers 5.
- **Vectors.** The eight real-game `.swupgn` files are regenerated (WriterRevision 5, new
  Date/EndDate, P1Id/P2Id, `ms`, Engine, and the random R0.S.1 opening choice); their `.fold.json`
  and `.render.txt` did not change, and fold and render equality still hold. `minimal` and
  `other-writer` did not change. New hand-written well-formed negative `result-mismatch`
  (`[Result "P1"]`, no `GAME_END`): the negatives go from 28 to 29.
- **The `-dirty` Engine.** All eight regenerated vectors say `[Engine "forceteki@c89abd86a-dirty"]`:
  they were written from a working tree, not a clean commit, so File Health shows its §5.3
  "Uncommitted build" warning on each. `vectorsBoard.test.ts` now asserts exactly that (and fails
  on purpose if upstream regenerates from a clean commit, to put the clean check back);
  `swupgnConformance.test.ts` strips the suffix from its base vector so no other test depends on
  it.
- **Export.** `serialize()` copies the header it read and invents nothing. Each header line of a
  regenerated vector comes out byte for byte, but in `HEADER_ORDER`, which puts `EndDate` after
  `Date`; forceteki writes it last (it did at `a2c013963` too). §4 fixes no tag order past `Game`
  first, so the export is valid, but not byte-identical in its header.

## What `950a65a82..a2c013963` changed (all handled here)

Reader commits `8d6e18054`, `e0c8f0378`, `1919aed8b`, `b0392fb92`, `5ef04df29`, `87d477f39`,
`06b55de32`; vector commits `318cecbbb`, `334ea3e19`, `ce0de7400`, `a2c013963`; the rest are spec
text (§22 "Platform neutrality", §25 registries, Appendix C).

- **`ids.ts`** (new, verbatim): `TOKEN_NAME`, `TOKEN_ID`, `tokenName(title)` and `tokenNameOf(id)`,
  in the barrel. `tokenNameOf` is the §6.1 name part: `TOKEN:credit`, `TOKEN:credit:2` and
  `TOKEN:credit#8015500527:2` name `credit`; `TOKEN:credit:1` does not (`:1` is not a copy
  suffix). The client uses them for the Credit/Force test only, never to refuse a file:
  `bad-token-name` is a validator error. The client's own id reader, `tokens.ts` `tokenName(id)`,
  is renamed **`looseTokenName`** so the barrel's `tokenName` is upstream's (title -> name).
- **Credit and Force** (`87d477f39`): upstream's fold matches `tokenNameOf(id) === 'credit'` /
  `'the-force'`. The client's `tokens.ts` `isCreditToken`/`isForceToken` now do the same for a
  current id, and keep reading the pre-2026-09 title spellings (see divergences).
- **`engineProduct(engine)` and `PILOT_WRITER_PRODUCTS`** (`{ 'forceteki' }`, closed, exact,
  case included; §25 "Pilot writer products") are in `parse.ts` and the barrel. Nothing else in
  `parse.ts` changed.
- **Pre-release** is now a file with no `WriterRevision` AND a pilot-writer `Engine` product
  ([V-04]); `WriterRevision` is optional and diagnostic for every writer ([W-12]).
  `src/app/_utils/swupgnWriter.ts` `isPreRelease` holds the rule. File Health's notice ("Pre-release
  file from a pilot writer") and `writerGeneration`'s `pilot` gate use it, so a file from any other
  writer without the tag is an ordinary file.
- **Grouping (§9.1 [W-18], Appendix C "Grouping records in a file without `for`")**: a record
  without `for` belongs to the action its `seq` carries, and a reader MUST NOT infer ownership
  from position in a file that stamps `for`. `replayBeats.buildBeats` had one position rule (a
  record naming the same card as the action right after it is that action's precursor); it now
  runs only when `swupgnWriter.groupsByAdjacency(header)` is true — a pre-release file or
  forceteki revisions 1–3 — never for revision 4 or another writer. Both callers (the Replay
  context, the clip exporter) pass it. Everything else groups by `for`, then by the seq's own
  number or letter suffix. `entryExhaust` looks ahead for a unit's entering `EXHAUST`, which is
  drawing, not ownership, and is unchanged. Known gap: Appendix C's SHOULD that a revision 1–3
  `for` the new rule would not have stamped (a previous action's choice filed under the next
  action) be read as the seq's own number is not implemented; it needs `linkActionSteps`' new
  walk-back rules to tell which stamps those are.
- **`actionLinks.ts`**: upstream changed only `linkActionSteps` (`actionHost`, `seatOf`, the new
  walk-back rules). `TOP_LEVEL_ACTIONS` and `isTopLevelActionRecord` are unchanged and identical
  to the client's copy, so nothing is ported.
- **New codes** `bad-token-name`, `deck-build-move`, `credit-zone` are validator errors on
  well-formed files. The client has no validator and shows no validator report, so parse gains no
  check and File Health no message; `replayErrorMessage` already falls back by code for any code
  it does not know. The three new negatives parse, fold, render, gate and adapt without touching
  a prototype (`manifest.test.ts`).
- **Vectors**: the nine forceteki vectors carry `WriterRevision` 4, a clean
  `forceteki@0064257c0` Engine (no more `-dirty`; `vectorsBoard.test.ts` now asserts no File
  Health notice at all) and the revision-4 `for` stamps. New positive `other-writer` (Engine
  `examplewriter@1.0.0`, no `WriterRevision`) folds and renders as `minimal` does and reads with
  no notice. `manifest.json` rows carry `writer` (the Engine product, or `"hand"`).
- **`types.ts`** did not change in this range.

## What `0bbe90409`, `34df8b3c1`, `9e50bbec8` and `950a65a82` changed (all handled here)

Parser (`parse.ts`, spec §4, §5, §18, §23, §24):

- **`RESERVED_KEYS`** (exported): the 13 names of `Object.prototype` plus `prototype`. `parse`
  throws `reserved-key` for one as an object key anywhere in a record line, as a header tag name,
  or as a `STATUS_TOKEN` `token` in `%%% SETUP`, `%%% EVENTS` or an `ANNOTATIONS` record's what-if
  `line` (§15) — the one value the fold turns into a key. Any other value may be one.
- **`scanJson`** replaces `jsonDepth`: one pre-scan per line that stops at the depth limit and
  finds the first repeated key in an object (`duplicate-key`, I-JSON) and the first reserved key.
  Order: `too-deep`, `bad-json`, `duplicate-key`, `reserved-key`.
- **First line** must match `^\[Game[ \t]+"SWU-PGN\/(\d+)\.(\d+)"\]$` exactly (the tag
  alone, numeric version), else `not-swupgn`. A major other than `READER_MAJOR` (exported, 1),
  compared as written so `01` is refused, is `unsupported-major`. This replaces the client's
  `SUPPORTED_GAME_TAG` gate (`unsupported-version`), which is retired: upstream's check is the
  same set or stricter (it also refuses `[Game …] [GameId …]` on one line), and §24 now has a code.
- **Optional counts are fatal** — `RecorderErrors`, `Undos`, `WriterRevision`, `GameNumber`
  present but not base-10 digits in the safe-integer range are `bad-count`. They used to be dropped,
  so `[RecorderErrors "x"]` read as "no errors". This retires the client's `unreadableTags`
  (`ParseNotes`), its File Health warning and its re-export in `serialize`: nothing can set it.

Reader:

- **`fold.ts`** ignores a `STATUS_TOKEN` whose token is in `RESERVED_KEYS` (fold is public, so
  events built without `parse` get the guard too).
- **`integrity.ts`** compares `statusTokens` with `sameTokens`: key order does not matter, a
  zero entry still does (`{"advantage":0}` is not `{}`).
- **`render.ts`** tracks a leader's shown side per copy, by its full id (`TWI#017:2`), so a
  mirror match names each leader by its own side; every `NameResolver` call passes `baseId(id)`.
  The client's `sidedResolver` already keyed sides by exact id; it now also asks its resolver by
  base id, as render does.
- **`types.ts`** — `Header.result` widens to `'P1' | 'P2' | 'Draw' | 'Incomplete' | (string & …)`:
  a newer minor may add an outcome, and the parser keeps the raw value. The viewer reads it only
  through `replayMoves.resultOf`/`formatResult`, which show anything else (`Abandoned`, `P3`, a
  lowercase `p1`) as `Incomplete`. Doc-comment section numbers changed (§24, §2.1).
- **Schema** — `reduced-state.schema.json` reserves `toString`/`valueOf` as `statusTokens` names.
  Not copied: the client runs no schema check.

Client work in this sync:

- `replayErrorMessage` has its own words for `unsupported-major` (a newer, incompatible format
  version), `duplicate-key`, `reserved-key` and the widened `bad-count`.
- `toAnnotation` writes only the fields the client authors (never a stored record wholesale, so no
  what-if `line` and no stray or reserved key), with `text` and `by` in Unicode NFC (§15).
- With every reserved name refused at parse, `raw` is upstream's `{}` again (the client's
  prototype-less header map is retired). Guards on values used as lookup keys stay: card ids
  (`staticJson`'s null-prototype map), `DEFEAT` reasons (`Object.hasOwn`), keyframe maps and the
  fold's own `statusTokens` writes — parse does not refuse a reserved name as a value there.

## What `c233908d6` and `56b0349c7` changed (all handled here)

Reader (`56b0349c7`, fold/integrity/render):

- **`holder()`** — a card leaving `hand`, `discard` or `resource` comes off whichever seat's list
  holds it, not necessarily `p`'s: Stolen AT-Hauler is played by the opponent out of its owner's
  discard. New vector `stolen-hauler`.
- **`DEPLOY_LEADER` / `LEADER_FLIP` with no `card`** are dropped; `leaderOwner` no longer matches
  `undefined` against a seat with no leader yet.
- **`MAX_ZONE_LIST` (1000) is exported** and now also caps a host's `upgrades`, a captor's
  `captured` and a `TAKE_CONTROL` re-seat.
- **`snapTo` is exported** and fills a missing `captured` with `[]`; upstream `integrity.ts` snaps
  with it and `isCompleteKeyframeCard` rejects a non-array or over-cap `captured`. The client
  keeps its own `snapToKeyframe` for both (see divergences): `normalizeCard` already makes
  `captured` a capped list, so the client gets the same guarantee by a different road.
- **`render.ts` joins a line's card list with ` · `** (U+00B7, spaces either side), not `, `: a
  card name has its own comma. Taken verbatim; a STORY `serialize` renders for a document with
  none uses it.

Parser (`c233908d6`, `parse.ts`, spec §4, Appendix B, §23, §24):

- **`SwuPgnError { code, line }`**: every rejection carries a §24 code. The UI branches on it
  (`swupgnFileIssues.replayErrorMessage`), never on the message, which is free text.
- **Limits** — `parse(text, limits?)`, `DEFAULT_LIMITS` 16 MiB / 1 MiB per line / 1,000,000
  records / depth 64. Over one is `too-large`, `line-too-long`, `too-many-records`, `too-deep`:
  rejected, never truncated.
- **Magic number** — a leading BOM is stripped; the first non-blank line must be
  `[Game "SWU-PGN/…"]`, else `not-swupgn` (an empty file too). A file missing `[Game]` used to
  say `missing-tag`; it now says `not-swupgn`.
- **Header grammar** — only `[Tag "value"]` pairs on a header line (`bad-header-line`); only
  `\"` and `\\` escapes (`bad-escape`); a repeated tag is `duplicate-tag` (it was last-wins);
  `missing-tag`, `record-outside-section`, `bad-json`.
- **`Rounds`** must be base-10 digits (`bad-count`): `"seven"` used to read as 0. Every count is
  `^\d+$` now, with no surrounding whitespace (`" 2 "` used to read as 2).
- **Sections** — a repeated banner is `duplicate-section` (case-insensitive). An unknown section is
  skipped unread (the client did this already; upstream does now too).

Format (writer revision 3, spec §8, §5.1):

- **`INIT` is `R0.S.0`** ([W-35]); revisions 1–2 and pilot files wrote `R1.S.0`. Setup has always
  been round 0. The client reads INIT only in `deckTracker.initRecord`, by `t`, and no seq reader
  (`turnDigests.roundOfSeq`, `replayMoves`, `storySeek`) walks `%%% SETUP`, so both positions read
  the same; `swupgnConformance.test.ts` pins it.
- **`GameId` is `sha256:<64 hex>`**. Nothing in the client parses it (`generateReplayId` hashes
  the players, date, result, leaders and the whole file).
- The regenerated vectors carry `[Engine "forceteki@56b0349c7-dirty"]`. The viewer now says so
  (below), so `vectorsBoard.test.ts` expects that one notice on them. `minimal` now carries
  `WriterRevision`, so the tests that used it as a pilot file strip the tag.

Client conformance work done in this sync (spec §3, §18, §23):

- **[C-01]** File Health now says when a file is pre-release (no `WriterRevision`), comes from a
  `-dirty` build, has a `DEFEAT` with `reason: "unknown"`, or is a newer `1.x` (§18). `RecorderErrors` and `@unknown` already were.
- **§18 extensions** — an `X_` event type and an `X_` section are skipped without a word.
- **§23 display** — `displayText()` neutralises bidi formatting and control characters in every
  file string the UI shows: card names (in `indexResolver`, so every caption and story name),
  `%%% STORY` lines, P1/P2, CHOICE `prompt`/`offered`, annotation `text`/`by`, captions
  (`frameAction`), bookmark labels, File Health messages and Recent Replays. React escapes HTML.
  `ABILITY_ACTIVATE.title` is not shown anywhere in the client, so its icon markup is never
  interpreted, as HTML or otherwise; a future caption that shows it must expand the three §10.1
  tokens to text, never inject them.
- **§23 keys** — every `obj[key] =` with a file key was audited: the fold writes status tokens
  with `hasOwnProperty` + `defineProperty`, seats go through `isSeat`, keyframe maps are
  normalised field by field, and `parse` holds header tags in a prototype-less map (retired at
  `950a65a82`: parse refuses a reserved tag name). `manifest.test.ts` folds, renders, checks and
  adapts every well-formed negative, and asserts no shared prototype gained a key.
- **[A-01] / §18 on export** — `serialize` writes back unknown header tags and unknown sections
  verbatim; the old "left out" warning on Download with notes is gone.
- **`esc()`** turns a run of `\r`/`\n` in a header value into one space (as the forceteki writer
  does) and any other control character into a space (Appendix B `tag-char`).

## What `4644a7bb4` changed in the format (all handled here)

Spec §10.3 (Homeworlds) and §10.4 (Grand Moff Tarkin), plus the pilot-file rows of §22.

- **`baseUpgrades`** — Fortify: an upgrade attached to a BASE. Its `MOVE` goes into `base` with
  `kind: "upgrade"` and `attachedTo: "base@N"` (the seat's `p` when a pilot file names no host),
  and `PLAY_UPGRADE.target` is `base@N`. Leaving `base`, or a `DEFEAT`, takes it off. Never in
  `cards`. Absent until a move or a keyframe supplies one; gated as a set. The board passes the
  cards as `base.upgrades`, which main's `LeaderBaseCard` already draws as strips.
- **`baseCaptured`** — a base as captor (Arrest): a `CAPTURE` whose `by` is `base@N`; `detach`
  clears it. Gated as a set. The board puts each captive in the seat's `capturedZone` pile with
  `parentCardId` = the base, as the live server does: `Board` rebuilds every captor's
  `capturedCards` from that pile, so a list set on the base directly was thrown away.
- **`baseDefeated`** — a `DEFEAT` whose `card` is `base@N`. Written only when true. An ability can
  defeat a base that still has HP (the Death Star), so "destroyed" is this flag, never
  `baseHp <= 0`. The board draws a "Defeated" overlay on the base (`ICardData.defeated`).
- **`backSideName`** in `%%% CARDS` — a leader whose Leader Unit side is another card (Tarkin →
  The Death Star) or a double-sided leader's other face. `cardNames.backNameOf`. The story names
  the side that is up; the client's captions, move list and board names do the same from each
  frame's `leader` status (`swupgnCardNames.sidedResolver`), keyed on the EXACT leader id so a
  mirror match's `SET#NUM:2` keeps its own side. (Upstream `render.ts` does the same since
  `9e50bbec8`.)
- **`grantedBy`** on `ABILITY_ACTIVATE` — the card that GAVE `card` the ability (a base's
  "Attached base gains: …"). Captions and the story append ` (granted by X)`.
- **A deploy performed by the leader's own Epic Action is a lettered sub-step** (`R8.A.1c`).
  Numbering is `isTopLevelActionRecord`: a lettered seq is never numbered. `storySeek`,
  `replayBeats` and `swupgnMoves.isNumberedAction` follow it, so the Epic Action and its deploy
  are one beat and one story number.
- **The story numbers action and Epic Action abilities** (since `7dd39a098`). `storySeek` counts
  them unless the file's own STORY indents them (an earlier writer): `storyNumbersAbilities`.
- **`PASS` is written only for the Pass action**, never after a play or an attack. Nothing in the
  client depended on the old shape.
- **`DAMAGE.src` is optional** (absent = the rules dealt it: an empty-deck draw) and may be
  `base@N`; `HEAL.src` exists; `DEFEAT.reason` is the closed `DefeatReason`.
- **`WriterRevision`** header tag (absent = a pilot file) and strict header counts (a corrupt
  `Undos` is absent, not 0). `serialize` writes `WriterRevision` and `Undos` back out.
- **An unknown `%%%` section is skipped**, not refused (§18: a later version's section).
- **Keyframe lists over 1000 entries make the keyframe damaged** (§13): ignored, not snapped.

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
| `initiative` | `players[id].hasInitiative` (the fold takes it from `ROUND_START.active`, revision 6) | `Board` initiative token |
| `initiativeTaken` | `gameState.initiativeClaimed` (older file: `initiative != null`) | `Board` initiative token (filled = taken) |
| `baseHp` / `baseMaxHp` | `base.hp` = printed HP (card data) or the keyframe's `baseMaxHp`; `base.damage` = max − `baseHp`. Before the first keyframe the fold holds the placeholder 30, so `Replay.context.baseHpByFrame` supplies card-data HP for that window only (§21) | `LeaderBaseCard` (base) |
| `handSize`, `hand[]` | `cardPiles.hand`: the named cards, padded to `handSize` with face-down placeholders (a Perspective file); fog-of-war hides identities and keeps the count | `PlayerHand` |
| `deckSize` | `numCardsInDeck` = the file's `deckSize`; falls back to the INIT-order tracker (`deckTracker`); `undefined` when neither is known (absent ≠ zero) | `DeckDiscard` |
| `resourcesReady` / `resourcesExhausted` | `availableResources` = ready; `cardPiles.resources` = ready + exhausted | `Resources` (`ready/total`) |
| `resources[]` | the row's membership, straight from the fold; a file that states none falls back to the client's `hand → resource` MOVE scan, face-down for the remainder | `Resources` |
| `baseEpicActionUsed` | `base.epicActionSpent` | `LeaderBaseCard` (base) epic-action token |
| `baseUpgrades` | `base.upgrades`, one card per Fortify upgrade | `LeaderBaseCard` upgrade strips beside the base |
| `baseCaptured` | `cardPiles.capturedZone`, one card per captive with `parentCardId` = the base | `Board` → `LeaderBaseCard` captured strips beside the base |
| `baseDefeated` | `base.defeated` | `LeaderBaseCard` (base) "Defeated" overlay |
| `active` | **nothing.** Keyframe-supplied and stale between keyframes (§11), so no turn indicator is derived from it. The trays' turn aura is `replayLiveCues.activeSeatByFrame`, a per-frame derivation from the seat each record names — a different claim, and never presented as the file's | — |
| `credits` | `cardPiles.credits` (one placeholder per credit) | `Credits` |
| `hasForce` | `forceToken.active` | `LeaderBaseCard` (Force token on the base) |
| `discard[]` | `cardPiles.discard` | `DeckDiscard` |
| `leader.id` | `leader.uuid` (header leader as fallback); with `deployed`/`onStartingSide` it picks the NAME shown for a card with a `backSideName` | `LeaderBaseCard` |
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
| `cards[].captured` | `cardPiles.capturedZone`, one card per captive with `parentCardId` = captor; a base's captives are `baseCaptured`, above | `UnitsBoard` → `GameCard` captured strip |
| controller vs owner | `controllerId` = the seat whose list holds the card; `ownerId` = the card's folded `owner` when it has one (revision 6), else the file's DECKS/header (`ownerSeatMap`), so a `TAKE_CONTROL`ed card shows the stolen icon | `GameCard` status icons |
| `cards[].upgradeControllers` | the attached upgrade's `controllerId` (it stays drawn on its host) | `GameCard` stolen icon on the upgrade |
| `cards[].blank` | `isBlanked` | `GameCard` blank status icon |
| `cards[].copyOf`, `name` | `clonedCardId`, `clonedCardName` (the copied art and name); the story name via `sidedResolver` | `GameCard` |
| `cards[].traits`, `leaderUnit`, `cost`, `aspects` | **nothing** (no live-board field shows them) | — |
| `effects` | `activeEffectRows` (one line per effect, story wording) and each target unit's `effectNotes`; `null` (no box) when absent | `ActiveEffects` (panel), `GameCard` `✦` mark |
| `abilityUses` | `spentAbilityRows` (spent ones only); `null` when absent | `ActiveEffects` |
| `foreignResources` | nothing beyond the resource counts | `Resources` |

Live-play cues the board shows around the cards, rebuilt per frame from the file
(`replayLiveCues.ts`): whose action it is (`isActionPhaseActivePlayer`, the trays' turn aura;
the seat each record names, opening each action phase on the initiative holder), the attack in
progress (`isAttacker`/`isDefender` on the attacker, the target unit or the target base, for the
ATTACK and the consequences filed under its seq), and the last card played
(`clientUIProperties.lastPlayedCard`, the opponent tray's preview). Playback holds each BEAT
on screen for its animation length (`replayTiming.ts`'s `beatDurationMs`, plus a handoff pause
folded in by `dwellMs`), not a fixed per-frame hold.

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
(`writerGeneration`, one line per detectable row of §22, with what it costs the replay).

## Conformance gate

`__tests__/vectors.test.ts` runs every positive vector `manifest.json` lists (all thirteen, copied
verbatim from forceteki `swupgn/test-vectors/`: `minimal`, `organic`, `upgrades`, `pilot`,
`capture`, `arrest`, `homeworlds`, `death-star`, `stolen-hauler`, `other-writer`, `effects`,
`visibility`, `control`) through parse → fold → render
and requires a byte-identical render (`render(doc) + '\n'`) and a fold equal to `.fold.json` as
JSON values (the manifest's rule: key order not significant, array order significant, absent ≠
null, so it compares with `toStrictEqual` after a JSON round trip), with no carve-out; every
vector must also pass `checkKeyframes` with no mismatch (spec §20 step 5), and survive
serialize → parse with an identical fold and render. Step 2 (`validate()`) is asserted upstream
on the same bytes. `__tests__/manifest.test.ts` runs the rest of the manifest: every `malformed`
negative must make `parse` throw `SwuPgnError` with its listed code, and every other entry must
parse and fold, render, gate and adapt without crashing, touching a prototype or growing a list
past 1000. The validator-only codes (`schema`, `bad-zone`, `duplicate-seq`, `dangling-ref`,
`over-cap`, `keyframe-mismatch`, `pre-release`, `unknown-type`/`-section`, `newer-minor`,
`unknown-value`, `bad-token-name`, `deck-build-move`, `credit-zone`, `result-mismatch`,
`round-start-active`, `token-zone`, `fortify-host`, `effect-end-unknown`) are not the client's to
report as codes; `reserved-key` is a parser code now. File Health words `result-mismatch` and the
four revision-6 ones as warnings.
`swupgnConformance.test.ts` also runs every well-formed negative through the viewer's own
helpers (File Health, digests, decisions, captions, sided names, result formatting). The optional
`reduced-state.schema.json` check is not run: `ajv` is only a transitive dependency here, not a
declared devDependency.
`src/app/_utils/__tests__/vectorsBoard.test.ts` takes each vector one level up, through
`adaptState`, and asserts every §11 field against `.fold.json`, plus a `FileHealth` that reports
nothing at all on every vector (clean `forceteki@f74700d3f` Engines, no `-dirty`). `manifest.test.ts` also opens `result-mismatch` and asserts File Health's
notice.
`src/app/_utils/__tests__/swupgnCompat.test.ts` has one test per row of the §22 table,
plus the pre-publication shapes (no `kind`, no RESOURCE). `src/app/_utils/__tests__/homeworldsReplay.test.ts` pins the §10.3/§10.4 prose and pacing,
and requires every vector's numbered captions to equal its own STORY's numbered lines. `__tests__/fixtures/sample-game.swupgn` is a pre-1.0 file and pins the compatibility
shims.

## Client-owned divergences — preserve these when re-vendoring

- **`parse.ts` `MAX_EVENTS`** — 200k-event ceiling, stricter than upstream's 1,000,000-record
  `maxRecords`, which both apply. Reported with the same code, `too-many-records`. Upstream's cap
  is sized for a reader that never builds per-frame snapshots; the viewer does.
- **`parse.ts` `MAX_ANNOTATIONS`** — 20k-annotation ceiling, same `too-many-records` code.
  `MAX_EVENTS` counts events only, and the Notes tab threads and renders every annotation.
- **`render.ts` keyframe layout** — the ROUND_START board summary lays out
  `snapToKeyframe(emptyState(), keyframe)`, not the raw keyframe. Upstream's
  `isCompleteKeyframe` rejects a half-shaped keyframe card (`isCompleteKeyframeCard`); the
  client's accepts it and repairs it in the snap, so `boardSummary` iterating a crafted
  `upgrades: 5` threw inside StoryTab. Same reason as the `integrity.ts` snap.
- **`parse.ts` `ParseNotes`** — `parse()` returns `SwuPgnDocument & ParseNotes`:
  `skippedSections` (banners this version does not know, minus `X_` extensions, §18), and
  `extraTags` / `extraSections` (every header tag §5 does not define, and every unknown section's
  banner and lines, verbatim and unparsed, so `serialize` can write them back, §3 [A-01]). File
  Health reports the first. `types.ts` stays verbatim, so these live on the client's own type.
  `tagOrder` (every header tag in file order) lets `serialize` write the header back byte for
  byte.
- **`parse.ts` record shape** — a record that parses to `null`, a number, a string or an
  array is refused with its line number and code `not-object`. It used to reach
  `events[i].seq` in the viewer and be persisted to IndexedDB before first render, so the
  `?id=` link crash-looped. Upstream leaves this to `validate()`, where §24 makes `not-object` an
  ERROR (well-formed, not malformed), so strictly this rejects a well-formed file that §3 [P-01]
  says a parser must accept. Kept deliberately: §24 lets a reader decline an invalid file, and
  folding a scalar record is the crash this guard exists for.
- **`integrity.ts` keyframe snap** — upstream ends each comparison with `s = snapTo(e.keyframe)`,
  a deep clone of the RAW keyframe that only fills a missing `captured` (upstream relies on its
  stricter `isCompleteKeyframeCard` gate for the rest).
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
  (a card's `statusTokens` keeps at most 200 own, non-reserved names with positive finite
  counts, `tokenCounts`; `resources`, `baseUpgrades` and `baseCaptured` are capped with them, and `baseEpicActionUsed`,
  `baseDefeated` (true only), `leader.onStartingSide` and the top-level `active` ride through
  only when well-typed, absent staying absent; a keyframe that does not state `baseUpgrades` /
  `baseCaptured` keeps what the records attached, since absent is "not recorded" and a pilot
  file folds Fortify from its MOVEs alone, and a base already defeated stays defeated);
  a seat that is missing or malformed is ignored and the folded seat kept. Upstream replaces
  wholesale and ignores the whole keyframe. Pre-1.0 files in the wild carry one-seat keyframes,
  and replacing wholesale erased that player's board. Compatibility shim. Also filters a token
  upgrade or an attached card that an early writer listed as its own arena card. `power`/`hp`,
  `keywords`, `deckSize`, `leader` and `initiativeTaken` ride through when well-typed.
  `isCompleteKeyframe`/`hasSnapKeyframe`/`emptyState` are exported for the verbatim
  `integrity.ts` and `render.ts`. Upstream's `snapTo` is not ported: `snapToKeyframe` is the
  client's only snap, and it already gives every card a capped `captured` list.
- **`fold.ts` `stateAt()`** — restarts only from a keyframe that states `baseUpgrades` and
  `baseCaptured` for both seats and restates (`baseDefeated: true`) any base defeated before it (by a DEFEAT record or an
  earlier keyframe), since the snap above carries all three across one that does not; otherwise it folds from
  further back, so `stateAt`, `fold` and `foldFrames` always agree.
  Upstream restarts from any complete keyframe.
- **`fold.ts` `foldFrames()`** — no upstream equivalent; the scrubber needs every frame and
  `events.map((_, i) => fold(...))` is O(n²).
- **`fold.ts` `frameCost()`** — no upstream equivalent; what `foldFrames()` would hold (each
  frame's serialized size, summed over every frame) from one fold that keeps no per-frame copy. The viewer refuses a file past its budget
  (`replayTooHeavy`) instead of building a frame table that can run to gigabytes.
- **`fold.ts` `eventKind()` fallback** — `kind` when stated, else `attachedTo` ⇒ upgrade (the
  fallback for a file that states no kind).
- **`fold.ts` pre-1.0 token filter** — `isStatusTokenCard` short-circuits a token upgrade's
  own records before the switch. Equivalent to upstream for a 1.0 record (a token never joins
  an arena, `attachTo` skips `TOKEN:` ids, its DEFEAT finds nothing); needed for a file
  that states no `kind`, where the token would otherwise fold into an arena.
- **`tokens.ts` same-arena re-attach** — `dropInertRecords` keeps a MOVE whose `from` and `to`
  are the same arena when it names a new `attachedTo` (an upgrade changing hosts, a pilot
  ejected). The writer emits these now (§10.1) and upstream's fold handles them; only the
  inert-record filter is client-owned.
- **`fold.ts` revision-6 keyframe fields** — `isCompleteSeat` applies upstream's strict rule to
  `foreignResources`, `abilityUses` and a card's `upgradeControllers` (present and unusable = a
  damaged seat). `snapToKeyframe` coerces each new card and seat field (`seatMap`,
  `abilityUseList`, `effectList`) and takes the keyframe's `effects` unless that list is damaged,
  in which case it keeps the folded effects instead of refusing the whole keyframe.
- **`effectWords.ts`** — client-only mirror of render.ts's private `durationWords`/`endWords`
  for captions and the Effects box; `writerRevision6.test.ts` holds every EFFECT_START,
  EFFECT_END, LOOK and NAME caption of the vectors to the line `render()` prints.
- **`simulGroups.ts`** — client-only: a `simul` group's span, for the scrubber's stops.
- **`fold.ts` keyframe list ceiling** — `isCompleteSeat` rejects a seat whose `cards`, `hand`,
  `discard`, `resources`, `baseUpgrades` or `baseCaptured` is over `MAX_ZONE_LIST` (§13), or
  whose cards hold more than `MAX_ZONE_LIST` upgrades and captives between them (counted raw,
  through `arr()`, before the snap caps each card's lists), or whose `leader` is present, not
  `null` and not an object with a string `id`, as upstream's `isCompleteKeyframe` does per
  keyframe. Upstream also requires every keyframe card
  to be fully shaped (`isCompleteKeyframeCard`); the client normalizes cards in
  `snapToKeyframe` instead and does not port it. An optional list that is not an array
  (`resources: null`) is read as absent, as `normalizePlayer` reads it; upstream counts any
  non-`undefined` non-array as a damaged keyframe.
- **`fold.ts` reserved-token predicates** — `countBaseToken` uses `tokens.ts`'s
  `isCreditToken`/`isForceToken`. For a current id they are upstream's rule exactly,
  `tokenNameOf(id) === 'credit'` / `'the-force'` (so `TOKEN:credit:2` counts and
  `TOKEN:credit:1` does not). They also read a pre-2026-09 title spelling — a name part with a
  capital or a space, lower-cased: `TOKEN:The Force`, `TOKEN:Credit:2`. Upstream does not.
- **`tokens.ts` `looseTokenName`** — the client's id reader for display and the pre-1.0 fallbacks
  (lower-cases, strips any `:N`), renamed from `tokenName` so it does not shadow upstream's
  `ids.tokenName` in the barrel.
- **`replayAction.frameAction` / `storyName`, `replayDecisions.bookmarkLabel`** — client-only
  captions: each label is `flatten(displayText(…))`, so it is one line (§16, R-04), and
  `storyName` cuts a name and its ` #N` as `render()`'s `nm()` does. A GAME_END caption names a
  winner only for `1`/`2`/`"Draw"`; `render()` (verbatim) prints `… wins` for any other value.
- **`swupgnFileIssues.ts` revision-6 slips** — the [W-47] token rule is `validate.ts`'s
  `changesArena` exactly; a GAME_END winner outside `1`/`2`/`"Draw"` is its own warning.
- **`replayBeats` adjacency gate / `swupgnWriter.ts`** — client-only. See "What
  `950a65a82..a2c013963` changed": position grouping only for files `groupsByAdjacency` names.
- **`cardNames.ts` untyped fields** — a `null` index entry is skipped (upstream drops any entry whose `id` or `name` is not a string; the client keeps the entry, so a bad `name` does not lose its `backSideName`); a non-string `name` or `backSideName` is
  ignored and newlines in a name are flattened (a rendered story line beginning `%%%` would
  end the STORY section of an export). Names also pass through `displayText` (§23). The §16
  `nm()` cut (over 120 code units → 119 and `…`) runs after both, on the name as shown, so no
  shown name is over 120. Upstream's `shorten` flattens then cuts the raw name, turning each
  line break and bidi control into its own space; the client turns a run of CR/LF into ONE
  space and drops bidi controls. So for a CARDS name holding a CRLF or a bidi control, the
  client's story differs from upstream's by those spaces (and can cut at a different point).
  No vector holds one. `render()` calling the new `shorten` again on a client name changes
  nothing (`render.test.ts`).
- **`tokens.ts`** — client-only. Repairs the token lifecycle in pre-1.0 files (which emit no
  removal decrement), drops inert records, classifies token upgrades when no `kind` is stated,
  recovers a pilot's host from the keyframes when the writer named none, reads a pilot
  writer's "Framework effect" DAMAGE/HEAL `src` as no source (§22), and resolves token art ids
  for both id shapes.
- **`serialize.ts`** — client-only. The header goes out in the file's own tag order
  (`tagOrder`), falling back to `HEADER_ORDER` for a document `parse()` did not build. No exported STORY line may start with `%%%` once trimmed
  (a smuggled newline in an UNDO's `at` or a raw id would open a section); such a line gets a
  leading `·`. Whitespace is no escape: `parse()` trims before it looks for a banner.
  The client is an Annotator, so an export changes nothing but the notes (§3 [A-01], §18):
  unknown header tags go out after the known ones and unknown sections after ANNOTATIONS, both
  verbatim (`extraTags`/`extraSections`); a second round trip is a fixed point. The first line
  is always `[Game …]`, no BOM is written, and the file ends with one `\n` ([W-02]). `esc()`
  flattens line breaks and control characters in a header value to spaces (§4, Appendix B).
  Also: emits `%%% STORY` (the document's own, or a fresh render)
  and `%%% CARDS` in the spec's canonical section order, and every optional §5.2 header tag the
  document carries (`WriterRevision`, `EndDate`, `Match`, `GameNumber`, `RecorderErrors`, `Undos`) — dropping one would
  quietly relabel a partial file as complete, or orphan a game from its match.
- **`displayText.ts`** — client-only. §23 display neutralisation (bidi formatting dropped,
  controls to a space, tab and line feed kept), applied at the UI's display points and in
  `cardNames.indexResolver`. Display only: no document is rewritten, so exports keep the file's
  text.
- **`types.ts` Annotation threading** — `id`/`parent`/`ts` are upstream now (spec §15).
  Nothing client-owned remains in types.ts.

Re-vendoring dropped MAX_EVENTS and the discard guards once already (caught by /review, not
by the test suite — they had no tests). Diff this list against upstream before accepting a
re-vendor, not just the test results.

## Deliberately not ported

- **`actionLinks.ts` (`linkActionSteps`)** — only `isTopLevelActionRecord` is vendored. The
  writer-side pass that stamps `for` on a file
  whose writer did not. This is a reader: it uses `for` when the file carries it and loses only
  the grouping when it does not. If it is ever ported, the **action-typed precursor sets** must
  come with it exactly — `ATTACK` may be preceded only by `CHOICE`/`MODAL_CHOICE`/`EXHAUST`,
  every other top-level action also by `MOVE`/`STATS`/`EXHAUST_RESOURCES` — because one shared
  set gets an **Ambush** unit wrong: it is played and attacks in the same phase, so the play's
  own `MOVE` and `STATS` sit immediately before the `ATTACK` naming the same card, and the
  attack steals them. Keep the rule that a run is filed only if something in it names the
  action's card; a wrong link is worse than none.

Resolved upstream, do NOT re-apply: the Game-tag major gate (`unsupported-major`, `READER_MAJOR`,
since `0bbe90409`; was the client's `SUPPORTED_GAME_TAG` / `unsupported-version`); `unreadableTags`
(optional counts are `bad-count` now); the prototype-less header map (reserved tag names are
refused); `strictCount`'s safe-integer check; skipping an unknown section before `JSON.parse` (upstream
does it now; only keeping the lines for export is client-owned); the strict `^\d+$` count shape
and `bad-count` on `Rounds`; the `[Rounds]` NaN fallback; keeping token upgrades out of
the arenas (driven by `kind`); the seat/`__proto__` guard, `arr()` for scalar-where-array
fields and the primitive-keyframe guard (upstream has all three); attach-from-`attachedTo`,
detach-on-exit and `hasForce` (upstream folds them now); the `(cost N)` render wording; the hand/discard
CONTENTS fold (upstream adds AND removes on MOVE and dedupes the summary records now, and
gates both in §14 — the client's version of this is retired, not divergent); the fold's non-object event
skip (`isRecord` since `c17ef7499`, and wider: it skips arrays too).

Long-term: replace with a shared npm package (see spec "Long-term note").
