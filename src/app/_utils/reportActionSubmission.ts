import {
    PlayerReportOutcome,
    PlayerReportStatus,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { ServerApiService } from '@/app/_services/ServerApiService';
import { IModActionResult } from '@/app/_utils/modActionSubmission';
import { getOutcomeOption } from '@/app/_utils/playerReportUtils';

/** Mirrors the server's limit for closing notes; the action note is reused for it */
const MAX_CLOSING_NOTE_LENGTH = 2000;

export interface IReportActionOutcome {

    /** The mod action is in place (the ticket may still be open if closing it failed) */
    actionApplied: boolean;
    ticketClosed: boolean;

    /** Something went wrong, even if the action itself was applied */
    isWarning: boolean;
    message: string;
}

/**
 * Outcomes a ticket can be closed with together with a mod action. Action Taken is the default; False Report is
 * for an action against the reporter whose report was the problem, so it counts towards their recent false reports.
 */
export const ACTION_CLOSE_OUTCOMES: PlayerReportOutcome[] = [PlayerReportOutcome.ActionTaken, PlayerReportOutcome.FalseReport];

/**
 * After a mod action was submitted from a report: closes the ticket with the given outcome if asked to, and
 * describes the result in one message.
 */
export const finishReportActionAsync = async (
    reportId: string,
    result: IModActionResult,
    note: string,
    closeTicket: boolean,
    outcome: PlayerReportOutcome = PlayerReportOutcome.ActionTaken,
): Promise<IReportActionOutcome> => {
    if (!result.mainActionApplied) {
        return { actionApplied: false, ticketClosed: false, isWarning: true, message: result.message };
    }
    if (!closeTicket) {
        return { actionApplied: true, ticketClosed: false, isWarning: !result.success, message: result.message };
    }

    try {
        await ServerApiService.updatePlayerReportStatusAsync(reportId, {
            status: PlayerReportStatus.Closed,
            outcome,
            closingNote: note.slice(0, MAX_CLOSING_NOTE_LENGTH) || undefined,
        });
        return { actionApplied: true, ticketClosed: true, isWarning: !result.success, message: `${result.message} Ticket closed as ${getOutcomeOption(outcome)?.label ?? outcome}.` };
    } catch (error) {
        const failure = error instanceof Error ? error.message : 'unknown error';
        return { actionApplied: true, ticketClosed: false, isWarning: true, message: `${result.message} The ticket could not be closed: ${failure}` };
    }
};
