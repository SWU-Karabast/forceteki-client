import React, { useMemo, useState } from 'react';
import { Box, FormControlLabel, Switch, Tab, Tabs, Typography } from '@mui/material';
import { IPlayerReportLogLine } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { useDateFormat } from '@/app/_hooks/useDateFormat';
import { formatDate } from '@/app/_utils/ModerationUtils';
import { formatLogTime, getGameFormatLabel, getMatchTypeLabel, LOG_RETENTION_DAYS } from '@/app/_utils/playerReportUtils';
import { IReportLogViewProps } from './reportTypes';

enum LogTab {
    Log = 0,
    Details = 1,
}

enum LogSource {
    Chat = 'Chat',
    Game = 'Game',
}

interface ISourcedLine extends IPlayerReportLogLine {
    source: LogSource;
}

/**
 * Chat and game log of a report in one timeline, so what players said can be read next to what happened in the
 * game; switches show or hide either source. Lines that mention the selected player are highlighted.
 */
const ReportLogView: React.FC<IReportLogViewProps> = ({ report, chatLog, gameLog, highlightPlayerId }) => {
    const dateFormat = useDateFormat();
    const [activeTab, setActiveTab] = useState<LogTab>(LogTab.Log);
    const [showChat, setShowChat] = useState(true);
    const [showGameLog, setShowGameLog] = useState(true);

    const timeline = useMemo<ISourcedLine[]>(() => [
        ...(chatLog?.lines ?? []).map((line) => ({ ...line, source: LogSource.Chat })),
        ...(gameLog?.lines ?? []).map((line) => ({ ...line, source: LogSource.Game })),
    ].sort((a, b) => a.at.localeCompare(b.at)), [chatLog, gameLog]);

    // ----------------Styles----------------//
    const styles = {
        tabs: {
            minHeight: '36px',
            '& .MuiTab-root': {
                color: '#B0B0B0',
                textTransform: 'none' as const,
                minHeight: '36px',
                fontSize: '0.875rem',
            },
            '& .Mui-selected': { color: 'white !important' },
        },
        toolbar: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.5rem',
            minHeight: '32px',
        },
        switchLabel: {
            color: '#B0B0B0',
            '& .MuiFormControlLabel-label': { fontSize: '0.8rem' },
        },
        logBox: {
            height: '280px',
            overflowY: 'auto' as const,
            border: '1px solid #4A5568',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            padding: '0.5rem 0',
            fontFamily: 'monospace',
            '::-webkit-scrollbar': { width: '0.3vw' },
            '::-webkit-scrollbar-thumb': { backgroundColor: '#D3D3D3B3', borderRadius: '1vw' },
            '::-webkit-scrollbar-button': { display: 'none' },
        },
        line: (highlighted: boolean) => ({
            display: 'flex',
            gap: '0.75rem',
            padding: '0.15rem 0.75rem',
            borderLeft: highlighted ? '3px solid #2F7DB6' : '3px solid transparent',
            backgroundColor: highlighted ? 'rgba(47, 125, 182, 0.18)' : 'transparent',
        }),
        time: {
            color: '#7a7a7a',
            fontSize: '0.75rem',
            flexShrink: 0,
            mb: 0,
        },
        sourceTag: (source: LogSource) => ({
            color: source === LogSource.Chat ? '#81c784' : '#7a7a7a',
            fontSize: '0.7rem',
            fontWeight: 700,
            width: '2.5rem',
            flexShrink: 0,
            mb: 0,
        }),
        text: (source: LogSource) => ({
            color: source === LogSource.Chat ? '#ffffff' : '#B0B0B0',
            fontSize: '0.8rem',
            whiteSpace: 'pre-wrap' as const,
            wordBreak: 'break-word' as const,
            mb: 0,
        }),
        notice: {
            color: '#ffb74d',
            fontSize: '0.75rem',
            padding: '0 0.75rem 0.4rem',
        },
        empty: {
            color: '#9e9e9e',
            fontSize: '0.8rem',
            padding: '0.5rem 0.75rem',
        },
        detailRow: {
            display: 'flex',
            gap: '0.75rem',
            padding: '0.25rem 0.75rem',
        },
        detailLabel: {
            color: '#81c784',
            fontSize: '0.8rem',
            fontWeight: 600,
            minWidth: '170px',
            mb: 0,
        },
        detailValue: {
            color: 'white',
            fontSize: '0.8rem',
            wordBreak: 'break-all' as const,
            mb: 0,
        },
    };

    const renderLog = () => {
        const lines = timeline.filter((line) => (line.source === LogSource.Chat ? showChat : showGameLog));
        return (
            <Box sx={styles.logBox}>
                {report.logsDeletedAt && (
                    <Typography sx={styles.notice}>
                        The logs were deleted on {formatDate(report.logsDeletedAt, dateFormat)}, after the {LOG_RETENTION_DAYS}-day retention period after closing the ticket had passed.
                    </Typography>
                )}
                {(chatLog?.truncated || gameLog?.truncated) && <Typography sx={styles.notice}>Older lines were cut off because the log was too long.</Typography>}
                {lines.length === 0 && !report.logsDeletedAt && <Typography sx={styles.empty}>(no messages)</Typography>}
                {lines.map((line, index) => (
                    <Box key={`${line.source}-${line.at}-${index}`} sx={styles.line(line.playerIds.includes(highlightPlayerId))}>
                        <Typography sx={styles.time}>{formatLogTime(line.at)}</Typography>
                        <Typography sx={styles.sourceTag(line.source)}>{line.source === LogSource.Chat ? 'CHAT' : 'GAME'}</Typography>
                        <Typography sx={styles.text(line.source)}>{line.text}</Typography>
                    </Box>
                ))}
            </Box>
        );
    };

    const details: [string, string | number | undefined][] = [
        ['Lobby ID', report.lobbyId],
        ['Game ID', report.gameId ?? 'N/A'],
        ['Format', getGameFormatLabel(report.gameFormat)],
        ['Match Type', getMatchTypeLabel(report.matchType)],
        ['Game Steps Since Last Undo', report.gameStepsSinceLastUndo],
    ];

    return (
        <Box>
            <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={styles.tabs}>
                <Tab label="Log" />
                <Tab label="Details" />
            </Tabs>
            {activeTab === LogTab.Log && (
                <>
                    <Box sx={styles.toolbar}>
                        <FormControlLabel
                            sx={styles.switchLabel}
                            control={<Switch size="small" checked={showChat} onChange={(e) => setShowChat(e.target.checked)} />}
                            label="Chat"
                        />
                        <FormControlLabel
                            sx={styles.switchLabel}
                            control={<Switch size="small" checked={showGameLog} onChange={(e) => setShowGameLog(e.target.checked)} />}
                            label="Game Log"
                        />
                    </Box>
                    {renderLog()}
                </>
            )}
            {activeTab === LogTab.Details && (
                <Box sx={{ ...styles.logBox, fontFamily: 'inherit' }}>
                    {details.filter(([, value]) => value !== undefined && value !== '').map(([label, value]) => (
                        <Box key={label} sx={styles.detailRow}>
                            <Typography sx={styles.detailLabel}>{label}</Typography>
                            <Typography sx={styles.detailValue}>{value}</Typography>
                        </Box>
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default ReportLogView;
