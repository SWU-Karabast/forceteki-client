import React, { useState } from 'react';
import { Box, MenuItem, Typography } from '@mui/material';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import ConfirmationDialog from '@/app/_components/_sharedcomponents/DeckPage/ConfirmationDialog';
import PlayerMessageField from '@/app/_components/_sharedcomponents/ModActions/PlayerMessageField';
import { PlayerNoticeKind } from '@/app/_contexts/UserTypes';
import { ServerApiService } from '@/app/_services/ServerApiService';
import {
    isDefaultNoticeMessage,
    MAX_PLAYER_NOTICE_LENGTH,
    PLAYER_NOTICE_KINDS,
    SENDABLE_PLAYER_NOTICE_KINDS,
} from '@/app/_utils/playerNoticeUtils';

interface ISendPlayerNoticeFormProps {
    playerId: string;
    username: string;

    /** Shown before the kind picker, e.g. the menu this form was chosen from */
    actionSelect?: React.ReactNode;

    /** Called once the notice was stored */
    onSent: (message: string) => Promise<void> | void;

    /** The request failed (refused, network, server error) */
    onError: (message: string) => void;
}

/**
 * Sends a player a message they see at their next sign-in, e.g. a reply to a bug report they filed on Discord.
 * Warnings are not sent from here: they go with a Warning mod action, so they appear in the mod history.
 */
const SendPlayerNoticeForm: React.FC<ISendPlayerNoticeFormProps> = ({ playerId, username, actionSelect, onSent, onError }) => {
    const initialKind = SENDABLE_PLAYER_NOTICE_KINDS[0];
    const [kind, setKind] = useState<PlayerNoticeKind>(initialKind);
    const [message, setMessage] = useState(PLAYER_NOTICE_KINDS[initialKind].defaultMessage ?? '');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [sending, setSending] = useState(false);

    const trimmedLength = message.trim().length;
    const canSend = !sending && trimmedLength > 0 && trimmedLength <= MAX_PLAYER_NOTICE_LENGTH;

    const selectKind = (value: PlayerNoticeKind) => {
        setKind(value);
        // a draft the moderator has written is kept; an untouched one becomes the new kind's starting text
        if (isDefaultNoticeMessage(message)) {
            setMessage(PLAYER_NOTICE_KINDS[value].defaultMessage ?? '');
        }
    };

    const handleConfirm = async () => {
        setConfirmOpen(false);
        setSending(true);
        try {
            await ServerApiService.sendPlayerNoticeAsync(playerId, kind, message.trim());
            setMessage(PLAYER_NOTICE_KINDS[kind].defaultMessage ?? '');
            await onSent(`Message sent. ${username} will see it the next time they sign in.`);
        } catch (error) {
            onError(error instanceof Error ? error.message : 'Failed to send the message');
        } finally {
            setSending(false);
        }
    };

    // ----------------Styles----------------//
    const styles = {
        row: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '0.75rem',
            alignItems: 'center',
            mb: '0.75rem',
        },
        kindSelect: {
            minWidth: '260px',
        },
        helpText: {
            color: '#B0B0B0',
            fontSize: '0.75rem',
            mb: '0.5rem',
        },
        footer: {
            display: 'flex',
            justifyContent: 'flex-end',
            mt: '0.75rem',
        },
    };

    return (
        <Box>
            <Box sx={styles.row}>
                {actionSelect}
                <StyledTextField
                    select
                    label="Kind"
                    value={kind}
                    onChange={(e) => selectKind(e.target.value as PlayerNoticeKind)}
                    size="small"
                    fullWidth={false}
                    sx={styles.kindSelect}
                >
                    {SENDABLE_PLAYER_NOTICE_KINDS.map((option) => (
                        <MenuItem key={option} value={option}>{PLAYER_NOTICE_KINDS[option].modLabel}</MenuItem>
                    ))}
                </StyledTextField>
            </Box>
            <Typography sx={styles.helpText}>
                {username} sees this the next time they sign in, under the heading &ldquo;{PLAYER_NOTICE_KINDS[kind].heading}&rdquo;.
                To warn a player, use the Warning action instead.
            </Typography>
            <PlayerMessageField
                value={message}
                onChange={setMessage}
                placeholder="Message to the player"
                disabled={sending}
            />
            <Box sx={styles.footer}>
                <PreferenceButton
                    variant="standard"
                    text={sending ? 'Sending…' : 'Send Message'}
                    disabled={!canSend}
                    buttonFnc={() => setConfirmOpen(true)}
                />
            </Box>

            <ConfirmationDialog
                open={confirmOpen}
                title="Send Message"
                message={`This will send ${username} a "${PLAYER_NOTICE_KINDS[kind].modLabel}" message, shown at their next sign-in. Are you sure?`}
                confirmButtonText="Send Message"
                onCancel={() => setConfirmOpen(false)}
                onConfirm={handleConfirm}
            />
        </Box>
    );
};

export default SendPlayerNoticeForm;
