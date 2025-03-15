import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import Image from 'next/image';
import { s3TokenImageURL } from '@/app/_utils/s3Utils';
import { IResourcesProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';
import { PopupSource } from '@/app/_components/_sharedcomponents/Popup/Popup.types';

const Resources: React.FC<IResourcesProps> = ({
    trayPlayer
}) => {
    const { gameState, connectedPlayer } = useGame();
    const { togglePopup, popups } = usePopup();

    const availableResources = gameState.players[trayPlayer].availableResources;
    const totalResources = gameState.players[trayPlayer].cardPiles.resources.length;

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
            width: 'auto',
            maxHeight: '100%',
            background: 'transparent',
            display: 'flex',
            position: 'relative',
            borderRadius: '5px',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'background-color 0.3s ease',
            padding: '1.5rem .8rem',
            overflow: 'visible',
            cursor: 'pointer',
            '&:hover': {
                background:
                    trayPlayer === connectedPlayer
                        ? 'rgba(255, 255, 255, 0.1)'
                        : null,
            },
        },
        
        imageStyle: {
            width: '1.4em',
            height: 'auto',
            marginRight: '10px',
        },
        boxStyle: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            position: 'relative', 
            zIndex: 1, 
        },
        availableResourcesText: {
            fontWeight: '600',
            fontSize: '1.8rem',
            color: 'white',
        },
        totalResourcesText: {
            fontWeight: '600',
            fontSize: '1.8rem',
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
