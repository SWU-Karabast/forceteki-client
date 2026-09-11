/* eslint-disable @typescript-eslint/no-explicit-any */
// This adapter produces the live board's gameState, which is typed `any`
// (IBoardState.gameState: any, see Game.context.tsx which disables the same rule).
// Typing these returns would mean typing the entire live board state — out of scope.
import type { CardInstanceState, ReducedState, Seat, SwuPgnDocument, PlayerState } from '@/lib/swupgn';
import { baseId, tokenArtId } from '@/lib/swupgn';
import { statOf, type CardStat } from '@/app/_utils/swupgnCardStats';

/** Minimal card shape the board reads. Replay is read-only, so selection/prompt
 *  fields are defaulted to inert values. Kept loose to match the codebase's
 *  existing gameState typing (IBoardState.gameState: any). */
export interface AdaptedCard {
    uuid: string;
    setId: { set: string; number: number };
    id?: string;
    name?: string;
    zone: string;
    controllerId: string;
    ownerId: string;
    type: string;
    power?: number;
    hp?: number;
    entering?: boolean;
    attacking?: boolean;
    damage: number;
    exhausted: boolean;
    selected: boolean;
    selectable: boolean;
    upgrades?: string[];
    shields?: number;
    experience?: number;
    statusTokens?: Record<string, number>;
    subcards?: AdaptedCard[];
    parentCardId?: string;
    aspects?: string[];

    /** Active keywords as the file lists them (`STATS` / keyframe `keywords`, spec §11). */
    keywords?: string[];

    /** GameCard's own Sentinel icon flag, set from `keywords`. */
    sentinel?: boolean;

    /** Power/HP were rebuilt from card data because the file states none (pre-STATS writer). */
    statsReconstructed?: boolean;

    /** LeaderBaseCard's spent-Epic-Action marker. The leader's `epicActionUsed`, and on the
     *  base card the seat's `baseEpicActionUsed` -- 12 bases carry an Epic Action of their
     *  own, and CR 1.16 counts both as game state (spec §11). */
    epicActionSpent?: boolean;

    /** Which face of a DOUBLE-SIDED leader is up, from `LEADER_FLIP` / the keyframe's
     *  `leader.onStartingSide` (spec §11). `s3CardImageURL` already keys the back-face art
     *  off this, so passing it through is the whole of showing a flipped leader. Absent on
     *  every other leader; absent is never "back side". */
    onStartingSide?: boolean;

    /** The live board's attack/defend arrows while an ATTACK resolves. */
    isAttacker?: boolean;
    isDefender?: boolean;
}

/** ReducedState arena zones → board cardPiles zone names. */
export const ZONE_MAP: Record<string, string> = {
    ground: 'groundArena',
    space: 'spaceArena',
};

/** Parse "SET#NUM[:copy]" into a board setId. */
export function parseSetId(id: string): { set: string; number: number } {
    const base = baseId(id); // String()-coerces: a numeric `card` off JSON.parse reached .replace
    const [set, num] = base.split('#');
    return { set, number: Number(num) };
}

/**
 * Build a board card from a bare id (hand/discard piles carry only ids).
 *
 * `aspects` and `name` are not decoration: GameCard paints an attached upgrade as a banner
 * whose background is chosen by the card's aspects (`cardUpgradebackground`, null without
 * them -- the banner rendered `url(/null)`) and whose text is the card's name. The live server
 * sends both on every card; here they come from the stat map and the file's own CARDS index.
 */
export function cardFromId(
    id: string, zone: string, controllerId: string, ownerId: string, stat?: CardStat, name?: string,
): AdaptedCard {
    const artId = tokenArtId(id) ?? stat?.id;
    return {
        uuid: id,
        setId: parseSetId(id),
        zone,
        controllerId,
        ownerId,
        type: stat?.type ?? 'unit',
        ...(name ? { name } : {}),
        ...(stat?.aspects?.length ? { aspects: stat.aspects } : {}),
        // Tokens have no set number: the S3 pipeline addresses them by numeric engine id
        // under cards/_tokens/, and s3CardImageURL takes that branch whenever `id` is set.
        // Current-format ids carry that number themselves (TOKEN:x-wing#9415311381), which
        // beats a name lookup; the stat map covers older files and synthesized badges.
        ...(artId ? { id: artId } : {}),
        ...(typeof stat?.power === 'number' ? { power: stat.power } : {}),
        ...(typeof stat?.hp === 'number' ? { hp: stat.hp } : {}),
        damage: 0,
        exhausted: false,
        selected: false,
        selectable: false,
    };
}

