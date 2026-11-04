import {
    IPlayerReport,
    IPlayerReportLog,
    IPlayerReportPlayerContext,
    PlayerReportListSort,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import type { ReportQuickAction } from './ReportQuickActionDialog';

/** Offense filter value for every offense */
export const ALL_OFFENSES = 'all';

export interface IReportListFilters {
    openOnly: boolean;

    /** Part of a username, as typed */
    search: string;

    /** A PlayerReportType, or ALL_OFFENSES */
    offense: string;

    /** Chosen by clicking the Received column; null for the default of the current filter (see effectiveReportSort) */
    sort: PlayerReportListSort | null;
}

/** The open queue is worked through oldest first; the full history reads newest first */
export const effectiveReportSort = (filters: Pick<IReportListFilters, 'openOnly' | 'sort'>): PlayerReportListSort =>
    filters.sort ?? (filters.openOnly ? PlayerReportListSort.OldestFirst : PlayerReportListSort.NewestFirst);

export interface IReportListProps {

    /** The pages loaded so far, newest first */
    reports: IPlayerReport[];

    /** Reports matching the filters over all pages */
    total: number;
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    filters: IReportListFilters;
    onFiltersChange: (filters: IReportListFilters) => void;
    onOpenReport: (report: IPlayerReport) => void;

    /** Closes an open report as No Action without opening it */
    onQuickClose: (report: IPlayerReport) => void;

    /** Starts a Warning or a one-week Mute against the reported player of an open report */
    onQuickAction: (report: IPlayerReport, actionType: ReportQuickAction) => void;
    onLoadMore: () => void;
}

export interface IReportDetailDialogProps {
    reportId: string | null;
    onClose: () => void;

    /** Called after anything that changes a report's list entry (close, reopen, actions) */
    onReportChanged: () => void;

    /** Opens the player in the Find User tab */
    onOpenPlayerProfile: (playerId: string) => void;
}

export interface IReportPlayerPanelProps {
    roleLabel: string;
    context: IPlayerReportPlayerContext;

    /** For the reporter: false reports they filed in the RECENT_FALSE_REPORT_DAYS before this report */
    recentFalseReportCount?: number;
    usernameAtReport: string;
    selected: boolean;
    onSelect: () => void;
    onOpenProfile: () => void;
}

export interface IReportLogViewProps {
    report: IPlayerReport;
    chatLog: IPlayerReportLog | null;
    gameLog: IPlayerReportLog | null;
    highlightPlayerId: string;
}

export interface IReportPlayerHistoryProps {
    context: IPlayerReportPlayerContext;

    /** The report being viewed; its own entries are marked */
    currentReportId: string;
}

export interface IReportActionPanelProps {
    reportId: string;

    /** The selected player; anonymous players (no profile) cannot be targeted by mod actions */
    target: IPlayerReportPlayerContext;

    /** The target filed the report; closing then defaults to False Report instead of Action Taken */
    targetIsReporter: boolean;

    /** Called with the server message after an action was issued; `isWarning` when a follow-up step failed */
    onActionApplied: (message: string, isWarning?: boolean) => Promise<void> | void;

    /** The action was issued and the ticket closed along with it */
    onTicketClosed: (message: string, isWarning?: boolean) => void;
    onError: (message: string) => void;
}

export interface IReportClosePanelProps {
    report: IPlayerReport;
    onClosed: () => void;
    onReopened: () => void;

    /** Closing or reopening failed (e.g. the ticket changed meanwhile); the dialog reloads the ticket */
    onError: (message: string) => void;
}
