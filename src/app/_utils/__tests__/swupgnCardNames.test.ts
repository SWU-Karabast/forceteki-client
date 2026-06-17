import { describe, it, expect, vi, afterEach } from 'vitest';
import { makeNameResolver } from '../swupgnCardNames';

describe('makeNameResolver', () => {
    it('resolves a known id to its name', () => {
        const r = makeNameResolver({ 'SOR#010': 'Darth Vader' });
        expect(r.nameOf('SOR#010')).toBe('Darth Vader');
    });

    it('strips the :copy suffix before lookup', () => {
        const r = makeNameResolver({ 'SHD#257': 'Battlefield Marine' });
        expect(r.nameOf('SHD#257:3')).toBe('Battlefield Marine');
    });

    it('falls back to the raw id when unknown', () => {
        const r = makeNameResolver({});
        expect(r.nameOf('LOF#164')).toBe('LOF#164');
    });

    it('handles TOKEN: refs by showing the token label', () => {
        const r = makeNameResolver({});
        expect(r.nameOf('TOKEN:Experience')).toBe('Experience');
    });
});

describe('loadCardNameMap', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
    });

    it('fetches the map once and caches the promise across calls', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ 'SOR#010': 'Darth Vader' }),
        });
        vi.stubGlobal('fetch', fetchMock);

        // Fresh module so the module-level cache starts empty.
        const mod = await import('../swupgnCardNames');
        const a = await mod.loadCardNameMap();
        const b = await mod.loadCardNameMap();

        expect(a).toEqual({ 'SOR#010': 'Darth Vader' });
        expect(b).toBe(a);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('returns an empty map and resets the cache so a retry can succeed', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce({ ok: false, status: 404 })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ 'LOF#164': 'Wampa' }) });
        vi.stubGlobal('fetch', fetchMock);
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        const mod = await import('../swupgnCardNames');
        const first = await mod.loadCardNameMap();
        expect(first).toEqual({});

        // Cache was reset on failure, so a second call re-fetches and can succeed.
        const second = await mod.loadCardNameMap();
        expect(second).toEqual({ 'LOF#164': 'Wampa' });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
