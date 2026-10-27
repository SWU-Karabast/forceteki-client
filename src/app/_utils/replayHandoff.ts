import { parse, normalizeEvents, frameCost, type SwuPgnDocument, type ParseNotes } from '@/lib/swupgn';
import { generateReplayId, storeReplay } from '@/app/_utils/replayStorage';
import { skippedSectionList } from '@/app/_utils/swupgnFileIssues';

/**
 * The viewer URL for a stored replay, keeping the moment a shared link pointed at.
 *
 * A shared link names a MOMENT (`t`, or a `from`/`to` clip); the recipient has to upload
 * the file to resolve it (replays live in this browser's IndexedDB, not on a server), and
 * dropping the params on upload landed them at frame 0 instead — the one thing the link
 * existed to communicate. Anything else on the query string is not carried over.
 */
export function replayUrl(id: string, current: { get(k: string): string | null }): string {
    const keep = new URLSearchParams();
    for (const k of ['t', 'from', 'to']) {
        const v = current.get(k);
        if (v != null) keep.set(k, v);
    }
    const qs = keep.toString();
    return `/Replay?id=${encodeURIComponent(id)}${qs ? `&${qs}` : ''}`;
}

/**
 * Persist a .swupgn and return the id the replay viewer opens it by (`/Replay?id=<id>`).
 *
 * Shared by the upload flow and the in-game "Watch replay" action, so a player can go
 * straight from a finished game to the viewer instead of downloading their own file and
 * uploading it back. `checked` is the caller's own parse of `rawContent` when it has already
 * passed the events and budget checks (the upload box), so they are not run twice.
 */
export async function storeReplayContent(rawContent: string, checked?: SwuPgnDocument): Promise<{ id: string; doc: SwuPgnDocument }> {
    const doc: SwuPgnDocument & ParseNotes = checked ?? parse(rawContent);
    if (!checked) {
        if (doc.events.length === 0) {
            throw new Error(noEventsMessage(doc));
        }
        // Refused before it is stored: a stored file that hangs the viewer would hang it again
        // every time it is reopened from Recent Replays.
        const heavy = replayTooHeavy(doc);
        if (heavy) throw new Error(heavy);
    }
    const id = await generateReplayId(doc.header, rawContent);
    await storeReplay(id, rawContent, {
        player1: doc.header.p1,
        player2: doc.header.p2,
        result: doc.header.result,
        savedAt: Date.now(),
    });
    return { id, doc };
}

/** Why a file has no events, naming any section parse() skipped (a misspelled `%%% EVENT`). */
export function noEventsMessage(doc: ParseNotes): string {
    const skipped = doc.skippedSections?.length ? ` (skipped unknown section${doc.skippedSections.length === 1 ? '' : 's'}: ${skippedSectionList(doc.skippedSections)})` : '';
    return `No events found in replay file${skipped}.`;
}

/**
 * The most the viewer will hold across its frame table, in serialized characters (see
 * frameCost): every frame keeps its own copy of the board. The largest test vector costs about
 * 550,000; a hostile file that keeps a wide board, or a fat keyframe, for thousands of records
 * costs hundreds of millions and would hang or crash the tab.
 */
export const FRAME_BUDGET = 32_000_000;

/** Why the viewer refuses this replay, or null when it can show it. Reads the stream it would fold. */
export function replayTooHeavy(doc: SwuPgnDocument): string | null {
    const events = normalizeEvents(doc.events, new Set(doc.annotations.map((a) => a.ref)));
    return frameCost(events, FRAME_BUDGET) > FRAME_BUDGET
        ? 'This replay is too large to show: it keeps more cards in play for more records than any real game. It was not opened.'
        : null;
}
