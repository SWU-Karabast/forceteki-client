import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import Image from 'next/image';
import { s3TokenImageURL } from '@/app/_utils/s3Utils';
import { IResourcesProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';

const Resources: React.FC<IResourcesProps> = ({
    trayPlayer
}) => {
    const { gameState, connectedPlayer } = useGame();
    const { togglePopup } = usePopup();

    const availableResources = gameState.players[trayPlayer].availableResources;
    const totalResources = gameState.players[trayPlayer].cardPiles.resources.length;

    // ------------------------STYLES------------------------//
    const styles = {
        cardStyle: {
            width: 'auto',
            background: 'transparent',
            display: 'flex',
            position: 'relative',
            borderRadius: '5px',
            height: '6.5rem',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'background-color 0.3s ease',
            padding: '1rem 2rem',
            overflow: 'visible',
            '&:hover': {
                background:
                    trayPlayer === 'player'
                        ? 'linear-gradient(to top, white, transparent)'
                        : null,
            },
        },
        
        imageStyle: {
            width: '1.6em',
            height: 'auto',
            marginRight: '10px',
        },
        boxStyle: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            cursor: 'pointer',
        },
        availableAndTotalResourcesTextStyle: {
            fontWeight: '800',
            fontSize: '2.2em',
            color: 'white',
        },

        resourceBorderLeft: {
            background: `
            url('border-res-lt.svg') no-repeat left top,
            url('border-res-lb.svg') no-repeat left bottom`,
            'mix-blend-mode': 'soft-light',
            width: '100%',
            height: '100%',
            position: 'absolute',
        },
        resourceBorderRight: {
            background: `
            url('border-res-rt.svg') no-repeat right top,
            url('border-res-rb.svg') no-repeat right bottom`,
            'mix-blend-mode': 'soft-light',
            width: '100%',
            height: '100%',
            position: 'absolute',
        },
    };



    return (
        <Card
            sx={styles.cardStyle}
            onClick={() => {
                if (trayPlayer !== connectedPlayer) return;

                togglePopup('pile', {
                    uuid: `${connectedPlayer}-resources`,
                    title: 'Your Resources',
                    cards:
                        gameState?.players[connectedPlayer]?.cardPiles['resources'],
                })
            }}
        >
            <Box sx={styles.resourceBorderRight} /><Box sx={styles.resourceBorderRight} /> 
            <Box sx={styles.resourceBorderLeft} /><Box sx={styles.resourceBorderLeft} />

            <CardContent sx={{ display: 'flex' }}>
                <Box sx={styles.boxStyle}>
                    <Image
                        src={s3TokenImageURL('resource-icon')}
                        alt="Resource Icon"
                        style={styles.imageStyle}
                        height={72}
                        width={54}
                    />
                    <Typography sx={styles.availableAndTotalResourcesTextStyle}>
                        {availableResources}/{totalResources}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default Resources;
