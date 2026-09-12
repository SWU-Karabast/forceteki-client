import { SPEEDS } from './replayTiming';

/** What the transport's chevrons and arrow keys step by. */
export type StepBy = 'beat' | 'record';

export interface ReplayPrefs {
    speed: number;
    stepBy: StepBy;
    animate: boolean;
}

export const DEFAULT_PREFS: ReplayPrefs = { speed: 1, stepBy: 'beat', animate: true };

export const PREFS_KEY = 'replay:playback';

/** Tolerant per-field: a corrupt or partly-wrong blob loses only the fields it got
 *  wrong, never the whole preference. */
export function readPrefs(raw: string | null): ReplayPrefs {
    if (raw == null) return { ...DEFAULT_PREFS };
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return { ...DEFAULT_PREFS };
    }
    if (typeof parsed !== 'object' || parsed === null) return { ...DEFAULT_PREFS };
    const p = parsed as Record<string, unknown>;
    const speed = typeof p.speed === 'number' && (SPEEDS as readonly number[]).includes(p.speed) ? p.speed : DEFAULT_PREFS.speed;
    const stepBy = p.stepBy === 'beat' || p.stepBy === 'record' ? p.stepBy : DEFAULT_PREFS.stepBy;
    const animate = typeof p.animate === 'boolean' ? p.animate : DEFAULT_PREFS.animate;
    return { speed, stepBy, animate };
}

export function writePrefs(p: ReplayPrefs): string {
    return JSON.stringify(p);
}
