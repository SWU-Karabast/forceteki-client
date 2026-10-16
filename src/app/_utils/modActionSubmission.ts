import { ServerApiService } from '@/app/_services/ServerApiService';
import { modActionDefinitions, ModActionType } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { validateDiscordUsername } from '@/app/_validators/UsernameValidation/UserValidation';
import { generateResetUsername, isResetUsername } from '@/app/_utils/ModerationUtils';

export const MOD_ACTION_HELP_TEXT: Partial<Record<ModActionType, string>> = {
    [ModActionType.Rename]: 'The player must choose a new username themselves the next time they log in.',
    [ModActionType.ChangeUsername]: 'Sets the username directly. Resolves a pending Force Rename and does not lift Block Username Changes.',
    [ModActionType.UsernameChangesBlocked]: 'The player can no longer change their own username and must request changes from moderators.',
};

export const FORCE_RENAME_BLOCKED_MESSAGE = 'Force Rename is unavailable while username changes are blocked. Use Change Username instead.';

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

/**
 * Submits a mod action. A requested username reset is a separate ChangeUsername action submitted only
 * after the main action succeeded; the result message covers both.
 */
export const submitModActionAsync = async (request: IModActionRequest): Promise<{ success: boolean; message: string }> => {
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
        return result;
    }

    if (!request.resetName) {
        return { success: true, message: `${result.message} The username is already '${request.currentUsername}', so no username update was needed.` };
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
            ? { success: true, message }
            : { success: false, message: `${message} The username-change restriction remains in place. Use Change Username to retry if needed.` };
    } catch (error) {
        const failure = error instanceof Error ? error.message : 'Failed to update the username';
        return {
            success: false,
            message: `${result.message} The username update failed: ${failure}. The username-change restriction remains in place. Use Change Username to retry.`,
        };
    }
};
