import React from 'react';
import { Card, Box, Typography } from '@mui/material';
import GameCard from '../../../_sharedcomponents/Cards/GameCard/GameCard';
import { IDeckDiscardProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';

const DeckDiscard: React.FC<IDeckDiscardProps> = (
    trayPlayer
) => {
    const { gameState, connectedPlayer } = useGame();
    const { togglePopup } = usePopup();

    const styles = {
        containerStyle: {
            display: 'flex',
            flexDirection: 'row',
            gap: '1vw',
            justifyContent: 'center',
            alignItems: 'center',
        },
        discard: {
            discardCardStyle: {
                backgroundColor: '#282828E6',
                width: '7vh',
                height: '9.5vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                '&:hover': {
                    backgroundColor: '#282828',
                    cursor: 'pointer',
                    scale: '1.1',
                    transition: 'all ease-in-out 0.15s',
                },
            },
            discardContentStyle: {
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: '800',
                fontSize: '1.2em',
                color: 'white',
                textAlign: 'center',
            }
        },
        deck: {

            deckCardStyle: {
                backgroundColor: 'black',
                backgroundPosition: 'center',
                backgroundSize: 'contain',
                backgroundImage: 'url(\'/card-back.png\')',
                backgroundRepeat: 'no-repeat',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                width: '7vh',
                height: '9.5vh',
            },

            deckContentStyle: {
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: '800',
                fontSize: '2em',
                color: 'white',
                textAlign: 'center',
                lineHeight: '50px',
                // Text shadowBox
                backgroundColor: 'rgba(0, 0, 0, .75)',
                borderRadius: '100px',
                width: '50px',
                height: '50px',
            }
        }
    }

    const discardComponent = gameState?.players[trayPlayer.trayPlayer]?.cardPiles['discard'].length > 0 ?
        <GameCard card={gameState?.players[trayPlayer.trayPlayer]?.cardPiles['discard'][0]} /> : <Typography sx={styles.discard.discardContentStyle}>Discard</Typography>

    const deckComponent = <Typography sx={styles.deck.deckContentStyle}>{gameState?.players[trayPlayer.trayPlayer]?.cardPiles['deck'].length}</Typography>

    return (
        <Box sx={styles.containerStyle}>
            <Card
                sx={styles.discard.discardCardStyle}
                onClick={() => {
                    const playerName = connectedPlayer != trayPlayer.trayPlayer ? 'Your Opponent\'s' : 'Your';

                    togglePopup('pile', {
                        uuid: `${trayPlayer.trayPlayer}-discard`,
                        title: `${playerName} discard`,
                        cards:
                            gameState?.players[trayPlayer.trayPlayer]?.cardPiles['discard'],
                    })
                }
                }
            >
                {discardComponent}
            </Card>
            <Card sx={styles.deck.deckCardStyle}>
                {deckComponent}
            </Card>
        </Box>
    );
};

export default DeckDiscard;
