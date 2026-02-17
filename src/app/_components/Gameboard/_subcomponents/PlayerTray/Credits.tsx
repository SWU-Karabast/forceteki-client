import React, { useRef } from 'react';
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
    const { sendGameMessage, gameState, connectedPlayer } = useGame();
    const { togglePopup, popups } = usePopup();
    const containerRef = useRef<HTMLDivElement>(null);
    const { isPortrait } = useScreenOrientation();

    const creditTokenCount = gameState.players[trayPlayer].credits.count;
    const selectableCredit = gameState.players[trayPlayer].credits.selectionState?.selectable || false;
    const creditTokenUuids = gameState.players[trayPlayer].credits.uuids;
    const creditsAreBlanked = gameState.players[trayPlayer].credits.isBlanked || false;

    const selectionColor = trayPlayer === connectedPlayer
        ? 'var(--selection-green)'
        : 'var(--selection-red)';

    // ------------------------STYLES------------------------//
    const styles = {
        cardStyle: {
            width: '100%', // Fill parent container width
            height: 'auto', // Auto height instead of maxHeight
            minHeight: 'fit-content',
            background: selectableCredit ? (trayPlayer === connectedPlayer ? 'rgba(0, 255, 0, 0.08)' : 'rgba(255, 0, 0, 0.08)') : 'transparent',
            display: 'flex',
            position: 'relative',
            borderRadius: '5px',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'background-color 0.3s ease',
            padding: '0.5rem 0.4rem', // Further reduced padding
            overflow: 'visible',
            cursor: selectableCredit ? 'pointer' : 'default',
            border: selectableCredit ? `2px solid ${selectionColor}` : 'none',
            ...(!selectableCredit && debugBorder('orange')),
            '&:hover': {
                background:
                    trayPlayer === connectedPlayer
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.4)',
            },
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
        // // Send message with the first credit token UUID
        // const creditTokenUuid = creditTokenUuids[0];
        // sendGameMessage(['cardClicked', creditTokenUuid]);
        const playerName = connectedPlayer != trayPlayer ? 'Your Opponent\'s' : 'Your';
        const existingPopup = popups.find(popup => popup.uuid === `${trayPlayer}-resources`);

        if (existingPopup && existingPopup.source === PopupSource.PromptState) {
            // TODO: allow game propt to be toggled
            // const { type, ...restData } = existingPopup
            // togglePopup(type, {
            //     ...restData
            // });
        } else {
            togglePopup('pile', {
                uuid: `${trayPlayer}-credits`,
                title: `${playerName} Credits`,
                cards: gameState?.players[trayPlayer]?.credits,
                source: PopupSource.User,
                buttons: null
            })
        }
    };

    return (
        <Card
            ref={containerRef}
            sx={styles.cardStyle}
            onClick={handleCreditsClick}
            elevation={0}
        >
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
                        {creditsAreBlanked && (
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