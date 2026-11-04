import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Badge, Box, Tab, Tabs } from '@mui/material';
import {
    IPlayerReport,
    PlayerReportOutcome,
    PlayerReportStatus,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { ServerApiService } from '@/app/_services/ServerApiService';
import { REPORT_PAGE_SIZE } from '@/app/_utils/playerReportUtils';
import UserManagementTab from './UserManagementTab';
import ReportList from './reports/ReportList';
import ReportDetailDialog from './reports/ReportDetailDialog';
import { ALL_OFFENSES, effectiveReportSort, IReportListFilters } from './reports/reportTypes';
import ReportQuickActionDialog, { ReportQuickAction } from './reports/ReportQuickActionDialog';
import { IReportActionOutcome } from '@/app/_utils/reportActionSubmission';

enum UserManagementSubTab {
    Reports = 0,
    FindUser = 1,
}

/** Typing in the search waits this long before the list reloads */
const SEARCH_DEBOUNCE_MS = 300;

const INITIAL_FILTERS: IReportListFilters = { openOnly: true, search: '', offense: ALL_OFFENSES, sort: null };

interface IUserManagementSectionProps {
    openReportCount: number | null;

    /** Lets the page refresh its open-report badge after a ticket changed */
    onReportsChanged: () => void;
}

/**
 * User management in the mod tools: the player report queue next to the player search.
 */
const UserManagementSection: React.FC<IUserManagementSectionProps> = ({ openReportCount, onReportsChanged }) => {
    const [activeTab, setActiveTab] = useState<UserManagementSubTab>(UserManagementSubTab.Reports);
    const [filters, setFilters] = useState<IReportListFilters>(INITIAL_FILTERS);
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [reports, setReports] = useState<IPlayerReport[]>([]);
    const [total, setTotal] = useState(0);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    // Starts as loading so the first paint shows the spinner, not an empty queue
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<{ severity: 'success' | 'error'; message: string } | null>(null);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [quickAction, setQuickAction] = useState<{ report: IPlayerReport; actionType: ReportQuickAction } | null>(null);
    const [searchRequest, setSearchRequest] = useState<{ query: string; requestId: number } | null>(null);

    useEffect(() => {
        const timeout = setTimeout(() => setDebouncedSearch(filters.search.trim()), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timeout);
    }, [filters.search]);

    // Only the newest request may update the list, so a slow response for older filters cannot overwrite it
    const latestListRequestRef = useRef(0);

    const loadPageAsync = useCallback(async (cursor: string | null) => {
        const requestId = ++latestListRequestRef.current;
        setLoading(true);
        setError(null);
        try {
            const result = await ServerApiService.listPlayerReportsAsync({
                status: filters.openOnly ? PlayerReportStatus.Open : undefined,
                search: debouncedSearch || undefined,
                offense: filters.offense === ALL_OFFENSES ? undefined : filters.offense,
                limit: REPORT_PAGE_SIZE,
                sort: effectiveReportSort({ openOnly: filters.openOnly, sort: filters.sort }),
                cursor: cursor ?? undefined,
            });
            if (requestId !== latestListRequestRef.current) {
                return;
            }
            setReports((current) => (cursor ? [...current, ...result.reports] : result.reports));
            setTotal(result.total);
            setNextCursor(result.nextCursor);
        } catch (loadError) {
            if (requestId !== latestListRequestRef.current) {
                return;
            }
            if (!cursor) {
                setReports([]);
                setTotal(0);
                setNextCursor(null);
            }
            setError(loadError instanceof Error ? loadError.message : 'Failed to load reports');
        } finally {
            if (requestId === latestListRequestRef.current) {
                setLoading(false);
            }
        }
    }, [filters.openOnly, filters.offense, filters.sort, debouncedSearch]);

    useEffect(() => {
        if (activeTab === UserManagementSubTab.Reports) {
            loadPageAsync(null);
        }
    }, [activeTab, loadPageAsync]);

    const handleReportChanged = useCallback(() => {
        if (activeTab === UserManagementSubTab.Reports) {
            loadPageAsync(null);
        }
        onReportsChanged();
    }, [activeTab, loadPageAsync, onReportsChanged]);

    const handleQuickClose = async (report: IPlayerReport) => {
        setNotice(null);
        try {
            await ServerApiService.updatePlayerReportStatusAsync(report.id, { status: PlayerReportStatus.Closed, outcome: PlayerReportOutcome.NoAction });
            setNotice({ severity: 'success', message: `Closed the report against ${report.reportedPlayerUsername} as No Action.` });
        } catch (closeError) {
            setNotice({
                severity: 'error',
                message: `Could not close the report against ${report.reportedPlayerUsername}: ${closeError instanceof Error ? closeError.message : 'unknown error'}`,
            });
        }
        handleReportChanged();
    };

    const handleQuickActionDone = (outcome: IReportActionOutcome) => {
        setQuickAction(null);
        setNotice({ severity: outcome.isWarning ? 'error' : 'success', message: outcome.message });
        if (outcome.actionApplied) {
            handleReportChanged();
        }
    };

    const handleTabChange = (tab: UserManagementSubTab) => {
        // Set together with the tab, so the list never renders a moment of "no reports" before loading
        if (tab === UserManagementSubTab.Reports) {
            setLoading(true);
        }
        setActiveTab(tab);
    };

    const handleOpenPlayerProfile = (playerId: string) => {
        setSelectedReportId(null);
        setActiveTab(UserManagementSubTab.FindUser);
        setSearchRequest({ query: playerId, requestId: Date.now() });
    };

    // ----------------Styles----------------//
    const styles = {
        tabs: {
            mb: '1rem',
            borderBottom: '1px solid #4A5568',
            '& .MuiTab-root': {
                color: '#B0B0B0',
                textTransform: 'none' as const,
                fontSize: '1rem',
                overflow: 'visible',
            },
            '& .Mui-selected': { color: 'white !important' },
            '& .MuiTabs-indicator': { backgroundColor: '#2F7DB6' },
        },
        badge: {
            '& .MuiBadge-badge': {
                right: '-14px',
                backgroundColor: '#C40000',
                color: 'white',
            },
        },
        notice: {
            mb: '1rem',
        },
    };

    return (
        <Box>
            <Tabs value={activeTab} onChange={(_, value) => handleTabChange(value)} sx={styles.tabs}>
                <Tab label={(
                    <Badge badgeContent={openReportCount ?? 0} sx={styles.badge} max={99}>
                        Reports
                    </Badge>
                )}
                />
                <Tab label="Find User" />
            </Tabs>

            {activeTab === UserManagementSubTab.FindUser ? (
                <UserManagementTab searchRequest={searchRequest} onSearchRequestHandled={() => setSearchRequest(null)} />
            ) : (
                <>
                    {notice && <Alert severity={notice.severity} onClose={() => setNotice(null)} sx={styles.notice}>{notice.message}</Alert>}
                    <ReportList
                        reports={reports}
                        total={total}
                        loading={loading}
                        error={error}
                        hasMore={!!nextCursor}
                        filters={filters}
                        onFiltersChange={setFilters}
                        onOpenReport={(report) => setSelectedReportId(report.id)}
                        onQuickClose={handleQuickClose}
                        onQuickAction={(report, actionType) => {
                            setNotice(null);
                            setQuickAction({ report, actionType });
                        }}
                        onLoadMore={() => loadPageAsync(nextCursor)}
                    />
                </>
            )}

            <ReportQuickActionDialog request={quickAction} onCancel={() => setQuickAction(null)} onDone={handleQuickActionDone} />

            <ReportDetailDialog
                reportId={selectedReportId}
                onClose={() => setSelectedReportId(null)}
                onReportChanged={handleReportChanged}
                onOpenPlayerProfile={handleOpenPlayerProfile}
            />
        </Box>
    );
};

export default UserManagementSection;