/** ReducedState token counters -> the subcard `name` GameCard's TOKEN_BADGES matches on.
 *  The board draws neutral tokens as count badges built from a unit's `subcards`, so the
 *  folded counters have to be materialized or they render as nothing. */
const TOKEN_BADGE_NAME: Record<string, string> = {
    shield: 'Shield',
    experience: 'Experience',
    weakness: 'Weakness',
    advantage: 'Advantage',
};

/** STATUS_TOKEN.token is an open list (spec §6.4): a token printed tomorrow arrives under its
 *  own name and is titled from it, so the stat map and the badge can still be looked up. */
const tokenTitle = (token: string): string =>
    TOKEN_BADGE_NAME[token] ?? String(token).replace(/(^|[\s-])\w/g, (c) => c.toUpperCase());

/**
 * Materialize a unit's folded token counters the way the live server does: one arena card
 * per token carrying `parentCardId`, which UnitsBoard groups into the host's `subcards`.
 * One card per token, since GameCard's badge count is `subcards.filter(...).length`.
 */
function tokenCards(
    inst: CardInstanceState, host: AdaptedCard, ownerId: string, statMap: Record<string, CardStat>,
): AdaptedCard[] {
    const counts: Record<string, number> = {
        shield: inst.shields,
        experience: inst.experience,
        ...inst.statusTokens,
    };
    const out: AdaptedCard[] = [];
    for (const [token, rawCount] of Object.entries(counts)) {
        const name = tokenTitle(token);
        // Same bound as the piles: a STATUS_TOKEN count comes off the file and is otherwise
        // only clamped at zero, so a huge count would render that many badge elements.
        const count = Number.isFinite(rawCount) ? Math.min(Math.trunc(rawCount), MAX_PILE) : 0;
        if (!name || !(count > 0)) continue;
        const artId = statOf(`TOKEN:${name}`, statMap)?.id;
        for (let i = 0; i < count; i++) {
            out.push({
                // The badge is an inline SVG, but its hover preview and the pile popup ask
                // s3CardImageURL for real art — which for a token means the numeric engine
                // id, keyed here as TOKEN:<Name> (see gen-card-data.mjs).
                uuid: `${host.uuid}:${token}:${i}`,
                setId: { set: '', number: 0 },
                ...(artId ? { id: artId } : {}),
                name,
                zone: host.zone,
                controllerId: ownerId,
                ownerId,
                type: 'token',
                parentCardId: host.uuid,
                damage: 0,
                exhausted: false,
                selected: false,
                selectable: false,
            });
        }
    }
    return out;
}

/**
 * A unit's stats as the board should show them: printed values plus what is attached.
 *
 * The .swupgn stream carries no stats at all, and the fold only knows WHAT is on a unit
 * (`upgrades[]`, `shields`, `experience`, `statusTokens`). The engine's own rule
 * (UnitProperties.getStatModifiers) is: printed power/HP, plus each attached card's printed
 * upgrade bonus -- Experience +1/+1, Advantage +1/+0, Shield +0/+0, an Ascension Cable +1/+3, a
 * pilot its piloting line rather than its unit line -- plus Grit (power += damage), floored at
 * zero. All of that is static card data, so it is reproduced here. What is NOT reproduced is
 * an ability effect ("+2/+0 while you control a leader unit"): nothing in the file records
 * those, so a unit under one shows its stats without it.
 */
export function effectiveStats(
    inst: CardInstanceState, stat: CardStat | undefined, statMap: Record<string, CardStat>,
): { power?: number; hp?: number } {
    if (typeof stat?.power !== 'number' && typeof stat?.hp !== 'number') return {};
    let power = stat.power ?? 0;
    let hp = stat.hp ?? 0;
    const add = (s: CardStat | undefined, n = 1) => {
        power += (s?.upgradePower ?? 0) * n;
        hp += (s?.upgradeHp ?? 0) * n;
    };
    for (const id of inst.upgrades ?? []) add(statOf(id, statMap));
    const tokens: Record<string, number> = { shield: inst.shields, experience: inst.experience, ...inst.statusTokens };
    for (const [token, count] of Object.entries(tokens)) {
        const title = tokenTitle(token);
        if (Number.isFinite(count) && count > 0) add(statOf(`TOKEN:${title}`, statMap), Math.trunc(count));
    }
    if (stat.grit) power += Math.max(0, inst.damage);
    return {
        ...(typeof stat.power === 'number' ? { power: Math.max(0, power) } : {}),
        ...(typeof stat.hp === 'number' ? { hp: Math.max(0, hp) } : {}),
    };
}

