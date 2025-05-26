import React, { useRef } from 'react';
import { Card, CardContent, Box, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Image from 'next/image';
import { s3TokenImageURL } from '@/app/_utils/s3Utils';
import { debugBorder } from '@/app/_utils/debug';
import { IResourcesProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';
import { PopupSource } from '@/app/_components/_sharedcomponents/Popup/Popup.types';
import useScreenOrientation from '@/app/_utils/useScreenOrientation';
import { AspectRatio } from '@mui/icons-material';

/**
 * Determines if resources should use column style based on screen size and orientation
 */
const useResourceLayout = () => {
    const theme = useTheme();
    const { isPortrait } = useScreenOrientation();
    
    // use desktopHD (1600px) as breakpoint for going 'narrow'
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('desktopHD'));
    // Never use column style in portrait mode, regardless of screen size
    // In landscape, use column style only on smaller screens
    const shouldUseColumnStyle = !isPortrait && isSmallScreen;
    
    return { shouldUseColumnStyle, isPortrait };
};

const Resources: React.FC<IResourcesProps> = ({
    trayPlayer
}) => {
    const { gameState, connectedPlayer } = useGame();
    const { togglePopup, popups } = usePopup();
    const containerRef = useRef<HTMLDivElement>(null);
    const { shouldUseColumnStyle, isPortrait } = useResourceLayout();

    const availableResources = gameState.players[trayPlayer].availableResources;
    const totalResources = gameState.players[trayPlayer].cardPiles.resources.length;
    const selectableResource = gameState.players[trayPlayer].cardPiles.resources.some((item: { selectable: boolean }) => item.selectable === true);

    const handleResourceToggle = () => {
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
                uuid: `${trayPlayer}-resources`,
                title: `${playerName} Resources`,
                cards: gameState?.players[trayPlayer]?.cardPiles['resources'],
                source: PopupSource.User,
                buttons: null
            })
        }
    }

    // ------------------------STYLES------------------------//
    const styles = {
        cardStyle: {
            width: isPortrait ? 'auto' : '30%',
            maxHeight: '100%',
            background: selectableResource ? 'rgba(114, 249, 121, 0.08)' : 'transparent',
            display: 'flex',
            position: 'relative',
            borderRadius: '5px',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'background-color 0.3s ease',
            padding: '1.5rem .8rem',
            overflow: 'visible',
            cursor: 'pointer',
            border: selectableResource ? '2px solid var(--selection-green)' : 'none',
            ...(!selectableResource && debugBorder('purple')),
            '&:hover': {
                background:
                    trayPlayer === connectedPlayer
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(0, 0, 0, 0.4)',
            },
        },
        
        imageStyle: {
            width: shouldUseColumnStyle ? 'clamp(0.6em, 0.4rem + 0.8vw, 1.2em)' :
                'clamp(1.0em, 0.55rem + 0.6vw, 1.4em)',
            height: 'auto',
            aspectRatio: '1 / 1.4',
            margin: isPortrait || !shouldUseColumnStyle ? '0 0.5rem 0 0' : '0',
            alignSelf: isPortrait ? 'auto' : 'center',
        },
        boxStyle: {
            ...debugBorder('green'),
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: isPortrait ? 'row' : shouldUseColumnStyle ? 'column' : 'row',
            position: 'relative', 
            zIndex: 1, 
        },
        availableResourcesText: {
            fontWeight: '600',
            fontSize: isPortrait ? 'clamp(1.1rem, 0.65rem + 1.0vw, 1.8rem)' :
                'clamp(1.1rem, 0.50rem + 1.0vw, 1.8rem)',
            color: 'white',
        },
        totalResourcesText: {
            fontWeight: '600',
            fontSize: isPortrait ? 'clamp(1.1rem, 0.65rem + 1.0vw, 1.8rem)' :
                'clamp(1.1rem, 0.50rem + 1.0vw, 1.8rem)',
            color: 'white',
        },
        resourceBorderLeft: {
            background: `
            url('border-res-lt.svg') no-repeat left top,
            url('border-res-lb.svg') no-repeat left bottom`,
            mixBlendMode: 'soft-light',
            width: '100%',
            height: '100%',
            position: 'absolute',
            pointerEvents: 'none', 
            zIndex: 2, // above the pseudo-element
        },
        resourceBorderRight: {
            background: `
            url('border-res-rt.svg') no-repeat right top,
            url('border-res-rb.svg') no-repeat right bottom`,
            mixBlendMode: 'soft-light',
            width: '100%',
            height: '100%',
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 2, // above the pseudo-element
        },
    };



    return (
        <Card
            ref={containerRef}
            sx={styles.cardStyle}
            onClick={handleResourceToggle}
        >
            <Box sx={styles.resourceBorderRight} />
            <Box sx={styles.resourceBorderLeft} />

            <CardContent sx={{ display: 'flex' }}>
                <Box sx={styles.boxStyle}>
                    <Image
                        src={s3TokenImageURL('resource-icon')}
                        alt="Resource Icon"
                        style={styles.imageStyle}
                        height={72}
                        width={54}
                    />
                    <Typography sx={styles.availableResourcesText}>
                        {availableResources}/
                        <Typography component={'span'} sx={styles.totalResourcesText}>{totalResources}</Typography>
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default Resources;
