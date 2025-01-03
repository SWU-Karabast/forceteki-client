import React from 'react';
import { Card, CardContent, Box, Typography, Button } from '@mui/material';
import GameCard from '../../../_sharedcomponents/Cards/GameCard/GameCard';
import { IDeckDiscardProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';

const DeckDiscard: React.FC<IDeckDiscardProps> = (
    trayPlayer
) => {
    const { gameState } = useGame();
    const { openPopup } = usePopup();

    // ------------------------STYLES------------------------//
    const containerStyle = {
        display: 'flex',
        flexDirection: 'row',
        gap: '1vw',
        justifyContent: 'center',
        alignItems: 'center',
    };

    const discardCardStyle = {
        backgroundColor: '#282828E6',
        width: '7vh',
        height: '9.5vh',
    };

    const cardContentStyle = {
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
    };

    const discardTextStyle = {
        fontFamily: 'var(--font-barlow), sans-serif',
        fontWeight: '800',
        fontSize: '1.2em',
        color: 'white',
    };

    const pileStyle = {
        backgroundColor: 'transparent',
        padding: '0',
        borderRadius: '16px',
    };

    return (
        <Box sx={containerStyle}>
            <Button
                variant="text"
                sx={pileStyle}
                onClick={() =>
                    openPopup('pile', {
                        uuid: `${trayPlayer.trayPlayer}-discard`,
                        title: `${trayPlayer.trayPlayer}'s discard`,
                        cards:
                            gameState?.players[trayPlayer.trayPlayer]?.cardPiles['discard'],
                    })
                }
            >

                <Card sx={discardCardStyle}>
                    <CardContent sx={cardContentStyle}>
                        <Typography sx={discardTextStyle}>Discard</Typography>
                    </CardContent>
                </Card>
            </Button>
            <Card sx={discardCardStyle}>
                <CardContent sx={cardContentStyle}>
                    <Typography sx={discardTextStyle}>Deck</Typography>
                </CardContent>
            </Card>
        </Box>
    );
};

export default DeckDiscard;