/**
 * Live stats when the file states them (`STATS` records and keyframes, spec §10.1/§11: the
 * engine's own numbers, ability effects included); the static reconstruction only for a
 * file written before `STATS` existed.
 */
export function liveStats(inst: CardInstanceState): { power?: number; hp?: number } {
    return {
        ...(typeof inst.power === 'number' ? { power: inst.power } : {}),
        ...(typeof inst.hp === 'number' ? { hp: inst.hp } : {}),
    };
}

/** A keyword list off the file is rendered as chips; cap it like every other list. */
const MAX_KEYWORDS = 20;

/** Build a board card from a folded in-play instance. Power/HP are the file's live values
 *  when it carries them (spec §10.1 `STATS`, never derived); only a file written before
 *  `STATS` existed gets the static reconstruction, and the card says so. Keywords are the
 *  file's list, verbatim. */
export function cardFromInstance(
    inst: CardInstanceState, controllerId: string, stat?: CardStat, name?: string, statMap: Record<string, CardStat> = {},
    ownerId: string = controllerId,
): AdaptedCard {
    const stated = typeof inst.power === 'number' || typeof inst.hp === 'number';
    const stats = stated ? liveStats(inst) : effectiveStats(inst, stat, statMap);
    const reconstructed = !stated && (typeof stats.power === 'number' || typeof stats.hp === 'number');
    const keywords = Array.isArray(inst.keywords) ? inst.keywords.slice(0, MAX_KEYWORDS).map(String) : [];
    return {
        ...cardFromId(inst.id, ZONE_MAP[inst.zone] ?? inst.zone, controllerId, ownerId, stat, name),
        ...stats,
        ...(reconstructed ? { statsReconstructed: true } : {}),
        ...(keywords.length ? { keywords, sentinel: keywords.includes('sentinel') } : {}),
        damage: inst.damage,
        exhausted: inst.exhausted,
        upgrades: inst.upgrades,
        shields: inst.shields,
        experience: inst.experience,
        statusTokens: inst.statusTokens,
    };
}

export type { ReducedState, Seat };

export type SeatToPlayerId = Record<Seat, string>;

/** Resolves a card id to a display name; the replay passes the file's own CARDS index. */
export type NameOf = (id: string) => string;

/** Everything the replay layers onto a folded frame before the board renders it. */
export interface AdaptOptions {
    hideHandFor?: Seat;
    highlightIds?: string[];
    leaderExhausted?: Partial<Record<Seat, boolean>>;
    resourcedIds?: Partial<Record<Seat, string[]>>;
    baseHp?: Partial<Record<Seat, number>>;
    deckRemaining?: Partial<Record<Seat, number>>;
    enteringIds?: string[];
    attackingIds?: string[];

    /** Units to draw exhausted ahead of the file's own EXHAUST record (see entryExhaust.ts). */
    exhaustedIds?: string[];

    /** Whose action it is (the live trays' turn aura); unset outside an action phase. */
    activeSeat?: Seat;

    /** The attack in progress: the live board's attack/defend arrows on attacker and target. */
    attack?: { atk: string; def: string };

    /** The card last played, previewed in the opponent tray as the live board does. */
    lastPlayedCard?: { set: string; number: number };
    nameOf?: NameOf;
}

