import React, { useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import Image from 'next/image';
import { debugBorder } from '@/app/_utils/debug';
import { ICreditsProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';
import { PopupSource } from '@/app/_components/_sharedcomponents/Popup/Popup.types';
import useScreenOrientation from '@/app/_utils/useScreenOrientation';

const Credits: React.FC<ICreditsProps> = ({
    trayPlayer
}) => {
    const { gameState, connectedPlayer } = useGame();
    const { togglePopup, openPopup, popups } = usePopup();
    const containerRef = useRef<HTMLDivElement>(null);
    const { isPortrait } = useScreenOrientation();

    const credits = useMemo(
        () => gameState.players[trayPlayer].cardPiles.credits || [],
        [gameState.players, trayPlayer]
    );
    const creditTokenCount = credits.length;
    const someCreditTokenSelectable = credits.some((item: { selectable: boolean }) => item.selectable === true);
    const someCreditIsBlanked = credits.some((item: { isBlanked: boolean }) => item.isBlanked === true);
    const selectedCreditsCount = credits.filter((item: { selected: boolean }) => item.selected === true).length;
    const someCreditTokenSelected = selectedCreditsCount > 0;

    const selectionColor = trayPlayer === connectedPlayer
        ? 'var(--selection-green)'
        : 'var(--selection-red)';

    const popupUuid = `${trayPlayer}-credits`;
    const isPopupOpen = popups.some(popup => popup.uuid === popupUuid);

    // Update popup data when credits change while popup is open
    useEffect(() => {
        if (isPopupOpen) {
            const playerName = connectedPlayer !== trayPlayer ? 'Your Opponent\'s' : 'Your';
            openPopup('pile', {
                uuid: popupUuid,
                title: `${playerName} Credits`,
                cards: credits,
                source: PopupSource.User,
                buttons: null
            });
        }
    }, [credits, isPopupOpen, connectedPlayer, trayPlayer, popupUuid, openPopup]);

    // Determine border and glow styles based on selection state
    const getBorderStyle = () => {
        if (someCreditTokenSelected) {
            return {
                border: '4px solid var(--selection-blue)',
                boxShadow: '0 0 7px 3px var(--selection-blue)',
            };
        }
        if (someCreditTokenSelectable) {
            return {
                border: `2px solid ${selectionColor}`,
                boxShadow: 'none',
            };
        }
        return {
            border: 'none',
            boxShadow: 'none',
        };
    };

    const borderStyle = getBorderStyle();

    // ------------------------STYLES------------------------//
    const styles = {
        cardStyle: {
            width: '100%', // Fill parent container width
            height: 'auto', // Auto height instead of maxHeight
            minHeight: 'fit-content',
            background: someCreditTokenSelected
                ? 'rgba(0, 0, 255, 0.08)'
                : someCreditTokenSelectable
                    ? (trayPlayer === connectedPlayer ? 'rgba(0, 255, 0, 0.08)' : 'rgba(255, 0, 0, 0.08)')
                    : 'transparent',
            display: 'flex',
            position: 'relative',
            borderRadius: '5px',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0.5rem 0.4rem', // Further reduced padding
            overflow: 'visible',
            cursor: someCreditTokenSelectable ? 'pointer' : 'default',
            ...borderStyle,
            ...(!(someCreditTokenSelectable || someCreditTokenSelected) && debugBorder('orange')),
            '&:hover': {
                background:
                    trayPlayer === connectedPlayer
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.4)',
            },
        },
        selectionBadge: {
            position: 'absolute',
            top: 0,
            right: 0,
            transform: 'translate(50%, -50%)',
            backgroundColor: 'var(--selection-blue)',
            color: '#1a1a2e',
            borderRadius: '12px',
            minWidth: '22px',
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            padding: '2px 8px',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        },
        iconStyle: {
            width: 'clamp(1.2em, 0.7rem + 0.7vw, 1.6em)',
            top: '5%',
            height: 'auto',
            aspectRatio: '1 / 1.4',
            alignSelf: 'center',
            position: 'relative', // Add relative positioning for absolute child
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        boxStyle: {
            ...debugBorder('green'),
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row', // Always horizontal
            position: 'relative', 
            zIndex: 1,
            gap: '0.5rem', // Add consistent spacing
        },
        creditCountText: {
            fontWeight: '600',
            fontSize: isPortrait ? 'clamp(1.1rem, 0.65rem + 1.0vw, 1.8rem)' :
                'clamp(1.1rem, 0.50rem + 1.0vw, 1.8rem)',
            color: 'white',
            lineHeight: 1,
            margin: 0,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
        },
        creditBorderLeft: {
            background: `
            url('border-res-lt.svg') no-repeat left top`,
            backgroundSize: 'auto 100%',
            mixBlendMode: 'soft-light',
            opacity: 0.3,
            width: '100%',
            height: '100%',
            position: 'absolute',
            pointerEvents: 'none', 
            zIndex: 2,
        },
        creditBorderRight: {
            background: `
            url('border-res-rt.svg') no-repeat right top`,
            backgroundSize: 'auto 100%',
            mixBlendMode: 'soft-light',
            opacity: 0.3,
            width: '100%',
            height: '100%',
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 2,
        },
        creditBlankIcon: {
            position: 'absolute',
            right: '50%',
            top: '50%',
            width: '80%',
            aspectRatio: '1 / 1',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/BlankIcon.png)',
            zIndex: 3,
        },
    };

    const handleCreditsClick = () => {
        const playerName = connectedPlayer !== trayPlayer ? 'Your Opponent\'s' : 'Your';
        const existingPopup = popups.find(popup => popup.uuid === popupUuid);

        if (existingPopup && existingPopup.source === PopupSource.PromptState) {
            // TODO: allow game prompt to be toggled
        } else {
            togglePopup('pile', {
                uuid: popupUuid,
                title: `${playerName} Credits`,
                cards: credits,
                source: PopupSource.User,
                buttons: null
            });
        }
    };

    return (
        <Card
            ref={containerRef}
            sx={styles.cardStyle}
            onClick={handleCreditsClick}
            elevation={0}
        >
            {someCreditTokenSelected && (
                <Box sx={styles.selectionBadge}>
                    {selectedCreditsCount}
                </Box>
            )}
            <Box sx={styles.creditBorderRight} />
            <Box sx={styles.creditBorderLeft} />

            <CardContent sx={{ display: 'flex' }}>
                <Box sx={styles.boxStyle}>
                    <Box sx={styles.iconStyle}>
                        <Image
                            src="/CreditTokenIcon.png"
                            alt="Credit Token Icon"
                            style={{ width: '100%', height: 'auto' }}
                            height={72}
                            width={54}
                        />
                        {someCreditIsBlanked && (
                            <Box sx={styles.creditBlankIcon}/>
                        )}
                    </Box>
                    <Typography sx={styles.creditCountText}>
                        {creditTokenCount}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default Credits;