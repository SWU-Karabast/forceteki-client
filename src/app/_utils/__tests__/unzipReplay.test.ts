import { describe, it, expect } from 'vitest';
import { zipSync, strToU8, strFromU8 } from 'fflate';
import { extractReplayFromZip, ReplayTooLargeError } from '../unzipReplay';

// Value: protects=only the first .swupgn entry is inflated, and inflation stops at the byte ceiling however the archive declares its sizes; fails_when=the loader goes back to unzip() of every entry, or the running byte count is dropped; why_new=the zip path had no test; seam=none; no_claim=worker scheduling in a browser
describe('extractReplayFromZip', () => {
    it('returns the .swupgn entry, skipping other entries', async () => {
        const zip = zipSync({ 'notes.txt': strToU8('x'.repeat(10_000)), 'game.swupgn': strToU8('%%% HEADER\n') });
        expect(strFromU8((await extractReplayFromZip(zip, 1024))!)).toBe('%%% HEADER\n');
    });

    it('stops at the ceiling instead of inflating a bomb', async () => {
        const zip = zipSync({ 'game.swupgn': new Uint8Array(4 * 1024 * 1024) }, { level: 9 });
        expect(zip.length).toBeLessThan(64 * 1024);
        await expect(extractReplayFromZip(zip, 1024 * 1024)).rejects.toBeInstanceOf(ReplayTooLargeError);
    });

    // Value: protects=a bomb whose local header LIES about its size still stops within one slice of the ceiling, because the archive is fed in slices and counted as it inflates; fails_when=the archive goes back to one push (the whole entry inflates before the first count) or the slices grow; why_new=the first bomb test is caught by the declared-size check alone; seam=none; no_claim=heap high-water mark
    it('stops a bomb that under-declares its size within one slice of the ceiling', async () => {
        const zip = zipSync({ 'game.swupgn': new Uint8Array(64 * 1024 * 1024) }, { level: 9 });
        zip.set([0x10, 0, 0, 0], 22); // local file header: uncompressed size -> 16 bytes
        const err = await extractReplayFromZip(zip, 1024 * 1024).catch((e) => e);
        expect(err).toBeInstanceOf(ReplayTooLargeError);
        // One 4 KB slice inflates to at most ~4.2 MB (deflate's ~1032:1); one push would be all 64 MB.
        expect(err.bytesSeen).toBeLessThanOrEqual(1024 * 1024 + 4 * 1024 * 1032);
    });

    // Value: protects=an entry that DECLARES more than the ceiling is refused before anything inflates; fails_when=the originalSize precheck is removed (the corrupt stream then fails as an inflate error instead); why_new=the other bomb tests also pass on the running count alone; seam=none; no_claim=a header that lies smaller (above)
    it('refuses an entry whose declared size is over the ceiling without inflating it', async () => {
        const zip = zipSync({ 'game.swupgn': strToU8('%%% HEADER\n'.repeat(500)) }, { level: 9 });
        zip.set([0, 0, 0, 0x10], 22); // declared uncompressed size -> 256 MB
        const dataAt = strFromU8(zip).indexOf('game.swupgn') + 'game.swupgn'.length;
        for (let i = dataAt; i < dataAt + 8; i++) zip[i] = 0xff; // and a stream that cannot inflate
        const err = await extractReplayFromZip(zip, 1024 * 1024).catch((e) => e);
        expect(err).toBeInstanceOf(ReplayTooLargeError);
        expect(err.bytesSeen).toBe(0);
    });

    // Value: protects=an archive cut off mid-entry rejects instead of hanging with the entry half-read; fails_when=the end of input stops settling the promise; why_new=only whole archives were tested; seam=none; no_claim=which error fflate raises
    it('rejects an archive that is cut off mid-entry', async () => {
        const zip = zipSync({ 'game.swupgn': strToU8('%%% HEADER\n'.repeat(5000)) }, { level: 0 });
        await expect(extractReplayFromZip(zip.subarray(0, Math.floor(zip.length * 0.6)), 50 * 1024 * 1024)).rejects.toBeDefined();
    });

    it('stores (uncompressed) entries too, and resolves null with no replay inside', async () => {
        const stored = zipSync({ 'game.swupgn': strToU8('abc') }, { level: 0 });
        expect(strFromU8((await extractReplayFromZip(stored, 1024))!)).toBe('abc');
        expect(await extractReplayFromZip(zipSync({ 'a.txt': strToU8('a') }), 1024)).toBeNull();
    });

    it('finds no replay in bytes that are not a zip', async () => {
        await expect(extractReplayFromZip(strToU8('not a zip at all'), 1024)).resolves.toBeNull();
    });

    // Value: protects=a .swupgn entry whose deflate stream is corrupt rejects the load instead of resolving garbage or never settling (a spinner forever); fails_when=the ondata err branch is dropped or no longer settles the promise; why_new=only well-formed archives were tested; seam=none; no_claim=which error type fflate raises
    it('rejects a replay entry whose compressed data is corrupt', async () => {
        const zip = zipSync({ 'game.swupgn': strToU8('%%% HEADER\n'.repeat(500)) }, { level: 9 });
        const nameAt = strFromU8(zip).indexOf('game.swupgn');
        const dataAt = nameAt + 'game.swupgn'.length;
        for (let i = dataAt; i < dataAt + 8; i++) zip[i] = 0xff;
        await expect(Promise.race([
            extractReplayFromZip(zip, 1024 * 1024),
            new Promise((resolve) => setTimeout(() => resolve('unsettled'), 2000)),
        ])).rejects.toBeDefined();
    });
});
