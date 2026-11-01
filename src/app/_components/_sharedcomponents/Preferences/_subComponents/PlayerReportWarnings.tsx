import type { ReactNode } from 'react';
import { PlayerReportType } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';

export interface IPlayerReportWarningRule {
    id: string;
    keywords: readonly string[];
    // Report types the warning applies to. Omit to apply to every report type.
    reportTypes?: readonly PlayerReportType[];
    message: ReactNode;
}

export const PLAYER_REPORT_WARNING_RULES: readonly IPlayerReportWarningRule[] = [
    {
        id: 'matchmaking-deck-preference',
        keywords: ['competitive', 'casual', 'queue'],
        reportTypes: [PlayerReportType.AbusingMechanics, PlayerReportType.Other],
        message: (
            <>
                It looks like this report might be about a player bringing an inappropriate deck for Competitive or Casual matchmaking. If so, please note that this is <strong>not</strong> a violation of our rules and action will <strong>not</strong> be taken.
            </>
        ),
    },
    {
        id: 'undo-denied',
        keywords: ['undo'],
        reportTypes: [PlayerReportType.AbusingMechanics, PlayerReportType.Other],
        message: (
            <>
                It looks like this report might be about an opponent denying an undo request. If so, please note that this is <strong>not</strong> a violation of our rules and action will <strong>not</strong> be taken.
            </>
        ),
    },
];

export function getPlayerReportWarnings(
    description: string,
    reportType: PlayerReportType | null
): IPlayerReportWarningRule[] {
    const normalizedDescription = description.toLowerCase();
    return PLAYER_REPORT_WARNING_RULES.filter((rule) =>
        (!rule.reportTypes || (reportType !== null && rule.reportTypes.includes(reportType))) &&
        rule.keywords.some((keyword) => normalizedDescription.includes(keyword.toLowerCase()))
    );
}
