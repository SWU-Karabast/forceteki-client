import { describe, it, expect, vi, afterEach } from 'vitest';
import { openDB, storeReplay, loadReplay, listReplays, deleteReplay } from '../replayStorage';
import { saveAnnotations, loadAnnotations, type WorkingAnnotation } from '../replayAnnotations';

// An IndexedDB stand-in over in-memory Maps. In the default (hand-driven) mode the test fires
// each open/transaction event itself; with `auto` the open succeeds and every request and
// transaction settles on its own, so a helper can be run end to end.
interface FakeRequest { result?: unknown; error?: unknown; onblocked?: () => void; onsuccess?: () => void; onerror?: () => void; onupgradeneeded?: (e: unknown) => void }
interface FakeTx {
    error: unknown;
    storeNames: string[];
    oncomplete?: () => void;
    onerror?: () => void;
    onabort?: () => void;
    addEventListener: (type: string, fn: () => void) => void;
    fire: (type: 'complete' | 'error' | 'abort') => void;
    objectStore: (name: string) => unknown;
}

function stubIndexedDB({ auto = false } = {}) {
    const requests: FakeRequest[] = [];
    const txs: FakeTx[] = [];
    const data = new Map<string, Map<unknown, unknown>>();
    const storeData = (name: string) => {
        if (!data.has(name)) data.set(name, new Map());
        return data.get(name)!;
    };
    const db = {
        close: vi.fn(),
        objectStoreNames: { contains: () => true },
        transaction: (names: string | string[]) => {
            const listeners: Record<string, (() => void)[]> = {};
            let pending = 0;
            let settled = false;
            const tx: FakeTx = {
                error: null,
                storeNames: Array.isArray(names) ? names : [names],
                addEventListener: (type, fn) => { (listeners[type] ??= []).push(fn); },
                fire: (type) => {
                    if (settled) return;
                    settled = true;
                    ({ complete: tx.oncomplete, error: tx.onerror, abort: tx.onabort })[type]?.();
                    (listeners[type] ?? []).forEach((fn) => fn());
                },
                objectStore: (name: string) => {
                    const store = storeData(name);
                    // Each request runs on a microtask; the transaction commits once none are left.
                    const op = (run: () => unknown) => {
                        const req: FakeRequest = {};
                        pending += 1;
                        queueMicrotask(() => {
                            req.result = run();
                            req.onsuccess?.();
                            pending -= 1;
                            if (auto && pending === 0) setTimeout(() => { if (pending === 0) tx.fire('complete'); }, 0);
                        });
                        return req;
                    };
                    return {
                        get: (key: unknown) => op(() => store.get(key)),
                        getAll: () => op(() => [...store.values()]),
                        put: (value: { replayId?: string }, key?: unknown) => op(() => { store.set(key ?? value.replayId, value); }),
                        delete: (key: unknown) => op(() => { store.delete(key); }),
                    };
                },
            };
            txs.push(tx);
            return tx;
        },
    };
    const succeed = (r: FakeRequest) => { r.result = db; r.onsuccess?.(); };
    vi.stubGlobal('indexedDB', {
        open: () => {
            const r: FakeRequest = {};
            requests.push(r);
            if (auto) setTimeout(() => succeed(r), 0);
            return r;
        },
    });
    return { requests, txs, db, data: storeData, succeed };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

// Value: protects=a replay load can never hang on storage: an upgrade blocked by another tab gives up after 5 s, a connection that opens after that is closed, and a blocked-then-open request resolves with no late rejection; fails_when=onblocked only warns again, the timer is not cleared on success, or the late connection is kept; why_new=storage tests covered only generateReplayId; seam=none (stubbed indexedDB global); no_claim=a real browser's IndexedDB
describe('openDB', () => {
    it('gives up 5 s after a blocked upgrade, and closes a connection that opens later', async () => {
        vi.useFakeTimers();
        const idb = stubIndexedDB();
        const p = openDB();
        idb.requests[0].onblocked?.();
        const settled = p.catch((e: Error) => e);
        await vi.advanceTimersByTimeAsync(5000);
        expect((await settled as Error).message).toMatch(/blocked by another open tab/);
        idb.succeed(idb.requests[0]);
        expect(idb.db.close).toHaveBeenCalledTimes(1);
    });

    it('resolves when a blocked upgrade goes through in time, with no late rejection', async () => {
        vi.useFakeTimers();
        const idb = stubIndexedDB();
        const p = openDB();
        idb.requests[0].onblocked?.();
        idb.succeed(idb.requests[0]);
        await expect(p).resolves.toBe(idb.db);
        await vi.advanceTimersByTimeAsync(10000);
        expect(idb.db.close).not.toHaveBeenCalled();
    });
});

// Value: protects=a write whose commit fails (QuotaExceededError aborts the transaction, which fires no error event) rejects instead of leaving Watch Replay or a note save waiting forever, and still closes its connection; fails_when=an onabort handler is dropped, or the close listens only for complete; why_new=no write path had a test; seam=none (stubbed indexedDB global); no_claim=browser quota behaviour
describe('aborted writes reject', () => {
    const aborted = async (write: () => Promise<unknown>, message: RegExp) => {
        const idb = stubIndexedDB();
        const p = write().catch((e: Error) => e);
        await flush();
        idb.succeed(idb.requests[0]);
        await flush();
        idb.txs[0].fire('abort');
        expect(((await p) as Error).message).toMatch(message);
        expect(idb.db.close).toHaveBeenCalledTimes(1);
    };
    it('storeReplay', () => aborted(() => storeReplay('id', '%%% HEADER', { player1: 'a', player2: 'b', result: '', savedAt: 1 }), /transaction aborted/));
    it('deleteReplay', () => aborted(() => deleteReplay('id'), /transaction aborted/));
    it('saveAnnotations', () => aborted(() => saveAnnotations('id', []), /notes transaction aborted/));
});

// Value: protects=every storage helper closes its connection once its transaction settles, so repeated loads/saves do not pile up open connections (which also hold up another tab's upgrade); fails_when=a helper drops its closeWhenSettled call; why_new=connections were never closed; seam=none (stubbed indexedDB global); no_claim=a real browser's connection limits
describe('helpers close their connection', () => {
    const closes = async (run: () => Promise<unknown>) => {
        const idb = stubIndexedDB({ auto: true });
        await run();
        await flush();
        expect(idb.db.close).toHaveBeenCalledTimes(1);
    };
    it('storeReplay', () => closes(() => storeReplay('id', 'raw')));
    it('loadReplay', () => closes(() => loadReplay('id')));
    it('listReplays', () => closes(() => listReplays()));
    it('deleteReplay', () => closes(() => deleteReplay('id')));
    it('loadAnnotations', () => closes(() => loadAnnotations('id')));
    it('saveAnnotations', () => closes(() => saveAnnotations('id', [])));
});

// Value: protects=deleting a replay also deletes its notes, so re-uploading the same file (same content-hash id) does not bring them back; fails_when=deleteReplay leaves the annotations store out of its transaction; why_new=notes outlived their replay; seam=none (stubbed indexedDB global); no_claim=a real browser's IndexedDB
describe('deleteReplay', () => {
    it('removes the replay, its metadata and its notes', async () => {
        const idb = stubIndexedDB({ auto: true });
        await storeReplay('r1', 'raw', { savedAt: 1 });
        await saveAnnotations('r1', [{ _id: 'n1', ref: 'R1.A.1', text: 'note' }]);
        await deleteReplay('r1');
        expect(idb.data('replays').has('r1')).toBe(false);
        expect(idb.data('replayMeta').has('r1')).toBe(false);
        expect(idb.data('replayAnnotations').has('r1')).toBe(false);
        await expect(loadAnnotations('r1')).resolves.toEqual([]);
    });
});

// Value: protects=two tabs on the same replay do not overwrite each other's notes, and a note deleted in one tab is not resurrected by a stale tab's next save; fails_when=saveAnnotations puts its array without merging the stored record, or the merge ignores tombstones; why_new=saves were whole-array overwrites; seam=none (stubbed indexedDB global); no_claim=true cross-tab concurrency in a browser
describe('saveAnnotations merges with the stored notes', () => {
    const note = (id: string): WorkingAnnotation => ({ _id: id, ref: 'R1.A.1', text: id });

    it('keeps notes another tab saved since this one loaded', async () => {
        stubIndexedDB({ auto: true });
        await saveAnnotations('r', [note('a')]);   // tab A
        await saveAnnotations('r', [note('b')]);   // tab B, loaded before A's note existed
        expect((await loadAnnotations('r')).map((n) => n._id)).toEqual(['a', 'b']);
    });

    it('takes this tab\'s copy of a note both tabs hold', async () => {
        stubIndexedDB({ auto: true });
        await saveAnnotations('r', [note('a')]);
        await saveAnnotations('r', [{ ...note('a'), text: 'edited' }]);
        expect(await loadAnnotations('r')).toEqual([{ ...note('a'), text: 'edited' }]);
    });

    it('does not resurrect a note deleted in another tab', async () => {
        stubIndexedDB({ auto: true });
        await saveAnnotations('r', [note('a'), note('b')]);
        await saveAnnotations('r', [note('a')], 0, ['b']);              // tab A deletes b
        await saveAnnotations('r', [note('a'), note('b'), note('c')]);   // stale tab B still holds b
        expect((await loadAnnotations('r')).map((n) => n._id)).toEqual(['a', 'c']);
    });
});
