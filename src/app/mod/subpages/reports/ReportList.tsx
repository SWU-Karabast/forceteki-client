import React, { useMemo, useState } from 'react';
import { Box, CircularProgress, MenuItem, Tooltip, Typography } from '@mui/material';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import {
    IPlayerReport,
    PlayerReportStatus,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { formatDate } from '@/app/_utils/ModerationUtils';
import {
    FREQUENT_FALSE_REPORTER_THRESHOLD,
    formatTimeAgo,
    getOffenseLabel,
    getOutcomeOption,
} from '@/app/_utils/playerReportUtils';
import { IReportListProps } from './reportTypes';

enum SortOrder {
    OldestFirst = 'oldestFirst',
    NewestFirst = 'newestFirst',
}

const ALL_OFFENSES = 'all';

const ReportList: React.FC<IReportListProps> = ({ status, reports, loading, error, hasMore, onOpenReport, onLoadMore }) => {
    const isOpenList = status === PlayerReportStatus.Open;
    const [sortOrder, setSortOrder] = useState<SortOrder>(isOpenList ? SortOrder.OldestFirst : SortOrder.NewestFirst);
    const [offenseFilter, setOffenseFilter] = useState<string>(ALL_OFFENSES);

    const offenses = useMemo(() => [...new Set(reports.map((report) => report.offense))], [reports]);

    const visibleReports = useMemo(() => {
        const sortKey = (report: IPlayerReport) => (isOpenList ? report.createdAt : report.closedAt ?? report.createdAt);
        return reports
            .filter((report) => offenseFilter === ALL_OFFENSES || report.offense === offenseFilter)
            .sort((a, b) => {
                const compared = sortKey(a).localeCompare(sortKey(b));
                return sortOrder === SortOrder.OldestFirst ? compared : -compared;
            });
    }, [reports, offenseFilter, sortOrder, isOpenList]);

    // ----------------Styles----------------//
    const columns = isOpenList ? '90px 1.4fr 1fr 1fr 1fr' : '170px 1.4fr 1fr 1fr 1fr 1fr';
    const styles = {
        toolbar: {
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            mb: '1rem',
        },
        select: {
            width: '200px',
        },
        headerRow: {
            display: 'grid',
            gridTemplateColumns: columns,
            gap: '0.75rem',
            padding: '0.5rem 0.75rem',
            color: '#9e9e9e',
            fontSize: '0.8rem',
            fontWeight: 600,
            borderBottom: '1px solid #4A5568',
        },
        row: {
            display: 'grid',
            gridTemplateColumns: columns,
            gap: '0.75rem',
            alignItems: 'center',
            padding: '0.6rem 0.75rem',
            borderBottom: '1px solid rgba(74, 85, 104, 0.5)',
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: 'rgba(47, 125, 182, 0.15)',
            },
        },
        cell: {
            color: 'white',
            fontSize: '0.875rem',
            mb: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const,
        },
        mutedCell: {
            color: '#9e9e9e',
            fontSize: '0.875rem',
            mb: 0,
        },
        marker: (color: string) => ({
            color,
            fontSize: '0.75rem',
            fontWeight: 700,
            ml: '0.4rem',
        }),
        empty: {
            color: '#9e9e9e',
            padding: '2rem 0.75rem',
            textAlign: 'center' as const,
        },
        error: {
            color: '#ef5350',
            padding: '1rem 0.75rem',
        },
        loadMoreRow: {
            display: 'flex',
            justifyContent: 'center',
            mt: '1rem',
        },
    };

    const renderReporter = (report: IPlayerReport) => (
        <Typography sx={styles.cell}>
            {report.reporterUsername}
            {report.reporterPriorFalseReportCount >= FREQUENT_FALSE_REPORTER_THRESHOLD && (
                <Tooltip title={`${report.reporterPriorFalseReportCount} earlier reports closed as false reports`}>
                    <Box component="span" sx={styles.marker('#ffb74d')}>⚑</Box>
                </Tooltip>
            )}
        </Typography>
    );

    const renderReportedPlayer = (report: IPlayerReport) => (
        <Typography sx={styles.cell}>
            {report.reportedPlayerUsername}
            {report.reportedPlayerPriorReportCount > 0 && (
                <Tooltip title={`${report.reportedPlayerPriorReportCount} earlier reports against this player`}>
                    <Box component="span" sx={styles.marker('#ef5350')}>⚠{report.reportedPlayerPriorReportCount}</Box>
                </Tooltip>
            )}
        </Typography>
    );

    return (
        <Box>
            <Box sx={styles.toolbar}>
                <StyledTextField
                    select
                    label="Offense"
                    value={offenseFilter}
                    onChange={(e) => setOffenseFilter(e.target.value)}
                    sx={styles.select}
                >
                    <MenuItem value={ALL_OFFENSES}>All</MenuItem>
                    {offenses.map((offense) => (
                        <MenuItem key={offense} value={offense}>{getOffenseLabel(offense)}</MenuItem>
                    ))}
                </StyledTextField>
                <StyledTextField
                    select
                    label="Sort"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    sx={styles.select}
                >
                    <MenuItem value={SortOrder.OldestFirst}>Oldest first</MenuItem>
                    <MenuItem value={SortOrder.NewestFirst}>Newest first</MenuItem>
                </StyledTextField>
                {loading && <CircularProgress size={20} />}
            </Box>

            <Box sx={styles.headerRow}>
                <span>{isOpenList ? 'Received' : 'Closed'}</span>
                <span>Offense</span>
                <span>Reporter</span>
                <span>Reported</span>
                {isOpenList ? <span>Handled by</span> : <><span>Outcome</span><span>Closed by</span></>}
            </Box>

            {error && <Typography sx={styles.error}>{error}</Typography>}

            {!loading && !error && visibleReports.length === 0 && (
                <Typography sx={styles.empty}>
                    {isOpenList ? 'No open reports.' : 'No closed reports.'}
                </Typography>
            )}

            {visibleReports.map((report) => {
                const outcome = getOutcomeOption(report.outcome);
                return (
                    <Box key={report.id} sx={styles.row} onClick={() => onOpenReport(report)}>
                        {isOpenList ? (
                            <Tooltip title={formatDate(report.createdAt)}>
                                <Typography sx={styles.mutedCell}>{formatTimeAgo(report.createdAt)}</Typography>
                            </Tooltip>
                        ) : (
                            <Typography sx={styles.mutedCell}>{report.closedAt ? formatDate(report.closedAt) : ''}</Typography>
                        )}
                        <Typography sx={styles.cell}>{getOffenseLabel(report.offense)}</Typography>
                        {renderReporter(report)}
                        {renderReportedPlayer(report)}
                        {isOpenList ? (
                            <Typography sx={report.claimedByUsername ? styles.cell : styles.mutedCell}>
                                {report.claimedByUsername ?? '–'}
                            </Typography>
                        ) : (
                            <>
                                <Typography sx={{ ...styles.cell, color: outcome?.color ?? 'white' }}>{outcome?.label ?? report.outcome}</Typography>
                                <Typography sx={styles.cell}>{report.closedByUsername}</Typography>
                            </>
                        )}
                    </Box>
                );
            })}

            {hasMore && onLoadMore && (
                <Box sx={styles.loadMoreRow}>
                    <PreferenceButton variant="standard" text="Load older reports" buttonFnc={onLoadMore} disabled={loading} />
                </Box>
            )}
        </Box>
    );
};

export default ReportList;
