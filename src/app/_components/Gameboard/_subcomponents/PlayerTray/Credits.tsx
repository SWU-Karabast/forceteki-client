import React, { useRef } from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { debugBorder } from '@/app/_utils/debug';
import { ICreditsProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import useScreenOrientation from '@/app/_utils/useScreenOrientation';

const Credits: React.FC<ICreditsProps> = ({
    trayPlayer
}) => {
    const { gameState, connectedPlayer } = useGame();
    const containerRef = useRef<HTMLDivElement>(null);
    const { isPortrait } = useScreenOrientation();

    const creditTokenCount = gameState.players[trayPlayer].credits.count;
    const selectableCredit = gameState.players[trayPlayer].credits.selectable;

    // ------------------------STYLES------------------------//
    const styles = {
        cardStyle: {
            width: '100%', // Fill parent container width
            height: 'auto', // Auto height instead of maxHeight
            minHeight: 'fit-content',
            background: selectableCredit ? 'rgba(114, 249, 121, 0.08)' : 'transparent',
            display: 'flex',
            position: 'relative',
            borderRadius: '5px',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'background-color 0.3s ease',
            padding: '0.5rem 0.4rem', // Further reduced padding
            overflow: 'visible',
            cursor: 'pointer',
            border: selectableCredit ? '2px solid var(--selection-green)' : 'none',
            ...(!selectableCredit && debugBorder('orange')),
            '&:hover': {
                background:
                    trayPlayer === connectedPlayer
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.4)',
            },
        },
        
        iconStyle: {
            width: 'clamp(1.0em, 0.55rem + 0.6vw, 1.4em)',
            height: 'clamp(1.0em, 0.55rem + 0.6vw, 1.4em)',
            backgroundColor: 'gold',
            margin: '0 0.5rem 0 0',
            borderRadius: '2px',
            alignSelf: 'center',
        },
        boxStyle: {
            ...debugBorder('green'),
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row', // Always horizontal
            position: 'relative', 
            zIndex: 1, 
        },
        creditCountText: {
            fontWeight: '600',
            fontSize: isPortrait ? 'clamp(1.1rem, 0.65rem + 1.0vw, 1.8rem)' :
                'clamp(1.1rem, 0.50rem + 1.0vw, 1.8rem)',
            color: 'white',
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
    };

    const handleCreditsClick = () => {
        // TODO: Implement credit token interaction if needed
        console.log('Credits clicked');
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
                    <Box sx={styles.iconStyle} />
                    <Typography sx={styles.creditCountText}>
                        {creditTokenCount}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default Credits;