/**
 * Who OWNS each card, from the file's own DECKS section (plus the header's leaders and
 * bases): the fold only says who CONTROLS it. The board marks a card held by someone other
 * than its owner as stolen (`TAKE_CONTROL`, spec §10.1), and files captives under their
 * captor while they stay the other player's cards. Tokens have no owner but their controller.
 *
 * A card BOTH decks contain has no owner here, on purpose. DECKS lists base ids, and the `:N`
 * copy suffix that makes an instance unique (§6.1) is assigned during the game, not in the
 * deck list — so for a card both players run, nothing in the file says whose copy `SOR#232:2`
 * is. A single id → seat map cannot express that, and silently kept whichever deck parsed
 * last, which marked every copy in the OTHER seat's hand as stolen: on the `organic` vector,
 * where both decks are identical, four of Player 1's hand cards wore the stolen mask and none
 * of Player 2's did. Ambiguous ownership is dropped instead, so `own()` falls back to the
 * controller and the card reads as unstolen — the honest answer when the file cannot say.
 * A card only one player runs still resolves, so a genuine `TAKE_CONTROL` still shows.
 */
// `adaptState` runs on EVERY frame change, and the owner map is a pure function of the
// document, which never changes while a replay is open. Keyed by the document object so a
// second replay gets its own entry and a closed one is collected; the DECKS section carries
// no length cap, so on a hostile file this is the difference between one build and one per
// frame. Reuses the cached map before rebuilding.
const ownerSeatMapCache = new WeakMap<SwuPgnDocument, Map<string, Seat>>();

export function ownerSeatMap(doc: SwuPgnDocument): Map<string, Seat> {
    const cached = ownerSeatMapCache.get(doc);
    if (cached) {
        return cached;
    }
    const out = new Map<string, Seat>();
    // Tracked per id so a second seat claiming the same card marks it ambiguous rather than
    // overwriting the first.
    const claimed = new Map<string, Seat | 'both'>();
    const put = (id: unknown, seat: Seat) => {
        if (typeof id !== 'string' || !id) return;
        const key = baseId(id);
        const prev = claimed.get(key);
        claimed.set(key, prev == null || prev === seat ? seat : 'both');
    };
    put(doc.header.p1Leader, 1); put(doc.header.p1Base, 1);
    put(doc.header.p2Leader, 2); put(doc.header.p2Base, 2);
    for (const d of Array.isArray(doc.decks) ? doc.decks : []) {
        if (d == null || typeof d !== 'object' || (d.p !== 1 && d.p !== 2)) continue;
        put(d.leader, d.p); put(d.base, d.p);
        for (const entry of Array.isArray(d.deck) ? d.deck : []) put(Array.isArray(entry) ? entry[0] : undefined, d.p);
        for (const entry of Array.isArray(d.sideboard) ? d.sideboard : []) put(Array.isArray(entry) ? entry[0] : undefined, d.p);
    }
    for (const [id, seat] of claimed) {
        if (seat !== 'both') out.set(id, seat);
    }
    ownerSeatMapCache.set(doc, out);
    return out;
}

/**
 * A pile is only ever rendered, so its length is bounded by what can plausibly be shown.
 * `credits` and `resourcesExhausted` also enter the state via a keyframe, copied verbatim
 * from the file, so `{"credits": 900000000}` on one line used to allocate a 900M-element
 * array and OOM the tab.
 */
const MAX_PILE = 200;

function facedownStack(count: number, zone: string, owner: string): AdaptedCard[] {
    // Resource/credit identities aren't in ReducedState; render N inert placeholders.
    const n = Number.isFinite(count) ? Math.min(Math.max(0, Math.trunc(count)), MAX_PILE) : 0;
    return Array.from({ length: n }, (_, i) => ({
        uuid: `${owner}:${zone}:${i}`,
        setId: { set: '', number: 0 },
        zone, controllerId: owner, ownerId: owner, type: 'token',
        damage: 0, exhausted: false,
        selected: false, selectable: false,
    }));
}

/** Resource pile: the actual cards committed, face-down placeholders for any remainder. */
function resourceCards(
    ids: string[] | undefined, total: number, owner: string, statMap: Record<string, CardStat>, nameOf?: NameOf,
): AdaptedCard[] {
    const known = (Array.isArray(ids) ? ids : []).slice(0, total)
        .map((id) => cardFromId(id, 'resources', owner, owner, statOf(id, statMap), nameOf?.(id)));
    return known.length >= total
        ? known
        : [...known, ...facedownStack(total - known.length, 'resources', owner)];
}

