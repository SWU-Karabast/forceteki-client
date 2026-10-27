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
