import {
    IPlayerReport,
    IPlayerReportLog,
    IPlayerReportPlayerContext,
    PlayerReportStatus,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';

export interface IReportListProps {
    status: PlayerReportStatus;
    reports: IPlayerReport[];
    loading: boolean;
    error: string | null;
    hasMore: boolean;
    onOpenReport: (report: IPlayerReport) => void;
    onLoadMore?: () => void;
}

export interface IReportDetailDialogProps {
    reportId: string | null;
    onClose: () => void;

    /** Called after anything that changes a report's list entry (claim, close, reopen, actions) */
    onReportChanged: () => void;

    /** Opens the player in the Find User tab */
    onOpenPlayerProfile: (playerId: string) => void;
}

export interface IReportPlayerPanelProps {
    roleLabel: string;
    context: IPlayerReportPlayerContext;
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
    targetPlayerId: string;
    targetUsername: string;

    /** Anonymous players have no account, so mod actions cannot be issued against them */
    targetIsAnonymous: boolean;

    /** Called with the server message after an action was issued */
    onActionApplied: (message: string) => void;
    onError: (message: string) => void;
}

export interface IReportClosePanelProps {
    report: IPlayerReport;
    onClosed: () => void;
    onReopened: () => void;
    onError: (message: string) => void;
}