/** The per-seat slice of AdaptOptions, plus the fold's own view of that seat. */
interface SeatOptions {
    hideHand?: boolean;
    highlight?: Set<string>;
    leaderExhausted?: boolean;
    entering?: Set<string>;
    attacking?: Set<string>;
    exhausted?: Set<string>;
    attack?: { atk: string; def: string };
    active?: boolean;
    resourcedIds?: string[];
    baseHp?: number;
    deckRemaining?: number;
    nameOf?: NameOf;
    ownerId?: (id: string) => string;
}

function adaptPlayer(
    ps: PlayerState, playerId: string, headerLeaderId: string, baseSetId: string,
    statMap: Record<string, CardStat>,
    { hideHand = false, highlight, leaderExhausted = false, entering, attacking, exhausted, attack, active = false, resourcedIds, baseHp, deckRemaining, nameOf, ownerId }: SeatOptions,
): any {
    const own = ownerId ?? (() => playerId);
    // The file's own leader status names the card (spec §11); the header is the fallback.
    const leaderId = ps.leader?.id ? String(ps.leader.id) : headerLeaderId;
    const inPlay = ps.cards.map((c) => cardFromInstance(c, playerId, statOf(c.id, statMap), nameOf?.(c.id), statMap, own(c.id)));
    // Captives file under their captor, exactly as the live server delivers them: one card
    // per captive with `parentCardId`, which UnitsBoard groups onto the host. They are the
    // opponent's cards, held here.
    const captured = ps.cards.flatMap((c, i) => (c.captured ?? []).map((id) => ({
        ...cardFromId(id, 'capturedZone', playerId, own(id), statOf(id, statMap), nameOf?.(id)),
        parentCardId: inPlay[i].uuid,
    })));
    // Token badges ride along in the arena piles as parented cards, exactly as the live
    // server delivers upgrades; UnitsBoard groups them onto their host.
    const tokens = ps.cards.flatMap((c, i) => tokenCards(c, inPlay[i], playerId, statMap));
    // Real (printed) upgrades attach the same way: one parented arena card per upgrade, so
    // UnitsBoard groups it under its host. Without this a pilot or an equipment card is
    // tracked in the fold but renders nowhere.
    // A leader flying as a pilot is one of these; its ready/exhausted flag rides along.
    const upgrades = ps.cards.flatMap((c, i) => (c.upgrades ?? []).map((id) => ({
        ...cardFromId(id, inPlay[i].zone, playerId, own(id), statOf(id, statMap), nameOf?.(id)),
        parentCardId: inPlay[i].uuid,
        ...(ps.leader && baseId(id) === baseId(leaderId) ? { exhausted: ps.leader.exhausted === true } : {}),
    })));
    // Glow the card(s) that acted this frame (reuses GameCard's `selected` styling). The
    // board is non-interactive in replay, so repurposing `selected` as an action highlight
    // is safe and needs no new prop on the shared card component.
    if (highlight && highlight.size) {
        for (const c of inPlay) if (highlight.has(c.uuid)) c.selected = true;
    }
    // Flag units that just entered play this frame so UnitsBoard animates them in.
    if (entering && entering.size) {
        for (const c of inPlay) if (entering.has(c.uuid)) c.entering = true;
    }
    // Flag the attacker of this frame's ATTACK so UnitsBoard lunges it toward the opponent.
    if (attacking && attacking.size) {
        for (const c of inPlay) if (attacking.has(c.uuid)) c.attacking = true;
    }
    // A unit whose entering EXHAUST is still a few records ahead comes in exhausted, as it
    // does at the table.
    if (exhausted && exhausted.size) {
        for (const c of inPlay) if (exhausted.has(c.uuid)) c.exhausted = true;
    }
    // The live board's attack/defend arrows, for as long as the attack is resolving.
    if (attack) {
        for (const c of inPlay) {
            if (c.uuid === attack.atk) c.isAttacker = true;
            if (c.uuid === attack.def) c.isDefender = true;
        }
    }
    const ground = [...inPlay, ...upgrades, ...tokens].filter((c) => c.zone === 'groundArena');
    const space = [...inPlay, ...upgrades, ...tokens].filter((c) => c.zone === 'spaceArena');
    // `handSize` is the gated count (spec §14); `hand[]` is what the file names, which a
    // Perspective file may leave short (§17). Known cards first, face-down placeholders for the
    // rest. Fog-of-war hides every identity and keeps the count.
    const handSize = Math.max(0, Math.trunc(Number.isFinite(ps.handSize) ? ps.handSize : 0), hideHand ? ps.hand.length : 0);
    const knownHand = hideHand ? [] : ps.hand.slice(0, MAX_PILE).map((id) => cardFromId(id, 'hand', playerId, own(id), statOf(id, statMap), nameOf?.(id)));
    const hand = [...knownHand, ...facedownStack(handSize - knownHand.length, 'hand', playerId)];
    const discard = ps.discard.slice(0, MAX_PILE).map((id) => cardFromId(id, 'discard', playerId, own(id), statOf(id, statMap), nameOf?.(id)));
    const resourcesTotal = ps.resourcesReady + ps.resourcesExhausted;
    // The file's own `deckSize` when it states one (spec §11, gated by §14). Before the first
    // keyframe, or in a file written before the field existed, the count is tracked from the
    // published INIT order and the engine's own `from: 'deck'` MOVEs (deckTracker). Neither
    // known means "not recorded" (§14): the tray shows nothing rather than a zero.
    const deckCount = typeof ps.deckSize === 'number' && Number.isFinite(ps.deckSize) ? ps.deckSize : deckRemaining;
    const numCardsInDeck = typeof deckCount === 'number' ? Math.max(0, Math.trunc(deckCount)) : undefined;
    // A deployed leader lives in an arena as a unit (folded into ps.cards). The leader slot
    // then shows the "deployed" placeholder (zone != 'base'); otherwise it shows the leader
    // art. LeaderBaseCard derives isDeployed from `zone !== 'base'`, so an undeployed leader
    // MUST carry zone 'base' or it wrongly renders as deployed (the bug that hid leaders).
    // The file's own leader status when it carries one (spec §11); otherwise whether the
    // leader is standing in an arena.
    const leaderDeployed = ps.leader?.id ? ps.leader.deployed : ps.cards.some((c) => baseId(c.id) === baseId(leaderId));
    const leader = cardFromId(leaderId, leaderDeployed ? 'leader' : 'base', playerId, playerId, statOf(leaderId, statMap), nameOf?.(leaderId));
    leader.type = 'leader';
    // An undeployed leader exhausts when it uses its action ability — show Karabast's
    // dimming. The file's flag wins (spec §11); the caller's EXHAUST/READY scan is the
    // fallback for a file whose keyframes carry no leader. Glow it on the frame it acts.
    if (!leaderDeployed && (ps.leader?.exhausted ?? leaderExhausted)) leader.exhausted = true;
    // A spent Epic Action is game state (CR 1.16); LeaderBaseCard draws the token for it.
    if (ps.leader?.epicActionUsed === true) leader.epicActionSpent = true;
    // A double-sided leader (Chancellor Palpatine) flips in place in the base zone: no MOVE,
    // no deploy, and a different title, aspects and traits on the way back up. Only the file
    // says which face is up, so without this the board shows the starting side for the rest
    // of the game. Absent stays absent -- `false` would ask for back-face art.
    if (typeof ps.leader?.onStartingSide === 'boolean') leader.onStartingSide = ps.leader.onStartingSide;
    if (highlight && (highlight.has(leaderId) || highlight.has(headerLeaderId))) leader.selected = true;
    // Base HP is the file's: `baseHp` is snapped from every keyframe and set absolutely by
    // every base DAMAGE/HEAL/OVERWHELM (spec §11). The one window the file cannot cover is
    // before the first keyframe, where the fold holds the placeholder 30; the caller may pass
    // a card-data value for that window (§21 allows a reader with card data to derive it).
    const base = cardFromId(baseSetId, 'base', playerId, playerId, statOf(baseSetId, statMap), nameOf?.(baseSetId));
    base.type = 'base';
    // The BASE's own Epic Action, a separate ability on a separate card from the leader's
    // (spec §11). Same token, drawn on the base card.
    if (ps.baseEpicActionUsed === true) base.epicActionSpent = true;
    if (attack && attack.def === `base@${ps.seat}`) base.isDefender = true;
    // Printed HP the card data does not carry comes from the keyframe's `baseMaxHp` (30 is
    // the placeholder until the first keyframe lands, so the damage reads 0 until then).
    if (typeof base.hp !== 'number' && typeof ps.baseMaxHp === 'number') {
        base.hp = ps.baseMaxHp;
    }
    const hpNow = typeof baseHp === 'number' ? baseHp : ps.baseHp;
    if (typeof base.hp === 'number' && typeof hpNow === 'number') {
        base.damage = Math.max(0, base.hp - hpNow);
    }
    // The board reads the player's aspects (leader + base) to pick the Heroism/Villainy
    // Force-token art, and `id` to tell whose side of the board it is on. Both are
    // unguarded reads there, so they must be present, not just correct.
    const aspects = [
        ...(statOf(leaderId, statMap)?.aspects ?? []),
        ...(statOf(baseSetId, statMap)?.aspects ?? []),
    ];
    return {
        id: playerId,
        aspects,
        user: { username: playerId },
        leader,
        base,
        hasInitiative: false, // set by adaptState from ReducedState.initiative
        isActionPhaseActivePlayer: active,
        // The live board reads `promptState.<field>` WITHOUT null-guarding promptState
        // (e.g. LeaderBaseCard/GameCard read promptState.distributeAmongTargets). Replay
        // has no prompts, but the object must exist so those reads return undefined
        // instead of throwing.
        promptState: {},
        availableResources: ps.resourcesReady,
        numCardsInDeck,
        forceToken: { active: ps.hasForce, uuid: `${playerId}:force` },
        cardPiles: {
            hand,
            discard,
            groundArena: ground,
            spaceArena: space,
            // Which cards are in the row, padded with face-down placeholders if the count
            // outruns the known ids. The caller supplies the list (from the fold's own
            // `resources`, spec §11, or its MOVE scan for an older file) so that fog-of-war
            // can withhold it.
            resources: resourceCards(resourcedIds, resourcesTotal, playerId, statMap, nameOf),
            credits: facedownStack(ps.credits, 'credits', playerId),
            capturedZone: captured,
        },
    };
}

