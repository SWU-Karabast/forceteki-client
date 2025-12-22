export enum TimeRemainingStatus {
    NoAlert = 'NoAlert',
    Warning = 'Warning',
    Danger = 'Danger',
    OutOfTime = 'OutOfTime',
}

export const MAX_TURN_TIME = 30_000; // 30 seconds in ms
export const MAX_MAIN_TIME = 150_000; // 150 seconds in ms
