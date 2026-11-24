import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { IPlayerNoticeHistoryEntry } from '@/app/_components/_sharedcomponents/Preferences/Preferences.types';
import { useDateFormat } from '@/app/_hooks/useDateFormat';
import { formatDateTime } from '@/app/_utils/dateFormatUtils';
import { getPlayerNoticeKindInfo } from '@/app/_utils/playerNoticeUtils';

interface IPlayerNoticeHistoryProps {

    /** Newest first */
    notices: IPlayerNoticeHistoryEntry[];
}

/** The messages a player has been sent, and whether they have read them yet */
const PlayerNoticeHistory: React.FC<IPlayerNoticeHistoryProps> = ({ notices }) => {
    const dateFormat = useDateFormat();
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // ----------------Styles----------------//
    const styles = {
        container: {
            maxHeight: '300px',
            overflowY: 'auto' as const,
            '::-webkit-scrollbar': { width: '0.2vw' },
            '::-webkit-scrollbar-thumb': { backgroundColor: '#D3D3D3B3', borderRadius: '1vw' },
            '::-webkit-scrollbar-button': { display: 'none' },
        },
        item: {
            border: '1px solid #4A5568',
            borderRadius: '8px',
            overflow: 'hidden',
            mb: '0.5rem',
        },
        header: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 0.75rem',
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: 'rgba(47, 125, 182, 0.15)',
            },
        },
        expandIcon: (isExpanded: boolean) => ({
            color: 'white',
            fontSize: '1.2rem',
            flexShrink: 0,
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
        }),
        label: {
            color: 'white',
            fontSize: '0.85rem',
            mb: '0px',
            flex: 1,
            minWidth: 0,
            overflowWrap: 'anywhere' as const,
        },
        status: (seen: boolean) => ({
            color: seen ? '#81c784' : '#ffd54f',
            fontSize: '0.75rem',
            fontWeight: 600,
            flexShrink: 0,
            whiteSpace: 'nowrap' as const,
        }),
        details: {
            padding: '0.75rem',
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderTop: '1px solid #4A5568',
        },
        detailLabel: {
            color: '#8C8C8C',
            fontSize: '0.7rem',
            mb: '0px',
        },
        detailValue: {
            color: '#B0B0B0',
            fontSize: '0.75rem',
            mb: '0.5rem',
        },
        message: {
            color: '#B0B0B0',
            fontSize: '0.75rem',
            whiteSpace: 'pre-wrap' as const,
            overflowWrap: 'anywhere' as const,
            mb: '0.5rem',
        },
        empty: {
            color: '#8C8C8C',
            fontSize: '0.875rem',
        },
    };

    if (notices.length === 0) {
        return <Typography sx={styles.empty}>No messages sent to this user.</Typography>;
    }

    return (
        <Box sx={styles.container}>
            {notices.map((notice) => {
                const isExpanded = expandedId === notice.id;
                const seen = !!notice.seenAt;
                return (
                    <Box key={notice.id} sx={styles.item}>
                        <Box sx={styles.header} onClick={() => setExpandedId(isExpanded ? null : notice.id)}>
                            <ExpandMoreIcon sx={styles.expandIcon(isExpanded)} />
                            <Typography sx={styles.label}>
                                {formatDateTime(notice.createdAt, dateFormat)} {getPlayerNoticeKindInfo(notice.kind).modLabel}, by {notice.senderUsername}
                            </Typography>
                            <Typography sx={styles.status(seen)}>{seen ? 'Seen' : 'Unseen'}</Typography>
                        </Box>
                        {isExpanded && (
                            <Box sx={styles.details}>
                                <Typography sx={styles.detailLabel}>Message</Typography>
                                <Typography sx={styles.message}>{notice.message}</Typography>
                                {notice.seenAt && (
                                    <>
                                        <Typography sx={styles.detailLabel}>Seen</Typography>
                                        <Typography sx={styles.detailValue}>{formatDateTime(notice.seenAt, dateFormat)}</Typography>
                                    </>
                                )}
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
};

export default PlayerNoticeHistory;
