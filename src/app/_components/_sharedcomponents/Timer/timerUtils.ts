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
    if (timeRemaining < (maxTime / 4)) return { timerColor: 'var(--selection-yellow)', timerOpacity: 1, timerWarning: true };
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
export const MAX_MAIN_TIME = 150_000; // 150 seconds in ms
