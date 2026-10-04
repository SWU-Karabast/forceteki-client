import React, { useState } from 'react';
import { Box, FormControlLabel, Switch, Tab, Tabs, Typography } from '@mui/material';
import { IPlayerReportLog } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { formatDate } from '@/app/_utils/ModerationUtils';
import { formatLogTime, getGameFormatLabel, getMatchTypeLabel, LOG_RETENTION_DAYS } from '@/app/_utils/playerReportUtils';
import { IReportLogViewProps } from './reportTypes';

enum LogTab {
    Chat = 0,
    Game = 1,
    Details = 2,
}

/**
 * Chat log, game log and technical details of a report. Lines that mention the selected player
 * are highlighted; the toggle hides everything else.
 */
const ReportLogView: React.FC<IReportLogViewProps> = ({ report, chatLog, gameLog, highlightPlayerId }) => {
    const [activeTab, setActiveTab] = useState<LogTab>(LogTab.Chat);
    const [onlySelectedPlayer, setOnlySelectedPlayer] = useState(false);

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
        text: {
            color: '#E0E0E0',
            fontSize: '0.8rem',
            whiteSpace: 'pre-wrap' as const,
            wordBreak: 'break-word' as const,
            mb: 0,
        },
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

    const renderLog = (log: IPlayerReportLog | null) => {
        const lines = (log?.lines ?? []).filter((line) => !onlySelectedPlayer || line.playerIds.includes(highlightPlayerId));
        return (
            <Box sx={styles.logBox}>
                {report.logsDeletedAt && (
                    <Typography sx={styles.notice}>
                        The logs were deleted on {formatDate(report.logsDeletedAt)}, {LOG_RETENTION_DAYS} days after the ticket was closed.
                    </Typography>
                )}
                {log?.truncated && <Typography sx={styles.notice}>Older lines were cut off because the log was too long.</Typography>}
                {lines.length === 0 && !report.logsDeletedAt && <Typography sx={styles.empty}>(no messages)</Typography>}
                {lines.map((line, index) => (
                    <Box key={`${line.at}-${index}`} sx={styles.line(line.playerIds.includes(highlightPlayerId))}>
                        <Typography sx={styles.time}>{formatLogTime(line.at)}</Typography>
                        <Typography sx={styles.text}>{line.text}</Typography>
                    </Box>
                ))}
            </Box>
        );
    };

    const details: [string, string | number | undefined][] = [
        ['Lobby ID', report.lobbyId],
        ['Game ID', report.gameId ?? 'N/A'],
        ['Format', getGameFormatLabel(report.gameFormat)],
        ['Match type', getMatchTypeLabel(report.matchType)],
        ['Game steps since last undo', report.gameStepsSinceLastUndo],
        ['Screen resolution', report.screenResolution ? `${report.screenResolution.width}x${report.screenResolution.height}` : undefined],
        ['Viewport', report.viewport ? `${report.viewport.width}x${report.viewport.height}` : undefined],
    ];

    return (
        <Box>
            <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={styles.tabs}>
                <Tab label={`Chat (${chatLog?.lines.length ?? 0})`} />
                <Tab label={`Game log (${gameLog?.lines.length ?? 0})`} />
                <Tab label="Details" />
            </Tabs>
            {activeTab !== LogTab.Details && (
                <Box sx={styles.toolbar}>
                    <FormControlLabel
                        sx={styles.switchLabel}
                        control={<Switch size="small" checked={onlySelectedPlayer} onChange={(e) => setOnlySelectedPlayer(e.target.checked)} />}
                        label="Only selected player"
                    />
                </Box>
            )}
            {activeTab === LogTab.Chat && renderLog(chatLog)}
            {activeTab === LogTab.Game && renderLog(gameLog)}
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
