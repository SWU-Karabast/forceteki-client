import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Box, Tab, Tabs } from '@mui/material';
import {
    IPlayerReport,
    PlayerReportStatus,
} from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { ServerApiService } from '@/app/_services/ServerApiService';
import UserManagementTab from './UserManagementTab';
import ReportList from './reports/ReportList';
import ReportDetailDialog from './reports/ReportDetailDialog';

enum UserManagementSubTab {
    OpenReports = 0,
    ClosedReports = 1,
    FindUser = 2,
}

interface IUserManagementSectionProps {
    openReportCount: number | null;

    /** Lets the page refresh its open-report badge after a ticket changed */
    onReportsChanged: () => void;
}

/**
 * User management in the mod tools: the player report queue (open and closed tickets)
 * next to the existing player search.
 */
const UserManagementSection: React.FC<IUserManagementSectionProps> = ({ openReportCount, onReportsChanged }) => {
    const [activeTab, setActiveTab] = useState<UserManagementSubTab>(UserManagementSubTab.OpenReports);
    const [reports, setReports] = useState<IPlayerReport[]>([]);
    const [nextBeforeMonth, setNextBeforeMonth] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [searchRequest, setSearchRequest] = useState<{ query: string; requestId: number } | null>(null);

    const listStatus = activeTab === UserManagementSubTab.ClosedReports ? PlayerReportStatus.Closed : PlayerReportStatus.Open;

    const loadReportsAsync = useCallback(async (status: PlayerReportStatus) => {
        setLoading(true);
        setError(null);
        try {
            const result = await ServerApiService.listPlayerReportsAsync(status);
            setReports(result.reports);
            setNextBeforeMonth(result.nextBeforeMonth);
        } catch (loadError) {
            setReports([]);
            setNextBeforeMonth(null);
            setError(loadError instanceof Error ? loadError.message : 'Failed to load reports');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab !== UserManagementSubTab.FindUser) {
            loadReportsAsync(listStatus);
        }
    }, [activeTab, listStatus, loadReportsAsync]);

    const handleLoadOlder = async () => {
        if (!nextBeforeMonth) {
            return;
        }
        setLoading(true);
        try {
            const result = await ServerApiService.listPlayerReportsAsync(PlayerReportStatus.Closed, nextBeforeMonth);
            setReports((current) => [...current, ...result.reports]);
            setNextBeforeMonth(result.nextBeforeMonth);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Failed to load older reports');
        } finally {
            setLoading(false);
        }
    };

    const handleReportChanged = useCallback(() => {
        if (activeTab !== UserManagementSubTab.FindUser) {
            loadReportsAsync(listStatus);
        }
        onReportsChanged();
    }, [activeTab, listStatus, loadReportsAsync, onReportsChanged]);

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
    };

    return (
        <Box>
            <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={styles.tabs}>
                <Tab label={(
                    <Badge badgeContent={openReportCount ?? 0} sx={styles.badge} max={99}>
                        Open Reports
                    </Badge>
                )}
                />
                <Tab label="Closed Reports" />
                <Tab label="Find User" />
            </Tabs>

            {activeTab === UserManagementSubTab.FindUser ? (
                <UserManagementTab searchRequest={searchRequest} />
            ) : (
                <ReportList
                    key={listStatus}
                    status={listStatus}
                    reports={reports}
                    loading={loading}
                    error={error}
                    hasMore={listStatus === PlayerReportStatus.Closed && !!nextBeforeMonth}
                    onOpenReport={(report) => setSelectedReportId(report.id)}
                    onLoadMore={handleLoadOlder}
                />
            )}

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
