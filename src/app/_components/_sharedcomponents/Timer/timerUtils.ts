export const formatMilliseconds = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString()}:${seconds.toString().padStart(2, '0')}`;
}

export const getTimerColor = ({
    timeRemaining,
    maxTime,
    activeTurn,
}: {
    timeRemaining: number, maxTime: number, activeTurn?: 'player' | 'opponent', 
}): {
    timerColor: string;
    cssColor?: string;
    timerOpacity: number;
    timerWarning?: boolean;
} => {
    if (activeTurn === 'opponent') return { timerColor: 'var(--initiative-red)', timerOpacity: 0.5 };
    if (timeRemaining < (maxTime / 4)) return { timerColor: 'var(--initiative-blue)', timerOpacity: 0.5, timerWarning: true };
    const cssColor = activeTurn === 'player'
        ? 'var(--initiative-blue)'
        : activeTurn === 'opponent'
            ? 'var(--initiative-red)'
            : undefined;
    return { timerColor: cssColor ?? 'white', cssColor, timerOpacity: .5 };
}

export const millisecondsToSeconds = (ms: number) => ms / 1000;
export const secondsToMilliseconds = (s: number) => s * 1000;

export const MAX_TURN_TIME = 20_000; // 20 seconds in ms
export const MAX_MAIN_TIME = 120_000; // 120 seconds in ms

/** Main time a player was given back at the end of a round, as the server sends it (`mainTimeGrant`). */
export interface IMainTimeGrant {

    /** The round whose end gave the time. */
    round: number;

    /** Whole seconds added, after the cap on main time; 0 when the main time was already full. */
    seconds: number;
}

/** A grant of main time being shown. */
export interface IMainTimeGrantAnimation {

    /** The round whose end gave the time. Differs for every grant, so it serves as the animation's key. */
    round: number;
    seconds: number;

    /** Main time before the grant, in ms. */
    fromMs: number;

    /** Main time after the grant, in ms. */
    toMs: number;
}

/** How long a grant is shown for, in ms. */
export const MAIN_TIME_GRANT_ANIMATION_MS = 2_400;

/** How long the main time label takes to count up to its new value, in ms. */
export const MAIN_TIME_GRANT_COUNT_UP_MS = 800;

export const MAIN_TIME_GRANT_COLOR = 'var(--selection-green)';
