import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateReplayId, type ReplayIdHeader } from '../replayStorage';

// generateReplayId used to key off the raw .swupgn tag names (Player1/Player2/Date/Result/
// Leader1/Leader2) and a 2000-char content tail. It now takes the parsed header's own field
// names (p1/p2/date/result/p1Leader/p2Leader) and the WHOLE content — a rename that silently
// produced a different id (and so a different storage key / share URL) for the same replay
// if nothing here pins the new shape down.
const header: ReplayIdHeader = {
    p1: 'Alice', p2: 'Bob', date: '2026-09-11T00:00:00.000Z', result: 'P1', p1Leader: 'SOR#010', p2Leader: 'SOR#005',
};

describe('generateReplayId', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('is deterministic for the same header + content', async () => {
        const a = await generateReplayId(header, 'raw file text');
        const b = await generateReplayId({ ...header }, 'raw file text');
        expect(a).toBe(b);
        expect(a.length).toBeGreaterThan(0);
    });

    it('changes when any header field changes, so two games never collide', async () => {
        const base = await generateReplayId(header, 'x');
        expect(await generateReplayId({ ...header, p1: 'Carol' }, 'x')).not.toBe(base);
        expect(await generateReplayId({ ...header, date: '2026-09-12T00:00:00.000Z' }, 'x')).not.toBe(base);
        expect(await generateReplayId({ ...header, result: 'P2' }, 'x')).not.toBe(base);
    });

    it('changes when only the content differs, so a same-header rematch does not collide', async () => {
        const a = await generateReplayId(header, 'game ends one way');
        const b = await generateReplayId(header, 'game ends another way');
        expect(a).not.toBe(b);
    });

    it('treats a missing field as empty, and defaults rawContent to empty', async () => {
        const sparse: ReplayIdHeader = { p1: '', p2: '', date: '', result: '', p1Leader: '', p2Leader: '' };
        await expect(generateReplayId(sparse)).resolves.toEqual(expect.any(String));
    });

    it('falls back to a deterministic non-crypto hash when crypto.subtle is unavailable', async () => {
        // Non-secure-context origins have no SubtleCrypto; the id still has to work everywhere.
        vi.stubGlobal('crypto', {});
        const a = await generateReplayId(header, 'raw file text');
        const b = await generateReplayId(header, 'raw file text');
        expect(a).toBe(b);
        expect(a.length).toBeGreaterThan(0);
        // And it still tracks content, not just the header.
        expect(await generateReplayId(header, 'different content')).not.toBe(a);
    });
});
