/* eslint-disable @typescript-eslint/no-explicit-any */
// This adapter produces the live board's gameState, which is typed `any`
// (IBoardState.gameState: any, see Game.context.tsx which disables the same rule).
// Typing these returns would mean typing the entire live board state — out of scope.
import type { CardInstanceState, ReducedState, Seat, SwuPgnDocument, PlayerState, SetupInitRecord } from '@/lib/swupgn';
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
}

/** ReducedState arena zones → board cardPiles zone names. */
export const ZONE_MAP: Record<string, string> = {
    ground: 'groundArena',
    space: 'spaceArena',
};

/** Parse "SET#NUM[:copy]" into a board setId. */
export function parseSetId(id: string): { set: string; number: number } {
    const base = id.replace(/:\d+$/, '');
    const [set, num] = base.split('#');
    return { set, number: Number(num) };
}

/** Build a board card from a bare id (hand/discard piles carry only ids). */
export function cardFromId(
    id: string, zone: string, controllerId: string, ownerId: string, stat?: CardStat,
): AdaptedCard {
    const artId = tokenArtId(id) ?? stat?.id;
    return {
        uuid: id,
        setId: parseSetId(id),
        zone,
        controllerId,
        ownerId,
        type: stat?.type ?? 'unit',
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
        const name = TOKEN_BADGE_NAME[token];
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

/** Build a board card from a folded in-play instance. Printed power/HP come from the
 *  static stat map (the .swupgn stream has no stats); damage is the folded value. */
export function cardFromInstance(inst: CardInstanceState, ownerId: string, stat?: CardStat): AdaptedCard {
    return {
        ...cardFromId(inst.id, ZONE_MAP[inst.zone] ?? inst.zone, ownerId, ownerId, stat),
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

/** Pull each seat's starting deck-order length from the INIT setup record. */
export function deckOrderLengths(doc: SwuPgnDocument): Record<Seat, number> {
    const init = doc.setup.find((r): r is SetupInitRecord => !!r && (r as SetupInitRecord).t === 'INIT');
    return {
        // `init?.` guards the record, not the field: an INIT line without p1DeckOrder threw.
        1: Array.isArray(init?.p1DeckOrder) ? init.p1DeckOrder.length : 0,
        2: Array.isArray(init?.p2DeckOrder) ? init.p2DeckOrder.length : 0,
    };
}

/**
 * A pile is only ever rendered, so its length is bounded by what can plausibly be shown.
 * `credits` and `resourcesExhausted` are never written by any event — they enter the state
 * only via a keyframe, copied verbatim from the file — so `{"credits": 900000000}` on one
 * line used to allocate a 900M-element array and OOM the tab.
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
    ids: string[] | undefined, total: number, owner: string, statMap: Record<string, CardStat>,
): AdaptedCard[] {
    const known = (Array.isArray(ids) ? ids : []).slice(0, total)
        .map((id) => cardFromId(id, 'resources', owner, owner, statOf(id, statMap)));
    return known.length >= total
        ? known
        : [...known, ...facedownStack(total - known.length, 'resources', owner)];
}

function adaptPlayer(
    ps: PlayerState, playerId: string, deckOrderLen: number,
    leaderId: string, baseSetId: string, hideHand = false,
    statMap: Record<string, CardStat> = {},
    highlight?: Set<string>,
    leaderExhausted = false,
    entering?: Set<string>,
    attacking?: Set<string>,
    resourcedIds?: string[],
    baseHp?: number,
): any {
    const inPlay = ps.cards.map((c) => cardFromInstance(c, playerId, statOf(c.id, statMap)));
    // Token badges ride along in the arena piles as parented cards, exactly as the live
    // server delivers upgrades; UnitsBoard groups them onto their host.
    const tokens = ps.cards.flatMap((c, i) => tokenCards(c, inPlay[i], playerId, statMap));
    // Real (printed) upgrades attach the same way: one parented arena card per upgrade, so
    // UnitsBoard groups it under its host. Without this a pilot or an equipment card is
    // tracked in the fold but renders nowhere.
    const upgrades = ps.cards.flatMap((c, i) => (c.upgrades ?? []).map((id) => ({
        ...cardFromId(id, inPlay[i].zone, playerId, playerId, statOf(id, statMap)),
        parentCardId: inPlay[i].uuid,
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
    const ground = [...inPlay, ...upgrades, ...tokens].filter((c) => c.zone === 'groundArena');
    const space = [...inPlay, ...upgrades, ...tokens].filter((c) => c.zone === 'spaceArena');
    // Fog-of-war: render this player's hand as face-down placeholders (count preserved,
    // identities hidden) instead of the omniscient known cards.
    const hand = hideHand
        ? facedownStack(ps.hand.length, 'hand', playerId)
        : ps.hand.map((id) => cardFromId(id, 'hand', playerId, playerId, statOf(id, statMap)));
    const discard = ps.discard.map((id) => cardFromId(id, 'discard', playerId, playerId, statOf(id, statMap)));
    const resourcesTotal = ps.resourcesReady + ps.resourcesExhausted;
    const numCardsInDeck = Math.max(
        0,
        deckOrderLen - hand.length - resourcesTotal - discard.length - inPlay.length,
    );
    // A deployed leader lives in an arena as a unit (folded into ps.cards). The leader slot
    // then shows the "deployed" placeholder (zone != 'base'); otherwise it shows the leader
    // art. LeaderBaseCard derives isDeployed from `zone !== 'base'`, so an undeployed leader
    // MUST carry zone 'base' or it wrongly renders as deployed (the bug that hid leaders).
    const leaderDeployed = ps.cards.some((c) => baseId(c.id) === baseId(leaderId));
    const leader = cardFromId(leaderId, leaderDeployed ? 'leader' : 'base', playerId, playerId, statOf(leaderId, statMap));
    leader.type = 'leader';
    // An undeployed leader exhausts when it uses its action ability — show Karabast's
    // dimming. Glow it on the frame it acts (same `selected` highlight as units).
    if (!leaderDeployed && leaderExhausted) leader.exhausted = true;
    if (highlight && highlight.has(leaderId)) leader.selected = true;
    // Base HP: the .swupgn stream never states a base's printed HP, and ReducedState seeds
    // every base at 30 — so bases with an aspect penalty or a Force slot (33, 28, ...) read
    // wrong, and the base showed no damage at all because nothing set `damage` on it.
    // Printed HP comes from card data; current HP is derived by the caller from the
    // absolute `hp` on base DAMAGE/HEAL/OVERWHELM events.
    const base = cardFromId(baseSetId, 'base', playerId, playerId, statOf(baseSetId, statMap));
    base.type = 'base';
    if (typeof base.hp === 'number' && typeof baseHp === 'number') {
        base.damage = Math.max(0, base.hp - baseHp);
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
        isActionPhaseActivePlayer: false,
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
            // Named resources when the caller derived them (the fold tracks only a count),
            // padded with face-down placeholders if the count outruns the known ids — a
            // keyframe can report more resources than the MOVE stream accounted for.
            resources: resourceCards(resourcedIds, resourcesTotal, playerId, statMap),
            credits: facedownStack(ps.credits, 'credits', playerId),
            capturedZone: [] as AdaptedCard[],
        },
    };
}

/** Map a folded ReducedState + document context into the board's gameState shape. */
export function adaptState(
    s: ReducedState, doc: SwuPgnDocument,
    decks: Record<Seat, number>, seatToId: SeatToPlayerId,
    opts: { hideHandFor?: Seat; highlightIds?: string[]; leaderExhausted?: Partial<Record<Seat, boolean>>; resourcedIds?: Partial<Record<Seat, string[]>>; baseHp?: Partial<Record<Seat, number>>; enteringIds?: string[]; attackingIds?: string[] } = {},
    statMap: Record<string, CardStat> = {},
): any {
    const highlight = opts.highlightIds && opts.highlightIds.length ? new Set(opts.highlightIds) : undefined;
    const entering = opts.enteringIds && opts.enteringIds.length ? new Set(opts.enteringIds) : undefined;
    const attacking = opts.attackingIds && opts.attackingIds.length ? new Set(opts.attackingIds) : undefined;
    const players: Record<string, any> = {};
    for (const seat of [1, 2] as Seat[]) {
        const ps = s.players[seat];
        const playerId = seatToId[seat];
        if (!ps) { continue; }
        const leaderId = seat === 1 ? doc.header.p1Leader : doc.header.p2Leader;
        const baseSetId = seat === 1 ? doc.header.p1Base : doc.header.p2Base;
        const adapted = adaptPlayer(ps, playerId, decks[seat], leaderId, baseSetId, opts.hideHandFor === seat, statMap, highlight, opts.leaderExhausted?.[seat] ?? false, entering, attacking, opts.resourcedIds?.[seat], opts.baseHp?.[seat]);
        adapted.hasInitiative = s.initiative === seat;
        players[playerId] = adapted;
    }
    return {
        players,
        phase: s.phase,
        initiativeClaimed: s.initiative != null,
        clientUIProperties: {},
        winners: [],
    };
}
