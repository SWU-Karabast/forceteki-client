import { REPORT_TYPES } from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PlayerReportDialog';
import {
    IModActionResponse,
    ModActionType,
    PlayerReportOutcome,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';

/**
 * Mirrors PlayerReportService.LogRetentionDays on the server. The weekly cleanup deletes the logs within a week
 * after that.
 */
export const LOG_RETENTION_DAYS = 30;

/** Mirrors PlayerReportService.RecentFalseReportDays: false reports within this window are counted on a report */
export const RECENT_FALSE_REPORT_DAYS = 30;

/** How often the open-report counter refreshes */
export const OPEN_REPORT_COUNT_POLL_MS = 60_000;

/** Reports loaded per page of the report list */
export const REPORT_PAGE_SIZE = 25;

export const getOffenseLabel = (offense: string): string =>
    REPORT_TYPES.find((config) => config.type === offense)?.label ?? offense;

const MATCH_TYPE_LABELS: Record<string, string> = {
    publicLobby: 'Public Lobby',
    privateLobby: 'Private Lobby',
    quick: 'Quick Match',
};

export const getMatchTypeLabel = (matchType: string): string => MATCH_TYPE_LABELS[matchType] ?? matchType;

export const getGameFormatLabel = (gameFormat: string): string =>
    gameFormat ? gameFormat.charAt(0).toUpperCase() + gameFormat.slice(1) : '';

export interface IReportOutcomeOption {
    value: PlayerReportOutcome;
    label: string;
    color: string;
}

/**
 * Open tickets are what the red counter on the mod tools counts, so they carry the same red. Red is kept for that:
 * a closed ticket's outcome is settled and must not read as something that needs attention.
 */
export const OPEN_TICKET_COLOR = '#ff6b6b';
export const OPEN_TICKET_ACCENT = '#C40000';
export const OPEN_TICKET_ROW_BACKGROUND = 'rgba(196, 0, 0, 0.12)';

export const REPORT_OUTCOME_OPTIONS: IReportOutcomeOption[] = [
    { value: PlayerReportOutcome.ActionTaken, label: 'Action Taken', color: '#81c784' },
    { value: PlayerReportOutcome.NoAction, label: 'No Action', color: '#BDBDBD' },
    { value: PlayerReportOutcome.FalseReport, label: 'False Report', color: '#ffb74d' },
    { value: PlayerReportOutcome.TimerAbuse, label: 'Timer Abuse', color: '#4fc3f7' },
];

export const getOutcomeOption = (outcome?: string): IReportOutcomeOption | undefined =>
    REPORT_OUTCOME_OPTIONS.find((option) => option.value === outcome);

/** Short name of what a mod action did, e.g. "Mute 7 days", "Warning", "Force Rename" */
export const describeModAction = (action: IModActionResponse): string => {
    switch (action.actionType) {
        case ModActionType.Mute:
            return `Mute ${action.durationDays} day${action.durationDays === 1 ? '' : 's'}`;
        case ModActionType.Warning:
            return 'Warning';
        case ModActionType.Rename:
            return 'Force Rename';
        case ModActionType.ReportingDisabled:
            return 'Reporting Disabled';
        case ModActionType.UsernameChangesBlocked:
            return 'Username Changes Blocked';
        case ModActionType.ChangeUsername:
            return 'Username Changed';
        default: {
            const unhandled: never = action.actionType;
            return unhandled;
        }
    }
};

const JUST_NOW = 'just now';

/** Compact "time since" for the report list: "just now", "12 min", "3 h", "2 d" */
export const formatTimeAgo = (dateStr: string, now: number = Date.now()): string => {
    const diffMs = now - new Date(dateStr).getTime();
    if (Number.isNaN(diffMs)) {
        return '';
    }

    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) {
        return JUST_NOW;
    }
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours} h`;
    }
    return `${Math.floor(hours / 24)} d`;
};

/** "time since" as a phrase: "just now", "12 min ago" */
export const formatTimeAgoPhrase = (dateStr: string, now: number = Date.now()): string => {
    const ago = formatTimeAgo(dateStr, now);
    return ago && ago !== JUST_NOW ? `${ago} ago` : ago;
};

/** Time of day for a log line, e.g. "21:05:12" */
export const formatLogTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime())
        ? ''
        : date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};