/** Map a folded ReducedState + document context into the board's gameState shape. */
export function adaptState(
    s: ReducedState, doc: SwuPgnDocument, seatToId: SeatToPlayerId,
    opts: AdaptOptions = {},
    statMap: Record<string, CardStat> = {},
): any {
    const highlight = opts.highlightIds && opts.highlightIds.length ? new Set(opts.highlightIds) : undefined;
    const entering = opts.enteringIds && opts.enteringIds.length ? new Set(opts.enteringIds) : undefined;
    const attacking = opts.attackingIds && opts.attackingIds.length ? new Set(opts.attackingIds) : undefined;
    const exhausted = opts.exhaustedIds && opts.exhaustedIds.length ? new Set(opts.exhaustedIds) : undefined;
    const owners = ownerSeatMap(doc);
    const players: Record<string, any> = {};
    for (const seat of [1, 2] as Seat[]) {
        const ps = s.players[seat];
        const playerId = seatToId[seat];
        if (!ps) { continue; }
        const leaderId = seat === 1 ? doc.header.p1Leader : doc.header.p2Leader;
        const baseSetId = seat === 1 ? doc.header.p1Base : doc.header.p2Base;
        const adapted = adaptPlayer(ps, playerId, leaderId, baseSetId, statMap, {
            hideHand: opts.hideHandFor === seat, highlight, leaderExhausted: opts.leaderExhausted?.[seat] ?? false,
            entering, attacking, exhausted, resourcedIds: opts.resourcedIds?.[seat], baseHp: opts.baseHp?.[seat],
            deckRemaining: opts.deckRemaining?.[seat], nameOf: opts.nameOf,
            ownerId: (id) => seatToId[owners.get(baseId(id)) ?? seat],
            attack: opts.attack, active: opts.activeSeat === seat,
        });
        adapted.hasInitiative = s.initiative === seat;
        players[playerId] = adapted;
    }
    return {
        players,
        phase: s.phase,
        // The initiative counter's status (spec §11): taken this round, or still available. A
        // file written before `initiativeTaken` existed only says who holds it.
        initiativeClaimed: typeof s.initiativeTaken === 'boolean' ? s.initiativeTaken : s.initiative != null,
        // The live board previews the last card played in the opponent tray.
        clientUIProperties: opts.lastPlayedCard ? { lastPlayedCard: opts.lastPlayedCard } : {},
        winners: [],
    };
}
