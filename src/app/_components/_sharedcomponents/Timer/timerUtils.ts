export const formatMilliseconds = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString()}:${seconds.toString().padStart(2, '0')}`;
}

export const getTimerColor = ({
    timeRemaining,
    maxTime,
    hasLowOpacity
}: { 
    timeRemaining: number, maxTime: number, hasLowOpacity?: boolean 
}): {
    color: 'white' | 'red' | 'orange';
    themeColor: 'inherit' | 'warning' | 'error',
} => {
    if (hasLowOpacity) return { color: 'white', themeColor: 'inherit' };
    if (timeRemaining > (maxTime / 3)) return { color: 'white', themeColor: 'inherit' };
    if (timeRemaining > (maxTime / 6)) return { color: 'orange', themeColor: 'warning' };
    return { color: 'red', themeColor: 'error' };
}

export const millisecondsToSeconds = (ms: number) => ms / 1000;
export const secondsToMilliseconds = (s: number) => s * 1000;

export const MAX_TURN_TIME = 20_000; // 20 seconds in ms
export const MAX_MAIN_TIME = 150_000; // 150 seconds in ms
