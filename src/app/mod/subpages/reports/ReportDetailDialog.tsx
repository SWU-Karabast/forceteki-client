import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Box, CircularProgress, Dialog, Divider, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import {
    IPlayerReportDetailResponse,
    PlayerReportStatus,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { ServerApiService } from '@/app/_services/ServerApiService';
import { formatDate, getActionLabel } from '@/app/_utils/ModerationUtils';
import { formatTimeAgo, getGameFormatLabel, getMatchTypeLabel, getOffenseLabel } from '@/app/_utils/playerReportUtils';
import ReportActionPanel from './ReportActionPanel';
import ReportClosePanel from './ReportClosePanel';
import ReportLogView from './ReportLogView';
import ReportPlayerHistory from './ReportPlayerHistory';
import ReportPlayerPanel from './ReportPlayerPanel';
import { IReportDetailDialogProps } from './reportTypes';

/**
 * A single report ticket: both players, the reason, chat and game log, quick actions and closing.
 * Opening an unclaimed ticket claims it for the current moderator.
 */
const ReportDetailDialog: React.FC<IReportDetailDialogProps> = ({ reportId, onClose, onReportChanged, onOpenPlayerProfile }) => {
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

    const loadAsync = useCallback(async (claimIfUnclaimed: boolean) => {
        if (!reportId) {
            return;
        }
        setLoading(true);
        try {
            let result = await ServerApiService.getPlayerReportAsync(reportId);
            if (claimIfUnclaimed && result.report.status === PlayerReportStatus.Open && !result.report.claimedById) {
                const claimed = await ServerApiService.claimPlayerReportAsync(reportId);
                if (claimed.report) {
                    result = { ...result, report: claimed.report };
                    onReportChangedRef.current();
                }
            }
            setDetail(result);
            setSelectedPlayerId((current) => current ?? result.report.reportedPlayerId);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Failed to load report');
        } finally {
            setLoading(false);
        }
    }, [reportId]);

    useEffect(() => {
        setDetail(null);
        setError(null);
        setInfo(null);
        setSelectedPlayerId(null);
        loadAsync(true);
    }, [loadAsync]);

    const handleTakeOver = async () => {
        if (!reportId) {
            return;
        }
        try {
            const claimed = await ServerApiService.claimPlayerReportAsync(reportId);
            if (claimed.report) {
                setDetail((current) => (current ? { ...current, report: claimed.report! } : current));
                onReportChangedRef.current();
            }
        } catch (claimError) {
            setError(claimError instanceof Error ? claimError.message : 'Failed to take over ticket');
        }
    };

    const handleActionApplied = async (message: string) => {
        setError(null);
        setInfo(message);
        await loadAsync(false);
        onReportChangedRef.current();
    };

    const handleClosed = () => {
        onReportChangedRef.current();
        onClose();
    };

    const handleReopened = async () => {
        setInfo('Ticket reopened');
        await loadAsync(false);
        onReportChangedRef.current();
    };

    const report = detail?.report;
    const selectedContext = detail && (selectedPlayerId === detail.reporter.playerId ? detail.reporter : detail.reportedPlayer);
    const claimedByOther = report?.status === PlayerReportStatus.Open && !!report.claimedById && report.claimedById !== detail?.viewerId;
    const usernameById = (playerId: string) =>
        (detail && [detail.reporter, detail.reportedPlayer].find((context) => context.playerId === playerId)?.username) ?? playerId;

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
        claimBanner: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            border: '1px solid #ffb74d',
            borderRadius: '8px',
            padding: '0.5rem 0.75rem',
            color: '#ffb74d',
            fontSize: '0.85rem',
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
                            {formatDate(report.createdAt)} ({formatTimeAgo(report.createdAt)} ago)
                            {' · '}{getGameFormatLabel(report.gameFormat)}
                            {' · '}{getMatchTypeLabel(report.matchType)}
                            {report.claimedByUsername && report.status === PlayerReportStatus.Open ? ` · handled by ${report.claimedByUsername}` : ''}
                        </Typography>
                    )}
                </Box>
                <IconButton onClick={onClose} aria-label="Close" sx={{ color: 'white' }}>
                    <CloseIcon />
                </IconButton>
            </Box>

            <Box sx={styles.body}>
                {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
                {info && <Alert severity="success" onClose={() => setInfo(null)}>{info}</Alert>}

                {!detail && loading && (
                    <Box sx={styles.loading}><CircularProgress /></Box>
                )}

                {detail && report && selectedContext && (
                    <>
                        {claimedByOther && (
                            <Box sx={styles.claimBanner}>
                                <span>{report.claimedByUsername} is handling this ticket.</span>
                                <PreferenceButton variant="warning" text="Take over" buttonFnc={handleTakeOver} />
                            </Box>
                        )}

                        <Box sx={styles.playerRow}>
                            <ReportPlayerPanel
                                roleLabel="Reporter"
                                context={detail.reporter}
                                usernameAtReport={report.reporterUsername}
                                selected={selectedPlayerId === detail.reporter.playerId}
                                onSelect={() => setSelectedPlayerId(detail.reporter.playerId)}
                                onOpenProfile={() => onOpenPlayerProfile(detail.reporter.playerId)}
                            />
                            <ReportPlayerPanel
                                roleLabel="Reported"
                                context={detail.reportedPlayer}
                                usernameAtReport={report.reportedPlayerUsername}
                                selected={selectedPlayerId === detail.reportedPlayer.playerId}
                                onSelect={() => setSelectedPlayerId(detail.reportedPlayer.playerId)}
                                onOpenProfile={() => onOpenPlayerProfile(detail.reportedPlayer.playerId)}
                            />
                        </Box>

                        <Box sx={styles.reason}>
                            <Typography sx={styles.reasonLabel}>Reason given by {report.reporterUsername}</Typography>
                            <Typography sx={styles.reasonText}>{report.description || '(no description)'}</Typography>
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
                                <Typography sx={styles.sectionTitle}>Actions in this ticket</Typography>
                                {detail.ticketActions.map((action) => (
                                    <Typography key={action.id} sx={styles.ticketActionText}>
                                        • {usernameById(action.playerId)}: {getActionLabel(action)} by {action.moderatorUsername}
                                        {action.note ? ` – ${action.note}` : ''}
                                    </Typography>
                                ))}
                            </Box>
                        )}

                        {report.status === PlayerReportStatus.Open && (
                            <>
                                <Divider sx={styles.divider} />
                                <ReportActionPanel
                                    reportId={report.id}
                                    targetPlayerId={selectedContext.playerId}
                                    targetUsername={selectedContext.username}
                                    targetIsAnonymous={!selectedContext.createdAt}
                                    onActionApplied={handleActionApplied}
                                    onError={setError}
                                />
                            </>
                        )}

                        <Divider sx={styles.divider} />
                        <ReportClosePanel report={report} onClosed={handleClosed} onReopened={handleReopened} onError={setError} />
                    </>
                )}
            </Box>
        </Dialog>
    );
};

export default ReportDetailDialog;
