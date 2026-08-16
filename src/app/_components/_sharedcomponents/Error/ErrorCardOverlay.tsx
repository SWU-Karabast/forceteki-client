'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';

export interface IErrorScreenAction {
    label: string;
    onClick: () => void;

    /** 'concede' renders the red treatment, 'standard' the neutral one. Defaults to standard. */
    variant?: 'concede' | 'standard';
}

interface IErrorCardOverlayProps {
    open: boolean;
    title: string;
    message: string;

    /** Extra technical detail (raw server text). Shown smaller, under the message. */
    detail?: string;
    actions: IErrorScreenAction[];
}

const FLIP_DELAY_MS = 450;
const FLIP_DURATION_MS = 900;

/**
 * Full-screen error display styled as a Star Wars Unlimited card that flips over to
 * reveal the error. Sits on the site background so it reads as part of Karabast rather
 * than a browser dialog.
 */
export const ErrorCardOverlay: React.FC<IErrorCardOverlayProps> = ({
    open,
    title,
    message,
    detail,
    actions,
}) => {
    const [flipped, setFlipped] = useState(false);
    const actionsRef = useRef<HTMLDivElement | null>(null);

    // Respect reduced-motion: show the error face immediately instead of animating.
    const prefersReducedMotion = typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    useEffect(() => {
        if (!open) {
            setFlipped(false);
            return;
        }

        if (prefersReducedMotion) {
            setFlipped(true);
            return;
        }

        const timer = setTimeout(() => setFlipped(true), FLIP_DELAY_MS);
        return () => clearTimeout(timer);
    }, [open, prefersReducedMotion]);

    // Move focus to the first action once the error face is actually readable.
    useEffect(() => {
        if (!flipped) {
            return;
        }

        const delay = prefersReducedMotion ? 0 : FLIP_DURATION_MS;
        const timer = setTimeout(() => {
            actionsRef.current?.querySelector('button')?.focus();
        }, delay);
        return () => clearTimeout(timer);
    }, [flipped, prefersReducedMotion]);

    if (!open) {
        return null;
    }

    const styles = {
        overlay: {
            position: 'fixed',
            inset: 0,
            zIndex: 1400,
            backgroundImage: 'url(/default-background.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
        },
        scene: {
            perspective: '1400px',
            width: 'min(24rem, 88vw)',
        },
        card: {
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 1.4',
            transformStyle: 'preserve-3d',
            transition: prefersReducedMotion ? 'none' : `transform ${FLIP_DURATION_MS}ms cubic-bezier(.4,.15,.2,1)`,
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        },
        face: {
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            borderRadius: '5px',
        },
        // Matches the deck pile's card back treatment so it reads as the same object.
        cardBack: {
            backgroundColor: 'black',
            backgroundImage: 'url(/card-back.png)',
            backgroundSize: '100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            border: '1px solid #2A2F36',
        },
        cardFront: {
            transform: 'rotateY(180deg)',
            backgroundColor: 'rgba(0, 0, 0, 0.88)',
            border: '2px solid var(--initiative-red)',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        },
        title: {
            color: 'var(--initiative-red)',
            fontSize: '1.3rem',
            fontWeight: 600,
            mb: '0.75rem',
        },
        body: {
            flexGrow: 1,
            overflowY: 'auto',
            mb: '1rem',
        },
        message: {
            color: '#CFD6DF',
            fontSize: '1rem',
            lineHeight: 1.6,
        },
        detail: {
            color: '#8A94A2',
            fontSize: '0.8rem',
            lineHeight: 1.5,
            mt: '0.75rem',
            wordBreak: 'break-word',
        },
        actions: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
        },
    };

    return (
        <Box sx={styles.overlay} role="alertdialog" aria-modal="true" aria-label={title}>
            <Box sx={styles.scene}>
                <Box sx={styles.card}>
                    <Box sx={{ ...styles.face, ...styles.cardBack }} aria-hidden="true" />
                    <Box sx={{ ...styles.face, ...styles.cardFront }}>
                        <Typography sx={styles.title}>{title}</Typography>
                        <Box sx={styles.body}>
                            <Typography sx={styles.message}>{message}</Typography>
                            {detail && <Typography sx={styles.detail}>{detail}</Typography>}
                        </Box>
                        <Box sx={styles.actions} ref={actionsRef}>
                            {actions.map((action) => (
                                <PreferenceButton
                                    key={action.label}
                                    variant={action.variant ?? 'standard'}
                                    text={action.label}
                                    buttonFnc={action.onClick}
                                    sx={{ width: '100%' }}
                                />
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default ErrorCardOverlay;
