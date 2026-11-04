import React, { useState } from 'react';
import { Box, CircularProgress, FormControlLabel, IconButton, Menu, MenuItem, Switch, Tooltip, Typography } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { REPORT_TYPES } from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PlayerReportDialog';
import {
    IPlayerReport,
    ModActionType,
    PlayerReportListSort,
    PlayerReportStatus,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { useDateFormat } from '@/app/_hooks/useDateFormat';
import { formatDate } from '@/app/_utils/ModerationUtils';
import {
    formatTimeAgo,
    getOffenseLabel,
    getOutcomeOption,
    OPEN_TICKET_ACCENT,
    OPEN_TICKET_COLOR,
    OPEN_TICKET_ROW_BACKGROUND,
} from '@/app/_utils/playerReportUtils';
import { ALL_OFFENSES, effectiveReportSort, IReportListProps } from './reportTypes';
import PlayerPenaltyTooltip from './PlayerPenaltyTooltip';
import { REPORT_QUICK_ACTION_LABELS } from './ReportQuickActionDialog';

const COLUMNS = '80px 110px 1fr 1fr 1fr 2fr 1fr 40px';

/**
 * The report queue: open and closed tickets in one list, newest first, filtered and paged by the server. Each entry
 * previews the reporter's description, so noise can be closed right from the list through the entry's menu.
 */
const ReportList: React.FC<IReportListProps> = ({
    reports,
    total,
    loading,
    error,
    hasMore,
    filters,
    onFiltersChange,
    onOpenReport,
    onQuickClose,
    onQuickAction,
    onLoadMore,
}) => {
    const dateFormat = useDateFormat();
    const [menu, setMenu] = useState<{ anchor: HTMLElement; report: IPlayerReport } | null>(null);

    const closeMenuAnd = (action: (report: IPlayerReport) => void) => {
        const report = menu?.report;
        setMenu(null);
        if (report) {
            action(report);
        }
    };

    const newestFirst = effectiveReportSort(filters) === PlayerReportListSort.NewestFirst;
    const toggleSort = () => onFiltersChange({
        ...filters,
        sort: newestFirst ? PlayerReportListSort.OldestFirst : PlayerReportListSort.NewestFirst,
    });

    // ----------------Styles----------------//
    const styles = {
        toolbar: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '0.75rem',
            alignItems: 'center',
            mb: '1rem',
        },
        search: {
            width: '260px',
        },
        select: {
            width: '220px',
        },
        switchLabel: {
            color: 'white',
            '& .MuiFormControlLabel-label': { fontSize: '0.875rem' },
        },
        // The default track is nearly invisible on the dark background, so the off state needs its own color
        switch: {
            '& .MuiSwitch-switchBase + .MuiSwitch-track': { backgroundColor: '#6b7280', opacity: 1 },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#2F7DB6', opacity: 1 },
        },
        sortHeader: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.15rem',
            cursor: 'pointer',
            userSelect: 'none' as const,
            color: '#cfcfcf',
            '&:hover': { color: 'white' },
        },
        sortIcon: {
            fontSize: '0.95rem',
        },
        count: {
            color: '#9e9e9e',
            fontSize: '0.8rem',
            ml: 'auto',
        },
        headerRow: {
            display: 'grid',
            gridTemplateColumns: COLUMNS,
            gap: '0.75rem',
            padding: '0.5rem 0.75rem',
            color: '#9e9e9e',
            fontSize: '0.8rem',
            fontWeight: 600,
            borderBottom: '1px solid #4A5568',
        },
        row: {
            display: 'grid',
            gridTemplateColumns: COLUMNS,
            gap: '0.75rem',
            alignItems: 'center',
            padding: '0.4rem 0.75rem',
            borderBottom: '1px solid rgba(74, 85, 104, 0.5)',
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: 'rgba(47, 125, 182, 0.15)',
            },
        },
        // Ties the open tickets to the red counter on the tabs
        openRow: {
            backgroundColor: OPEN_TICKET_ROW_BACKGROUND,
            boxShadow: `inset 3px 0 0 ${OPEN_TICKET_ACCENT}`,
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
        description: {
            color: '#E0E0E0',
            fontSize: '0.85rem',
            mb: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const,
        },
        noDescription: {
            color: '#7a7a7a',
            fontSize: '0.85rem',
            fontStyle: 'italic',
            mb: 0,
        },
        tooltipText: {
            whiteSpace: 'pre-wrap' as const,
            fontSize: '0.8rem',
        },
        menuButton: {
            color: '#B0B0B0',
            padding: '4px',
            '&:hover': { color: 'white' },
        },
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

    const renderStatus = (report: IPlayerReport) => {
        if (report.status === PlayerReportStatus.Open) {
            return <Typography sx={{ ...styles.cell, color: OPEN_TICKET_COLOR, fontWeight: 700 }}>Open</Typography>;
        }
        const outcome = getOutcomeOption(report.outcome);
        return <Typography sx={{ ...styles.cell, color: outcome?.color ?? 'white', fontWeight: 600 }}>{outcome?.label ?? report.outcome}</Typography>;
    };

    const renderDescription = (report: IPlayerReport) => {
        if (!report.description.trim()) {
            return <Typography sx={styles.noDescription}>(no description)</Typography>;
        }
        return (
            <Tooltip title={<Box component="span" sx={styles.tooltipText}>{report.description}</Box>} placement="bottom-start" enterDelay={300}>
                <Typography sx={styles.description}>{report.description}</Typography>
            </Tooltip>
        );
    };

    return (
        <Box>
            <Box sx={styles.toolbar}>
                <StyledTextField
                    placeholder="Search Username"
                    value={filters.search}
                    onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                    size="small"
                    sx={styles.search}
                />
                <StyledTextField
                    select
                    label="Offense"
                    value={filters.offense}
                    onChange={(e) => onFiltersChange({ ...filters, offense: e.target.value })}
                    size="small"
                    sx={styles.select}
                >
                    <MenuItem value={ALL_OFFENSES}>All Offenses</MenuItem>
                    {REPORT_TYPES.map((config) => (
                        <MenuItem key={config.type} value={config.type}>{config.label}</MenuItem>
                    ))}
                </StyledTextField>
                <FormControlLabel
                    sx={styles.switchLabel}
                    control={<Switch sx={styles.switch} checked={filters.openOnly} onChange={(e) => onFiltersChange({ ...filters, openOnly: e.target.checked })} />}
                    label="Open Tickets Only"
                />
                {loading && <CircularProgress size={20} />}
                {!error && <Typography sx={styles.count}>{reports.length} of {total}</Typography>}
            </Box>

            <Box sx={styles.headerRow}>
                <Tooltip title={newestFirst ? 'Newest first, click for oldest first' : 'Oldest first, click for newest first'}>
                    <Box
                        component="span"
                        role="button"
                        tabIndex={0}
                        sx={styles.sortHeader}
                        onClick={toggleSort}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleSort();
                            }
                        }}
                    >
                        Received
                        {newestFirst ? <ArrowDownwardIcon sx={styles.sortIcon} /> : <ArrowUpwardIcon sx={styles.sortIcon} />}
                    </Box>
                </Tooltip>
                <span>Status</span>
                <span>Offense</span>
                <span>Reporter</span>
                <span>Reported Player</span>
                <span>Description</span>
                <span>Closed By</span>
                <span />
            </Box>

            {error && <Typography sx={styles.error}>{error}</Typography>}

            {!loading && !error && reports.length === 0 && (
                <Typography sx={styles.empty}>
                    {filters.openOnly ? 'No open reports.' : 'No reports.'}
                </Typography>
            )}

            {reports.map((report) => (
                <Box key={report.id} sx={report.status === PlayerReportStatus.Open ? { ...styles.row, ...styles.openRow } : styles.row} onClick={() => onOpenReport(report)}>
                    <Tooltip title={formatDate(report.createdAt, dateFormat)}>
                        <Typography sx={styles.mutedCell}>{formatTimeAgo(report.createdAt)}</Typography>
                    </Tooltip>
                    {renderStatus(report)}
                    <Typography sx={styles.cell}>{getOffenseLabel(report.offense)}</Typography>
                    <PlayerPenaltyTooltip playerId={report.reporterId} username={report.reporterUsername}>
                        <Typography sx={styles.cell}>{report.reporterUsername}</Typography>
                    </PlayerPenaltyTooltip>
                    <PlayerPenaltyTooltip playerId={report.reportedPlayerId} username={report.reportedPlayerUsername}>
                        <Typography sx={styles.cell}>{report.reportedPlayerUsername}</Typography>
                    </PlayerPenaltyTooltip>
                    {renderDescription(report)}
                    <Typography sx={report.closedByUsername ? styles.cell : styles.mutedCell}>{report.closedByUsername ?? '–'}</Typography>
                    <IconButton
                        aria-label={`Actions for the report against ${report.reportedPlayerUsername}`}
                        sx={styles.menuButton}
                        onClick={(event) => {
                            event.stopPropagation();
                            setMenu({ anchor: event.currentTarget, report });
                        }}
                    >
                        <MoreVertIcon fontSize="small" />
                    </IconButton>
                </Box>
            ))}

            <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}>
                <MenuItem onClick={() => closeMenuAnd(onOpenReport)}>Open Ticket</MenuItem>
                {menu?.report.status === PlayerReportStatus.Open && [
                    <MenuItem key="warning" onClick={() => closeMenuAnd((report) => onQuickAction(report, ModActionType.Warning))}>
                        {REPORT_QUICK_ACTION_LABELS[ModActionType.Warning]}: {menu.report.reportedPlayerUsername}
                    </MenuItem>,
                    <MenuItem key="mute" onClick={() => closeMenuAnd((report) => onQuickAction(report, ModActionType.Mute))}>
                        {REPORT_QUICK_ACTION_LABELS[ModActionType.Mute]}: {menu.report.reportedPlayerUsername}
                    </MenuItem>,
                    <MenuItem key="close" onClick={() => closeMenuAnd(onQuickClose)}>Close with No Action</MenuItem>,
                ]}
            </Menu>

            {hasMore && (
                <Box sx={styles.loadMoreRow}>
                    <PreferenceButton variant="standard" text="Load More" buttonFnc={onLoadMore} disabled={loading} />
                </Box>
            )}
        </Box>
    );
};

export default ReportList;
