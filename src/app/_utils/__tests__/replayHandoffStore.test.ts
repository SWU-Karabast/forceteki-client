import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse } from '@/lib/swupgn';

vi.mock('../replayStorage', () => ({
    generateReplayId: vi.fn(async () => 'replay-id'),
    storeReplay: vi.fn(async () => {}),
}));

import { storeReplayContent } from '../replayHandoff';
import { storeReplay } from '../replayStorage';

const VECTOR = readFileSync(path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/vectors/minimal.swupgn'), 'utf8');

// Value: protects=the upload box's own parse is trusted (stored as given, not parsed and folded again), and the unchecked path still refuses a file with no events before anything is stored; fails_when=`checked` is ignored, or the guards run for it / stop running without it; why_new=only the too-heavy refusal was tested; seam=none (replayStorage mocked: no IndexedDB in node); no_claim=the IndexedDB write itself
describe('storeReplayContent', () => {
    it('stores a checked document as given, with no second parse or check', async () => {
        const checked = parse(VECTOR);
        const { id, doc } = await storeReplayContent('not a parseable replay', checked);
        expect(id).toBe('replay-id');
        expect(doc).toBe(checked);
        expect(storeReplay).toHaveBeenCalledWith('replay-id', 'not a parseable replay', expect.objectContaining({ player1: checked.header.p1 }));
    });

    it('refuses an unchecked file with no events, before storing it', async () => {
        vi.mocked(storeReplay).mockClear();
        const noEvents = VECTOR.slice(0, VECTOR.indexOf('%%% EVENTS'));
        expect(parse(noEvents).events).toEqual([]);
        await expect(storeReplayContent(noEvents)).rejects.toThrow(/No events found/);
        expect(storeReplay).not.toHaveBeenCalled();
    });
});
