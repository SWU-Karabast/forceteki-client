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
 * Whether a link's moment belongs to this file when its bytes no longer hash to the link's id
 * (the download with notes is reserialized): the link names the file's `GameId` (`g`) and every
 * `t`/`from`/`to` it carries is a `seq` the stream has. Seqs alone prove nothing -- every game has
 * an `R1.A.1` -- and neither does a bare frame index, so a link without `g` or with an index is
 * matched by its id alone.
 */
export function linkRefsFound(
    gameIdParam: string | null | undefined, header: { gameId?: unknown },
    events: readonly { seq: string }[], refs: readonly (string | null | undefined)[],
): boolean {
    if (!gameIdParam || header.gameId !== gameIdParam) return false;
    const given = refs.filter((r): r is string => r != null && r !== '');
    if (!given.length || given.some((r) => /^\d+$/.test(r))) return false;
    const seqs = new Set(events.map((e) => e.seq));
    return given.every((r) => seqs.has(r));
}
