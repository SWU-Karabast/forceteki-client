import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, CircularProgress, Dialog, Divider, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
    IPlayerReportDetailResponse,
    PlayerReportStatus,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { ServerApiService } from '@/app/_services/ServerApiService';
import { useDateFormat } from '@/app/_hooks/useDateFormat';
import { formatDate, formatUsernameTransition, getActionLabel } from '@/app/_utils/ModerationUtils';
import { formatTimeAgoPhrase, getGameFormatLabel, getMatchTypeLabel, getOffenseLabel } from '@/app/_utils/playerReportUtils';
import ReportActionPanel from './ReportActionPanel';
import ReportClosePanel from './ReportClosePanel';
import ReportLogView from './ReportLogView';
import ReportPlayerHistory from './ReportPlayerHistory';
import ReportPlayerPanel from './ReportPlayerPanel';
import { IReportDetailDialogProps } from './reportTypes';

/**
 * A single report ticket: both players, the reason, chat and game log, mod actions and closing.
 */
const ReportDetailDialog: React.FC<IReportDetailDialogProps> = ({ reportId, onClose, onReportChanged, onOpenPlayerProfile }) => {
    const dateFormat = useDateFormat();
    const [detail, setDetail] = useState<IPlayerReportDetailResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

    // Read through a ref so a parent that passes a new callback each render does not trigger reloads
    const onReportChangedRef = useRef(onReportChanged);
    useEffect(() => {
        onReportChangedRef.current = onReportChanged;
    }, [onReportChanged]);

    // Feedback is shown at the top while the action and close panels are at the bottom of a scrolling body,
    // so a new message scrolls it into view
    const bodyRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (error || info) {
            bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [error, info]);

    // Only the newest load may update the dialog; an older one (another report, an earlier reload) is dropped
    const latestLoadRef = useRef(0);

    // The report the dialog shows now. Handlers awaiting a request check it afterwards, since the moderator may
    // have switched to another report meanwhile and their closure still refers to the old one.
    const currentReportIdRef = useRef(reportId);
    currentReportIdRef.current = reportId;
    const isShowing = (id: string | null) => !!id && id === currentReportIdRef.current;

    /** @returns false if the report could not be loaded (or the load was superseded) */
    const loadAsync = useCallback(async (): Promise<boolean> => {
        // A handler from a report that is no longer shown must not reload (and so cancel) the current one
        if (!reportId || reportId !== currentReportIdRef.current) {
            return false;
        }
        const loadId = ++latestLoadRef.current;
        const isCurrent = () => loadId === latestLoadRef.current;

        setLoading(true);
        try {
            const result = await ServerApiService.getPlayerReportAsync(reportId);
            if (!isCurrent()) {
                return false;
            }
            setDetail(result);
            // Keep the selection only if it belongs to this report
            setSelectedPlayerId((current) => (current === result.reporter.playerId || current === result.reportedPlayer.playerId
                ? current
                : result.reportedPlayer.playerId));
            return true;
        } catch (loadError) {
            if (isCurrent()) {
                setError(loadError instanceof Error ? loadError.message : 'Failed to load report');
            }
            return false;
        } finally {
            if (isCurrent()) {
                setLoading(false);
            }
        }
    }, [reportId]);

    useEffect(() => {
        // Drops any load still running for the previous report, also when the dialog was just closed
        latestLoadRef.current++;
        setDetail(null);
        setError(null);
        setInfo(null);
        setSelectedPlayerId(null);
        loadAsync();
    }, [loadAsync]);

    const handleActionApplied = async (message: string, isWarning = false) => {
        onReportChangedRef.current();
        if (!isShowing(reportId)) {
            return;
        }
        if (!isWarning) {
            setError(null);
            setInfo(message);
            await loadAsync();
            return;
        }
        // Set after the reload, so a failing reload cannot replace the warning that a follow-up step is missing
        setInfo(null);
        const reloaded = await loadAsync();
        if (isShowing(reportId)) {
            setError(reloaded ? message : `${message} Reloading the ticket failed, so it may not show the action yet.`);
        }
    };

    /** An action was issued and the ticket closed with it: the ticket stays shown, now closed, with the result */
    const handleTicketClosedByAction = async (message: string, isWarning = false) => {
        onReportChangedRef.current();
        if (!isShowing(reportId)) {
            return;
        }
        setError(isWarning ? message : null);
        setInfo(isWarning ? null : message);
        await loadAsync();
    };

    const handleClosed = () => {
        onReportChangedRef.current();
        // A close that finishes after the moderator moved on must not close the report shown now
        if (isShowing(reportId)) {
            onClose();
        }
    };

    /** Errors from the panels of a report that is no longer shown are dropped */
    const handlePanelError = (message: string) => {
        if (isShowing(reportId)) {
            setError(message);
        }
    };

    /**
     * Closing or reopening failed, usually because another moderator changed the ticket meanwhile: show the
     * current state, so the moderator is not left retrying against a ticket that is already closed or open.
     */
    const handleWorkflowFailed = async (message: string) => {
        onReportChangedRef.current();
        if (!isShowing(reportId)) {
            return;
        }
        setInfo(null);
        await loadAsync();
        if (isShowing(reportId)) {
            setError(message);
        }
    };

    const handleReopened = async () => {
        onReportChangedRef.current();
        if (!isShowing(reportId)) {
            return;
        }
        setInfo('Ticket reopened');
        await loadAsync();
    };

    const report = detail?.report;
    const selectedContext = detail && (selectedPlayerId === detail.reporter.playerId ? detail.reporter : detail.reportedPlayer);
    const usernameById = (playerId: string) =>
        (detail && [detail.reporter, detail.reportedPlayer].find((context) => context.playerId === playerId)?.username) ?? playerId;

    // Name changes made by a ticket's actions (Change Username, or the reset after Block Username Changes)
    const renameByActionId = new Map(
        (detail ? [...detail.reporter.usernameChanges, ...detail.reportedPlayer.usernameChanges] : [])
            .filter((change) => change.relatedModActionId)
            .map((change) => [change.relatedModActionId!, change])
    );

    // ----------------Styles----------------//
    const styles = {
        paper: {
            background: 'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
            border: '2px solid transparent',
            borderRadius: '15px',
            color: 'white',
            maxHeight: '92vh',
        },
        header: {
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '1rem 1.25rem 0.5rem',
        },
        title: {
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: 700,
            mb: 0,
        },
        subtitle: {
            color: '#9e9e9e',
            fontSize: '0.8rem',
            mb: 0,
        },
        body: {
            padding: '0.5rem 1.25rem 1.25rem',
            overflowY: 'auto' as const,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '1rem',
        },
        playerRow: {
            display: 'flex',
            gap: '1rem',
        },
        reason: {
            border: '1px solid #4A5568',
            borderRadius: '8px',
            padding: '0.75rem',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
        },
        reasonLabel: {
            color: '#9e9e9e',
            fontSize: '0.75rem',
            mb: '0.25rem',
        },
        reasonText: {
            color: 'white',
            fontSize: '0.9rem',
            whiteSpace: 'pre-wrap' as const,
            wordBreak: 'break-word' as const,
            mb: 0,
        },
        noReasonText: {
            color: '#7a7a7a',
            fontSize: '0.9rem',
            fontStyle: 'italic',
            mb: 0,
        },
        contentRow: {
            display: 'flex',
            gap: '1.25rem',
            alignItems: 'flex-start',
        },
        logColumn: {
            flex: 3,
            minWidth: 0,
        },
        historyColumn: {
            flex: 2,
            minWidth: 0,
            pt: '0.5rem',
        },
        ticketActions: {
            border: '1px solid #4A5568',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
        },
        ticketActionText: {
            color: '#B0B0B0',
            fontSize: '0.8rem',
            mb: 0,
        },
        sectionTitle: {
            color: 'white',
            fontSize: '0.9rem',
            fontWeight: 600,
            mb: '0.25rem',
        },
        loading: {
            display: 'flex',
            justifyContent: 'center',
            padding: '3rem',
        },
        divider: {
            borderColor: '#4A5568',
        },
    };

    return (
        <Dialog open={!!reportId} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: styles.paper }}>
            <Box sx={styles.header}>
                <Box>
                    <Typography sx={styles.title}>
                        {report ? `Report · ${getOffenseLabel(report.offense)}` : 'Report'}
                    </Typography>
                    {report && (
                        <Typography sx={styles.subtitle}>
                            {formatDate(report.createdAt, dateFormat)} ({formatTimeAgoPhrase(report.createdAt)})
                            {' · '}{getGameFormatLabel(report.gameFormat)}
                            {' · '}{getMatchTypeLabel(report.matchType)}
                        </Typography>
                    )}
                </Box>
                <IconButton onClick={onClose} aria-label="Close" sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <Box sx={styles.body} ref={bodyRef}>
                {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
                {info && <Alert severity="success" onClose={() => setInfo(null)}>{info}</Alert>}

                {!detail && loading && (
                    <Box sx={styles.loading}><CircularProgress /></Box>
                )}

                {detail && report && selectedContext && (
                    <>
                        <Box sx={styles.playerRow}>
                            <ReportPlayerPanel
                                roleLabel="Reporter"
                                context={detail.reporter}
                                recentFalseReportCount={report.reporterRecentFalseReportCount}
                                usernameAtReport={report.reporterUsername}
                                selected={selectedPlayerId === detail.reporter.playerId}
                                onSelect={() => setSelectedPlayerId(detail.reporter.playerId)}
                                onOpenProfile={() => onOpenPlayerProfile(detail.reporter.playerId)}
                            />
                            <ReportPlayerPanel
                                roleLabel="Reported Player"
                                context={detail.reportedPlayer}
                                usernameAtReport={report.reportedPlayerUsername}
                                selected={selectedPlayerId === detail.reportedPlayer.playerId}
                                onSelect={() => setSelectedPlayerId(detail.reportedPlayer.playerId)}
                                onOpenProfile={() => onOpenPlayerProfile(detail.reportedPlayer.playerId)}
                            />
                        </Box>

                        <Box sx={styles.reason}>
                            <Typography sx={styles.reasonLabel}>Reason given by {report.reporterUsername}</Typography>
                            {report.description.trim()
                                ? <Typography sx={styles.reasonText}>{report.description}</Typography>
                                : <Typography sx={styles.noReasonText}>(no description)</Typography>}
                        </Box>

                        <Box sx={styles.contentRow}>
                            <Box sx={styles.logColumn}>
                                <ReportLogView
                                    report={report}
                                    chatLog={detail.chatLog}
                                    gameLog={detail.gameLog}
                                    highlightPlayerId={selectedContext.playerId}
                                />
                            </Box>
                            <Box sx={styles.historyColumn}>
                                <ReportPlayerHistory context={selectedContext} currentReportId={report.id} />
                            </Box>
                        </Box>

                        {detail.ticketActions.length > 0 && (
                            <Box sx={styles.ticketActions}>
                                <Typography sx={styles.sectionTitle}>Actions in This Ticket</Typography>
                                {detail.ticketActions.map((action) => (
                                    <Typography key={action.id} sx={styles.ticketActionText}>
                                        • {usernameById(action.playerId)}: {getActionLabel(action, dateFormat)}
                                        {renameByActionId.has(action.id) ? ` (${formatUsernameTransition(renameByActionId.get(action.id)!, { quote: true })})` : ''}
                                        {' '}by {action.moderatorUsername}
                                        {action.note ? ` – ${action.note}` : ''}
                                    </Typography>
                                ))}
                            </Box>
                        )}

                        {report.status === PlayerReportStatus.Open && (
                            <>
                                <Divider sx={styles.divider} />
                                <ReportActionPanel
                                    key={selectedContext.playerId}
                                    reportId={report.id}
                                    target={selectedContext}
                                    onActionApplied={handleActionApplied}
                                    onTicketClosed={handleTicketClosedByAction}
                                    onError={handlePanelError}
                                />
                            </>
                        )}

                        <Divider sx={styles.divider} />
                        <ReportClosePanel report={report} onClosed={handleClosed} onReopened={handleReopened} onError={handleWorkflowFailed} />
                    </>
                )}
            </Box>
        </Dialog>
    );
};

export default ReportDetailDialog;
