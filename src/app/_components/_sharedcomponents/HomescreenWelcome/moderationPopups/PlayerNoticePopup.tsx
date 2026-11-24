'use client';
import { useState } from 'react';
import {
    Typography,
    Dialog,
    DialogContent,
    DialogActions,
} from '@mui/material';

import { IPlayerNotice } from '@/app/_contexts/UserTypes';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useDateFormat } from '@/app/_hooks/useDateFormat';
import { formatLongDate } from '@/app/_utils/dateFormatUtils';
import { getPlayerNoticeKindInfo } from '@/app/_utils/playerNoticeUtils';

interface PlayerNoticePopupProps {
    notice: IPlayerNotice | null;
    onAcknowledge: (notice: IPlayerNotice) => void;
}

/** A message from the moderators (for now, one sent with a warning), shown until the player acknowledges it */
const PlayerNoticePopup: React.FC<PlayerNoticePopupProps> = ({ notice, onAcknowledge }) => {
    const dateFormat = useDateFormat();

    // the last notice stays on screen while the dialog fades out, rather than the dialog emptying first
    const [displayedNotice, setDisplayedNotice] = useState<IPlayerNotice | null>(notice);
    if (notice && notice !== displayedNotice) {
        setDisplayedNotice(notice);
    }
    const kindInfo = displayedNotice ? getPlayerNoticeKindInfo(displayedNotice.kind) : null;

    // ----------------Styles----------------//
    const styles = {
        dialog: {
            '& .MuiDialog-paper': {
                backgroundColor: '#1E2D32',
                borderRadius: '20px',
                maxWidth: '720px',
                width: '100%',
                padding: '20px',
                border: '2px solid transparent',
                background:
                    'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
            },
        },
        title: {
            color: kindInfo?.accentColor ?? '#fff',
            fontSize: '2rem',
            textAlign: 'left',
            marginBottom: '4px',
        },
        date: {
            fontSize: '0.875rem',
            color: '#B0B0B0',
            marginBottom: '16px',
        },
        message: {
            fontSize: '1rem',
            color: '#fff',
            marginBottom: '16px',
            // the message is plain text written by a moderator: keep its line breaks and never let a long word overflow
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
        },
        actions: {
            justifyContent: 'center',
            padding: '16px 0',
        },
        button: {
            backgroundColor: '#2F7DB6',
            color: '#fff',
            '&:hover': { backgroundColor: '#3590D2' },
            minWidth: '140px',
        },
    } as const;

    return (
        <Dialog
            open={!!notice}
            onClose={() => {}}
            disableEscapeKeyDown
            aria-labelledby="player-notice-dialog-title"
            sx={styles.dialog}
        >
            {displayedNotice && kindInfo && (
                <>
                    <DialogContent>
                        <Typography variant="h4" sx={styles.title} id="player-notice-dialog-title">
                            {kindInfo.heading}
                        </Typography>
                        <Typography variant="body2" sx={styles.date}>
                            {formatLongDate(displayedNotice.createdAt, dateFormat)}
                        </Typography>
                        <Typography variant="body1" sx={styles.message}>
                            {displayedNotice.message}
                        </Typography>
                    </DialogContent>

                    <DialogActions sx={styles.actions}>
                        <PreferenceButton
                            disabled={!notice}
                            buttonFnc={() => notice && onAcknowledge(notice)}
                            text="Got it"
                            variant="standard"
                            sx={styles.button}
                        />
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
};

export default PlayerNoticePopup;
