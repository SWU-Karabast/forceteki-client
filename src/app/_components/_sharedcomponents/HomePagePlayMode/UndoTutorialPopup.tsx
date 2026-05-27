'use client';
import React from 'react';
import {
    Box,
    Typography,
} from '@mui/material';
import Image from 'next/image';
import TutorialPopup from '@/app/_components/_sharedcomponents/HomePagePlayMode/TutorialPopup';

interface IUndoTutorialPopupProps {
    open: boolean;
    onClose: () => void;
}

const UndoTutorialPopup: React.FC<IUndoTutorialPopupProps> = ({ open, onClose }) => {
    const styles = {
        whatsNewList: {
            pl: '16px',
            mt: '4px',
            '& li::marker': { color: '#B4DCEB' },
        },
        whatsNewItem: {
            color: '#B4DCEB',
            fontSize: '0.9rem',
            marginBottom: '6px',
        },
        screenshotWrapper: {
            mt: '12px',
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
        },
        imageContainer: {
            position: 'relative',
            width: 'clamp(150px, 30vw, 232px)',
            height: 'clamp(40px, 8vw, 66px)',
            borderRadius: '8px',
            overflow: 'hidden',
        },
        infoItem: {
            color: '#B8860B',
            fontSize: '0.85rem',
            marginBottom: '4px'
        },
    } as const;

    return (
        <TutorialPopup
            open={open}
            onClose={onClose}
            titleId="undo-tutorial-dialog-title"
            title={<>✨ Undo in Public Games</>}
        >
            <Box component="ul" sx={styles.whatsNewList}>
                <Typography component="span" variant="body2" sx={styles.whatsNewItem}>
                    Undo in public games (queue and public lobbies) has special rules to prevent abuse.
                </Typography>
                <br/>
                <br/>

                <li>
                    <Typography component="span" variant="body2" sx={styles.infoItem}>
                        You receive <strong>one &quot;free&quot; undo per game</strong>. After it is used, every undo will <strong>send a request to the opponent 
                            for approval</strong>. They can allow or deny the request.
                    </Typography>
                </li>
                <br/>

                <li>
                    <Typography component="span" variant="body2" sx={styles.infoItem}>
                        Undo in certain game situations, <strong>such as after drawing or revealing cards</strong>, will <strong>always </strong>
                        require opponent approval (even if you have a free undo available).
                    </Typography>
                </li>
                <br/>

                <li>
                    <Typography component="span" variant="body2" sx={styles.infoItem}>
                        If enough undo requests are rejected, a player will have the option to <strong>block any further undo requests in that game</strong>.
                    </Typography>
                </li>
            </Box>
            <Box sx={styles.screenshotWrapper}>
                <Box sx={styles.imageContainer}>
                    <Image
                        src="/undo-button.png"
                        alt="Undo Button"
                        fill
                        style={{ objectFit: 'contain' }}
                    />
                </Box>
                <Box sx={styles.imageContainer}>
                    <Image
                        src="/request-undo.png"
                        alt="Request Undo Button"
                        fill
                        style={{ objectFit: 'contain' }}
                    />
                </Box>
                <Box sx={styles.imageContainer}>
                    <Image
                        src="/blocked-undo.png"
                        alt="Blocked Undo Button"
                        fill
                        style={{ objectFit: 'contain' }}
                    />
                </Box>
            </Box>
        </TutorialPopup>
    );
};

export default UndoTutorialPopup;
