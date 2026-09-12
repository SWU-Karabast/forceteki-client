import { parse, type SwuPgnDocument } from '@/lib/swupgn';
import { generateReplayId, storeReplay } from '@/app/_utils/replayStorage';

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
 * uploading it back.
 */
export async function storeReplayContent(rawContent: string): Promise<{ id: string; doc: SwuPgnDocument }> {
    const doc = parse(rawContent);
    if (doc.events.length === 0) {
        throw new Error('No events found in replay file.');
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
