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
            // Ensure container is position: relative so our pseudo-element is placed over it
            position: 'relative',
            borderRadius: '5px',
            width: 'auto',
            height: '6rem',
            overflow: 'hidden', // so pseudo-element doesn't stick out
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '0 1.5rem',
            '--Paper-shadow': '0 !important',
            background: 'none',

            // 2) Pseudo-element for hover gradient:
            '&::before': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(rgba(24,53,81,0.6), rgba(77,118,155,0.6))',
                opacity: 0,
                transition: 'opacity 0.2s ease-out',
                pointerEvents: 'none', // don’t block clicks on the card
            },

            // 3) On hover, fade the pseudo-element's opacity to 1
            '.playerCardTrayWrapper &:hover::before': {
                opacity: 1,
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
            position: 'relative', 
            zIndex: 1, 
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
                    <Typography sx={styles.availableAndTotalResourcesTextStyle}>
                        {availableResources}/{totalResources}
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
};

export default Resources;
