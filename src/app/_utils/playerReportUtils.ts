import { REPORT_TYPES } from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PlayerReportDialog';
import {
    IModActionResponse,
    IPlayerReportPlayerContext,
    ModActionType,
    modActionDefinitions,
    PlayerReportOutcome,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { FORCE_RENAME_BLOCKED_MESSAGE } from '@/app/_utils/modActionSubmission';

/** Days for the "Mute 1 week" quick action */
export const ONE_WEEK_IN_DAYS = 7;

/** Mirrors PlayerReportService.LogRetentionDays on the server */
export const LOG_RETENTION_DAYS = 30;

/** A reporter with at least this many reports closed as false reports is flagged in the report list */
export const FREQUENT_FALSE_REPORTER_THRESHOLD = 2;

/** How often the open-report counter refreshes */
export const OPEN_REPORT_COUNT_POLL_MS = 60_000;

export const getOffenseLabel = (offense: string): string =>
    REPORT_TYPES.find((config) => config.type === offense)?.label ?? offense;

const MATCH_TYPE_LABELS: Record<string, string> = {
    publicLobby: 'Public lobby',
    privateLobby: 'Private lobby',
    quick: 'Quick match',
};

export const getMatchTypeLabel = (matchType: string): string => MATCH_TYPE_LABELS[matchType] ?? matchType;

export const getGameFormatLabel = (gameFormat: string): string =>
    gameFormat ? gameFormat.charAt(0).toUpperCase() + gameFormat.slice(1) : '';

export interface IReportOutcomeOption {
    value: PlayerReportOutcome;
    label: string;
    color: string;
}

export const REPORT_OUTCOME_OPTIONS: IReportOutcomeOption[] = [
    { value: PlayerReportOutcome.Punished, label: 'Punished', color: '#ef5350' },
    { value: PlayerReportOutcome.NoAction, label: 'No action', color: '#9e9e9e' },
    { value: PlayerReportOutcome.FalseReport, label: 'False report', color: '#ffb74d' },
    { value: PlayerReportOutcome.TimerAbuse, label: 'Timer abuse', color: '#4fc3f7' },
];

export const getOutcomeOption = (outcome?: string): IReportOutcomeOption | undefined =>
    REPORT_OUTCOME_OPTIONS.find((option) => option.value === outcome);

export enum ReportQuickActionKey {
    MuteOneWeek = 'muteOneWeek',
    MuteCustom = 'muteCustom',
    Warning = 'warning',
    ForceRename = 'forceRename',
    DisableReporting = 'disableReporting',
    BlockUsernameChanges = 'blockUsernameChanges',
    ChangeUsername = 'changeUsername',
}

export interface IReportQuickAction {
    key: ReportQuickActionKey;
    label: string;
    actionType: ModActionType;
    durationDays?: number;
}

export const REPORT_QUICK_ACTIONS: IReportQuickAction[] = [
    { key: ReportQuickActionKey.MuteOneWeek, label: 'Mute 1 week', actionType: ModActionType.Mute, durationDays: ONE_WEEK_IN_DAYS },
    { key: ReportQuickActionKey.MuteCustom, label: 'Mute…', actionType: ModActionType.Mute },
    { key: ReportQuickActionKey.Warning, label: 'Warning', actionType: ModActionType.Warning },
    { key: ReportQuickActionKey.ForceRename, label: 'Force rename', actionType: ModActionType.Rename },
    { key: ReportQuickActionKey.DisableReporting, label: modActionDefinitions[ModActionType.ReportingDisabled].label, actionType: ModActionType.ReportingDisabled },
    { key: ReportQuickActionKey.BlockUsernameChanges, label: modActionDefinitions[ModActionType.UsernameChangesBlocked].label, actionType: ModActionType.UsernameChangesBlocked },
    { key: ReportQuickActionKey.ChangeUsername, label: modActionDefinitions[ModActionType.ChangeUsername].label, actionType: ModActionType.ChangeUsername },
];

/**
 * Why a quick action cannot be issued against the player right now, or null if it can. Mirrors the
 * server's refusals so the moderator sees the reason before submitting.
 */
export const getQuickActionUnavailableReason = (action: IReportQuickAction, target: IPlayerReportPlayerContext): string | null => {
    switch (action.actionType) {
        case ModActionType.Mute:
            return target.isMuted ? `${target.username} is already muted.` : null;
        case ModActionType.Rename:
            if (target.activeUsernameChangesBlockedId) {
                return FORCE_RENAME_BLOCKED_MESSAGE;
            }
            return target.activeRename ? `${target.username} already has a pending force rename.` : null;
        case ModActionType.ReportingDisabled:
            return target.activeReportingDisabledId ? `Reporting is already disabled for ${target.username}.` : null;
        case ModActionType.UsernameChangesBlocked:
            return target.activeUsernameChangesBlockedId ? `Username changes are already blocked for ${target.username}.` : null;
        case ModActionType.Warning:
        case ModActionType.ChangeUsername:
            return null;
        default: {
            const unhandled: never = action.actionType;
            return unhandled;
        }
    }
};

/** Short name of what a mod action did, e.g. "Mute 7 days", "Warning", "Force rename" */
export const describeModAction = (action: IModActionResponse): string => {
    switch (action.actionType) {
        case ModActionType.Mute:
            return `Mute ${action.durationDays} day${action.durationDays === 1 ? '' : 's'}`;
        case ModActionType.Warning:
            return 'Warning';
        case ModActionType.Rename:
            return 'Force rename';
        case ModActionType.ReportingDisabled:
            return 'Reporting disabled';
        case ModActionType.UsernameChangesBlocked:
            return 'Username changes blocked';
        case ModActionType.ChangeUsername:
            return 'Username changed';
        default: {
            const unhandled: never = action.actionType;
            return unhandled;
        }
    }
};

/**
 * Starting points for the case description of a mod action; moderators edit them freely. Only reasons
 * for a punishment belong here: closing without one (false report, no violation) is done through the
 * close panel and should stay a deliberate last step, not a one-click suggestion.
 */
export const REPORT_COMMENT_TEMPLATES: string[] = [
    'Insulting the opponent in chat.',
    'Offensive username.',
];

/** Compact "time since" for the report list: "just now", "12 min", "3 h", "2 d" */
export const formatTimeAgo = (dateStr: string, now: number = Date.now()): string => {
    const diffMs = now - new Date(dateStr).getTime();
    if (Number.isNaN(diffMs)) {
        return '';
    }

    const minutes = Math.floor(diffMs / 60_000);
    if (minutes < 1) {
        return 'just now';
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

/** Time of day for a log line, e.g. "21:05:12" */
export const formatLogTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime())
        ? ''
        : date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};
