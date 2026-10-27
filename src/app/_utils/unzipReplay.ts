import { Unzip, UnzipInflate, UnzipPassThrough } from 'fflate';

/** The replay inside an archive inflated past the caller's ceiling: inflation stopped there. */
export class ReplayTooLargeError extends Error {
    // `bytesSeen`: how much was inflated before it stopped (0 when the declared size refused it).
    constructor(readonly maxBytes: number, readonly bytesSeen = 0) {
        super(`Replay too large once unzipped. Max is ${Math.round(maxBytes / 1024 / 1024)} MB.`);
        this.name = 'ReplayTooLargeError';
    }
}

// Archive bytes fed to the inflater per step: at deflate's ~1032:1 ceiling, ~4 MB out per step.
const SLICE = 4 * 1024;

/**
 * Inflate the first `.swupgn` entry of a zip, and nothing else.
 *
 * A shared replay zip is untrusted: `unzip()` would inflate EVERY entry into memory before any
 * size check could run, and an entry's declared size can lie. This refuses an entry that
 * declares more than `maxBytes`, then feeds the archive in small slices so the inflater emits
 * bounded chunks (deflate expands at most ~1032:1), counting the bytes as they arrive: a zip
 * bomb stops just past `maxBytes` instead of filling the tab. One push of the whole archive
 * would inflate the whole entry before the first count. Resolves `null` when the archive has
 * no `.swupgn` entry.
 */
export function extractReplayFromZip(bytes: Uint8Array, maxBytes: number): Promise<Uint8Array | null> {
    return new Promise((resolve, reject) => {
        let picked = false;
        let settled = false;
        const settle = (fn: () => void) => { if (!settled) { settled = true; fn(); } };
        const unzipper = new Unzip((file) => {
            if (picked || !file.name.endsWith('.swupgn')) return; // never started: never inflated
            picked = true;
            if (typeof file.originalSize === 'number' && file.originalSize > maxBytes) {
                settle(() => reject(new ReplayTooLargeError(maxBytes)));
                return;
            }
            const chunks: Uint8Array[] = [];
            let total = 0;
            file.ondata = (err, chunk, final) => {
                if (settled) return;
                if (err) { settle(() => reject(err)); return; }
                total += chunk.length;
                if (total > maxBytes) {
                    file.terminate();
                    settle(() => reject(new ReplayTooLargeError(maxBytes, total)));
                    return;
                }
                chunks.push(chunk);
                if (final) {
                    const out = new Uint8Array(total);
                    let at = 0;
                    for (const c of chunks) { out.set(c, at); at += c.length; }
                    settle(() => resolve(out));
                }
            };
            file.start();
        });
        unzipper.register(UnzipInflate);
        unzipper.register(UnzipPassThrough);
        try {
            for (let at = 0; at < bytes.length && !settled; at += SLICE) {
                unzipper.push(bytes.subarray(at, at + SLICE), at + SLICE >= bytes.length);
            }
            if (bytes.length === 0) unzipper.push(bytes, true);
        } catch (err) {
            settle(() => reject(err));
            return;
        }
        // Entries are announced synchronously while the archive is pushed.
        if (!picked) settle(() => resolve(null));
    });
}
