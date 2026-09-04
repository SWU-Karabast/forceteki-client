import { parse, type SwuPgnDocument } from '@/lib/swupgn';
import { generateReplayId, storeReplay } from '@/app/_utils/replayStorage';

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
    // generateReplayId expects the old PascalCase Record<string,string>; pass a shim so the
    // stable id logic (Player1/Player2/Date/Result/Leader1/Leader2) still works.
    const id = await generateReplayId({
        Player1: doc.header.p1,
        Player2: doc.header.p2,
        Date: doc.header.date,
        Result: doc.header.result,
        Leader1: doc.header.p1Leader,
        Leader2: doc.header.p2Leader,
    }, rawContent);
    await storeReplay(id, rawContent, {
        player1: doc.header.p1,
        player2: doc.header.p2,
        result: doc.header.result,
        savedAt: Date.now(),
    });
    return { id, doc };
}
