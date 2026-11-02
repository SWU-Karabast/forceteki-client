import { ServerApiService } from '@/app/_services/ServerApiService';
import {
    IPlayerReportPlayerContext,
    IPlayerSearchResult,
    modActionDefinitions,
    ModActionType,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { validateDiscordUsername } from '@/app/_validators/UsernameValidation/UserValidation';
import { generateResetUsername, isResetUsername } from '@/app/_utils/ModerationUtils';

export const MOD_ACTION_HELP_TEXT: Partial<Record<ModActionType, string>> = {
    [ModActionType.Rename]: 'The player must choose a new username themselves the next time they log in.',
    [ModActionType.ChangeUsername]: 'Sets the username directly. Resolves a pending Force Rename and does not lift Block Username Changes.',
    [ModActionType.UsernameChangesBlocked]: 'The player can no longer change their own username and must request changes from moderators.',
};

export const FORCE_RENAME_BLOCKED_MESSAGE = 'Force Rename is unavailable while username changes are blocked. Use Change Username instead.';

/** The order actions are offered in, wherever a moderator picks one */
export const MOD_ACTION_ORDER: ModActionType[] = [
    ModActionType.Warning,
    ModActionType.Mute,
    ModActionType.Rename,
    ModActionType.ChangeUsername,
    ModActionType.UsernameChangesBlocked,
    ModActionType.ReportingDisabled,
];

/** One-click mute lengths, in days */
export const MUTE_DURATION_PRESETS_DAYS = [7, 14, 28];

/**
 * Starting points for the note of an action, by action type; moderators edit them freely. Actions whose note is
 * optional get none, since a generic text would only repeat the name of the action.
 */
export const MOD_ACTION_NOTE_TEMPLATES: Partial<Record<ModActionType, string[]>> = {
    [ModActionType.Warning]: ['Insulting the opponent in chat.', 'Spamming the chat.'],
    [ModActionType.Mute]: ['Insulting the opponent in chat.', 'Spamming the chat.'],
    [ModActionType.ReportingDisabled]: ['Repeated false reports.'],
    [ModActionType.UsernameChangesBlocked]: ['Repeatedly choosing offensive usernames.'],
};

/** What the action forms need to know about the player an action would target */
export interface IModActionTarget {
    playerId: string;
    username: string;
    isMuted: boolean;
    hasPendingRename: boolean;
    reportingDisabled: boolean;
    usernameChangesBlocked: boolean;

    /** Players without an account cannot be targeted */
    isAnonymous?: boolean;
}

export const modActionTargetFromPlayer = (player: IPlayerSearchResult): IModActionTarget => ({
    playerId: player.id,
    username: player.username,
    isMuted: player.isMuted,
    hasPendingRename: !!player.activeRename,
    reportingDisabled: !!player.activeReportingDisabledId,
    usernameChangesBlocked: !!player.activeUsernameChangesBlockedId,
});

export const modActionTargetFromReportContext = (context: IPlayerReportPlayerContext): IModActionTarget => ({
    playerId: context.playerId,
    username: context.username,
    isMuted: context.isMuted,
    hasPendingRename: !!context.activeRename,
    reportingDisabled: !!context.activeReportingDisabledId,
    usernameChangesBlocked: !!context.activeUsernameChangesBlockedId,
    // Players without a profile were playing without an account
    isAnonymous: !context.createdAt,
});

/**
 * Why an action cannot be issued against the player right now, or null if it can. Mirrors the server's refusals so
 * the moderator sees the reason before submitting.
 */
export const getModActionUnavailableReason = (actionType: ModActionType, target: IModActionTarget): string | null => {
    if (target.isAnonymous) {
        return `${target.username} is playing without an account, so mod actions cannot be issued against them.`;
    }
    switch (actionType) {
        case ModActionType.Mute:
            return target.isMuted ? `${target.username} is already muted.` : null;
        case ModActionType.Rename:
            if (target.usernameChangesBlocked) {
                return FORCE_RENAME_BLOCKED_MESSAGE;
            }
            return target.hasPendingRename ? `${target.username} already has a pending Force Rename.` : null;
        case ModActionType.ReportingDisabled:
            return target.reportingDisabled ? `Reporting is already disabled for ${target.username}.` : null;
        case ModActionType.UsernameChangesBlocked:
            return target.usernameChangesBlocked ? `Username changes are already blocked for ${target.username}.` : null;
        case ModActionType.Warning:
        case ModActionType.ChangeUsername:
            return null;
        default: {
            const unhandled: never = actionType;
            return unhandled;
        }
    }
};

/** What an action will do, for its confirmation: "mute Alice for 7 days" */
export const describeModActionRequest = (
    actionType: ModActionType,
    username: string,
    options: { durationDays?: number; newUsername?: string; resetName?: string } = {}
): string => {
    switch (actionType) {
        case ModActionType.Mute:
            return `mute ${username} for ${options.durationDays} day${options.durationDays === 1 ? '' : 's'}`;
        case ModActionType.Warning:
            return `issue a warning to ${username}`;
        case ModActionType.Rename:
            return `force ${username} to rename`;
        case ModActionType.ReportingDisabled:
            return `disable reporting for ${username}`;
        case ModActionType.UsernameChangesBlocked:
            return `block ${username} from changing their username${options.resetName ? ` and reset it to ${options.resetName}` : ''}`;
        case ModActionType.ChangeUsername:
            return `change the username of ${username} to ${options.newUsername?.trim()}`;
        default: {
            const unhandled: never = actionType;
            return unhandled;
        }
    }
};

/** Validation message for a moderator-supplied username, or null when it can be submitted. */
export const getNewUsernameError = (newUsername: string, currentUsername?: string): string | null => {
    const trimmed = newUsername.trim();
    if (!trimmed) {
        return null;
    }
    return validateDiscordUsername(trimmed)
        ?? (trimmed === currentUsername ? 'The player already has this username.' : null);
};

/**
 * The reset name to apply alongside a UsernameChangesBlocked action, or undefined when none should be applied.
 * A player who already has a reset name keeps it instead of being given a second one.
 */
export const pickResetUsername = (actionType: ModActionType, resetRequested: boolean, currentUsername: string): string | undefined =>
    modActionDefinitions[actionType].supportsUsernameReset && resetRequested && !isResetUsername(currentUsername)
        ? generateResetUsername()
        : undefined;

export interface IModActionRequest {
    playerId: string;
    currentUsername: string;
    actionType: ModActionType;
    note: string;
    durationDays?: number;

    /** Required for ChangeUsername actions */
    newUsername?: string;

    /** The user asked to reset the username together with the action (UsernameChangesBlocked only) */
    resetRequested?: boolean;

    /** From {@link pickResetUsername}, decided before confirmation so the dialog can name it */
    resetName?: string;

    /** The report ticket the action is issued from, if any */
    reportId?: string;
}

export interface IModActionResult {

    /** Everything requested was applied */
    success: boolean;

    /**
     * The action itself was applied, even if a follow-up step failed (e.g. Block Username Changes applied but
     * the username reset rejected). Callers must refresh their view whenever this is true.
     */
    mainActionApplied: boolean;
    message: string;
}

/**
 * Submits a mod action. A requested username reset is a separate ChangeUsername action submitted only
 * after the main action succeeded; the result message covers both.
 */
export const submitModActionAsync = async (request: IModActionRequest): Promise<IModActionResult> => {
    const definition = modActionDefinitions[request.actionType];
    const result = await ServerApiService.submitModActionAsync(
        request.playerId,
        request.actionType,
        request.note,
        definition.requiresDuration ? request.durationDays : undefined,
        {
            newUsername: definition.requiresNewUsername ? request.newUsername?.trim() : undefined,
            reportId: request.reportId,
        },
    );

    if (!result.success || !definition.supportsUsernameReset || !request.resetRequested) {
        return { success: result.success, mainActionApplied: result.success, message: result.message };
    }

    if (!request.resetName) {
        return {
            success: true,
            mainActionApplied: true,
            message: `${result.message} The username is already '${request.currentUsername}', so no username update was needed.`,
        };
    }

    try {
        const resetResult = await ServerApiService.submitModActionAsync(
            request.playerId,
            ModActionType.ChangeUsername,
            request.note,
            undefined,
            { newUsername: request.resetName, reportId: request.reportId },
        );
        const message = `${result.message} ${resetResult.message}`;
        return resetResult.success
            ? { success: true, mainActionApplied: true, message }
            : {
                success: false,
                mainActionApplied: true,
                message: `${message} The username-change restriction remains in place. Use Change Username to retry if needed.`,
            };
    } catch (error) {
        const failure = error instanceof Error ? error.message : 'Failed to update the username';
        return {
            success: false,
            mainActionApplied: true,
            message: `${result.message} The username update failed: ${failure}. The username-change restriction remains in place. Use Change Username to retry.`,
        };
    }
};
