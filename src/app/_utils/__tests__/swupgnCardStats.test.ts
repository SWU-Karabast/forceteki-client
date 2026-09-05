import { describe, it, expect, vi, afterEach } from 'vitest';
import { statOf } from '../swupgnCardStats';

describe('statOf', () => {
    const map = { 'LOF#164': { power: 4, hp: 5 }, 'TOKEN:X-Wing': { type: 'token', id: '9415311381', power: 2, hp: 3 } };
    it('resolves SET#NUM[:copy] and a current-format token id by its numeric art id', () => {
        expect(statOf('LOF#164:2', map)).toEqual({ power: 4, hp: 5 });
        expect(statOf('TOKEN:x-wing#9415311381:2', map)).toEqual(map['TOKEN:X-Wing']);
        expect(statOf('TOKEN:X-Wing:2', map)).toEqual(map['TOKEN:X-Wing']);
        expect(statOf('TOKEN:unknown#1', map)).toBeUndefined();
    });
});

describe('loadCardStatMap', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
    });

    it('returns an empty map and resets the cache so a retry can succeed', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce({ ok: false, status: 404 })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ 'LOF#164': { power: 4, hp: 5 } }) });
        vi.stubGlobal('fetch', fetchMock);
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const mod = await import('../swupgnCardStats');
        expect(await mod.loadCardStatMap()).toEqual({});
        expect(await mod.loadCardStatMap()).toEqual({ 'LOF#164': { power: 4, hp: 5 } });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
