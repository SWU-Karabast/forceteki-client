import { describe, it, expect, vi, afterEach } from 'vitest';

// The shared loader behind loadCardNameMap/loadCardCostMap — fetched once and module-cached
// per URL, resolving to an empty (null-prototype) map on failure so a failed static asset
// never crashes the viewer. A fresh module import is used per test so the module-level
// `cache` Map starts empty each time.
describe('loadStaticJson', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.resetModules();
    });

    it('fetches once per URL and caches the resolved value across calls', async () => {
        const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ 'A#1': 'Card A' }) });
        vi.stubGlobal('fetch', fetchMock);

        const { loadStaticJson } = await import('../staticJson');
        const a = await loadStaticJson('/x.json', 'warn');
        const b = await loadStaticJson('/x.json', 'warn');
        expect(a).toEqual({ 'A#1': 'Card A' });
        expect(b).toBe(a);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('caches per URL independently', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce({ ok: true, json: async () => ({ a: 1 }) })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ b: 2 }) });
        vi.stubGlobal('fetch', fetchMock);

        const { loadStaticJson } = await import('../staticJson');
        expect(await loadStaticJson('/a.json', 'warn')).toEqual({ a: 1 });
        expect(await loadStaticJson('/b.json', 'warn')).toEqual({ b: 2 });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('resolves to an empty map and drops the cache on a non-ok response, so a retry can succeed', async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce({ ok: false, status: 500 })
            .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: 'now' }) });
        vi.stubGlobal('fetch', fetchMock);
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        const { loadStaticJson } = await import('../staticJson');
        const first = await loadStaticJson('/y.json', 'boom');
        expect(first).toEqual({});
        const second = await loadStaticJson('/y.json', 'boom');
        expect(second).toEqual({ ok: 'now' });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('resolves to an empty map when fetch itself rejects (network failure)', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        const { loadStaticJson } = await import('../staticJson');
        expect(await loadStaticJson('/z.json', 'boom')).toEqual({});
    });

    it('never resolves __proto__ from a hostile JSON payload to Object.prototype', async () => {
        // A generated static asset should never carry this key, but the file is fetched over
        // the network and parsed as arbitrary JSON — the same class of risk as any other
        // untrusted payload the viewer parses. `__proto__` in a plain object literal sets the
        // prototype rather than an own key, so an ungated fetch result would let it through.
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => JSON.parse('{"__proto__": {"polluted": true}, "SOR#010": "Vader"}'),
        }));

        const { loadStaticJson } = await import('../staticJson');
        const map = await loadStaticJson<Record<string, string>>('/hostile.json', 'warn');
        expect(map['SOR#010']).toBe('Vader');
        expect((map as Record<string, unknown>).polluted).toBeUndefined();
        expect(Object.getPrototypeOf(map)).toBeNull();
    });
});
