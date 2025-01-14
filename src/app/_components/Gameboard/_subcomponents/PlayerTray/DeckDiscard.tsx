import React from 'react';
import { Card, Box, Typography } from '@mui/material';
import GameCard from '../../../_sharedcomponents/Cards/GameCard/GameCard';
import { IDeckDiscardProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';

const DeckDiscard: React.FC<IDeckDiscardProps> = (
    trayPlayer
) => {
    const { gameState } = useGame();
    const { togglePopup } = usePopup();

    // ------------------------STYLES------------------------//
    const containerStyle = {
        display: 'flex',
        flexDirection: 'row',
        gap: '1vw',
        justifyContent: 'center',
        alignItems: 'center',
    };

    // ------------------------DISCARD------------------------//
    const selectableStyle = {
        '&:hover': {
            backgroundColor: '#282828',
            cursor: 'pointer',
            scale: '1.1',
            transition: 'all ease-in-out 0.15s',
        },
    }

    const discardCardStyle = {
        backgroundColor: '#282828E6',
        width: '7vh',
        height: '9.5vh',
        display: 'flex',
        alignItems:'center',
        justifyContent:'center',
        ...selectableStyle
    };
    
    const discardContentStyle = {
        fontFamily: 'var(--font-barlow), sans-serif',
        fontWeight: '800',
        fontSize: '1.2em',
        color: 'white',
        textAlign:'center',
    };


    // ------------------------DECK------------------------//
    const textShadowBoxStyle = {
        backgroundColor: 'rgba(0, 0, 0, .75)',
        borderRadius: '100px',
        width: '50px',
        height: '50px',
    };

    const deckCardStyle = {
        backgroundColor: 'black',
        backgroundPosition: 'center',
        backgroundSize:'contain',
        backgroundImage: 'url(\'/card-back.png\')',
        backgroundRepeat: 'no-repeat',

        display: 'flex',
        alignItems:'center',
        justifyContent:'center',

        width: '7vh',
        height: '9.5vh',
    };
    
    const deckContentStyle = {
        fontFamily: 'var(--font-barlow), sans-serif',
        fontWeight: '800',
        fontSize: '2em',
        color: 'white',
        textAlign:'center',
        lineHeight: '50px',
        ...textShadowBoxStyle
    };

    return (
        <Box sx={containerStyle}>
            <Card
                sx={discardCardStyle}
                onClick={() =>
                    togglePopup('pile', {
                        uuid: `${trayPlayer.trayPlayer}-discard`,
                        title: `${trayPlayer.trayPlayer}'s discard`,
                        cards:
                        gameState?.players[trayPlayer.trayPlayer]?.cardPiles['discard'],
                    })
                }
            >
                {
                    gameState?.players[trayPlayer.trayPlayer]?.cardPiles['discard'].length > 0 ?
                        <GameCard card={gameState?.players[trayPlayer.trayPlayer]?.cardPiles['discard'][0]} /> : <Typography sx={discardContentStyle}>Discard</Typography>
                }
            </Card>
            <Card sx={deckCardStyle}>
                <Typography sx={deckContentStyle}>{gameState?.players[trayPlayer.trayPlayer]?.cardPiles['deck'].length}</Typography>

            </Card>
        </Box>
    );
};

export default DeckDiscard;
