/**
 * Resolve a deep-link frame reference (`?t=`, `?from=`, `?to=`) to a frame index in the
 * repaired event stream, or null when it names nothing.
 *
 * A `seq` ("R4.A.8u") is looked up in `events`, so the link lands on the same moment even
 * though the reader drops inert records. An all-digits value is a legacy frame index, taken
 * at face value. Any other number is floored (`1.5` -> 1), since a fractional index names no
 * frame. Range clamping is the caller's job: it knows the frame count.
 */
export function resolveFrameRef(events: readonly { seq: string }[], value: string | number | null | undefined): number | null {
    if (value == null || value === '') return null;
    if (typeof value === 'string' && !/^\d+$/.test(value)) {
        const i = events.findIndex((e) => e.seq === value);
        if (i >= 0) return i;
    }
    const n = Math.floor(Number(value));
    return Number.isNaN(n) ? null : n;
}

/**
 * Whether a link's moment names records of this stream: every `t`/`from`/`to` it carries is a
 * `seq` the stream has. The download with notes is reserialized, so it no longer hashes to the
 * id the link names, yet its seqs are the same game's. A bare frame index proves nothing (any
 * file has a frame 3), so a link that carries one is matched by its id alone.
 */
export function linkRefsFound(events: readonly { seq: string }[], refs: readonly (string | null | undefined)[]): boolean {
    const given = refs.filter((r): r is string => r != null && r !== '');
    if (!given.length || given.some((r) => /^\d+$/.test(r))) return false;
    const seqs = new Set(events.map((e) => e.seq));
    return given.every((r) => seqs.has(r));
}
