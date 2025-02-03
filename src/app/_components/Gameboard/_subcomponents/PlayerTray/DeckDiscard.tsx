import React from 'react';
import { Card, Box, Typography } from '@mui/material';
import GameCard from '../../../_sharedcomponents/Cards/GameCard';
import { IDeckDiscardProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { ICardData } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

const DeckDiscard: React.FC<IDeckDiscardProps> = (
    trayPlayer
) => {
    const { gameState, connectedPlayer } = useGame();
    const { togglePopup } = usePopup();

    const styles = {
        containerStyle: {
            display: 'flex',
            flexDirection: 'row',
            gap: '1rem',
            justifyContent: 'center',
            alignItems: 'center',
        },
        discard: {
            discardCardStyle: (cardData?: ICardData) => ({
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                width: '4.6rem',
                height: '6.5rem',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': {
                    cursor: 'pointer',
                    scale: '1.1',
                    transition: 'all ease-in-out 0.15s',
                },
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                backgroundImage: cardData ? `url(${s3CardImageURL(cardData)})` : null,
                backgroundRepeat: 'no-repeat',
            }),
            discardContentStyle: {
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: '800',
                fontSize: '1.2em',
                color: 'white',
                textAlign: 'center',
            },
        },
        deck: {

            deckCardStyle: {
                backgroundColor: 'black',
                backgroundPosition: 'center',
                backgroundSize: '88%',
                backgroundImage: 'url(\'/card-back.png\')',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '4.6rem',
                height: '6.5rem',
                borderRadius: '5px',
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

    const deckComponent = <Typography sx={styles.deck.deckContentStyle}>{gameState?.players[trayPlayer.trayPlayer]?.cardPiles['deck'].length}</Typography>

    return (
        <Box sx={styles.containerStyle}>
            <Card
                sx={styles.discard.discardCardStyle(gameState?.players[trayPlayer.trayPlayer]?.cardPiles['discard'][0])}
                onClick={() => {
                    const playerName = connectedPlayer != trayPlayer.trayPlayer ? 'Your Opponent\'s' : 'Your';

                    togglePopup('pile', {
                        uuid: `${trayPlayer.trayPlayer}-discard`,
                        title: `${playerName} discard`,
                        cards:
                            gameState?.players[trayPlayer.trayPlayer]?.cardPiles['discard'],
                    })
                }}
            />
            <Card sx={styles.deck.deckCardStyle}>
                {deckComponent}
            </Card>
        </Box>
    );
};

export default DeckDiscard;
