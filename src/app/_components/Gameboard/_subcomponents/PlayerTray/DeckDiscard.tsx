import React from 'react';
import { Card, Box, Typography } from '@mui/material';
import { IDeckDiscardProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { ICardData } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { PopupSource } from '@/app/_components/_sharedcomponents/Popup/Popup.types';

const DeckDiscard: React.FC<IDeckDiscardProps> = (
    trayPlayer
) => {
    const { gameState, connectedPlayer } = useGame();
    const { togglePopup, popups } = usePopup();

    const handleDiscardToggle = () => {
        const playerName = connectedPlayer != trayPlayer.trayPlayer ? 'Your Opponent\'s' : 'Your';
        const existingPopup = popups.find(popup => popup.uuid === `${trayPlayer.trayPlayer}-discard`);

        if (existingPopup && existingPopup.source === PopupSource.PromptState) {
            // TODO: allow game propt to be toggled
            // const { type, ...restData } = existingPopup
            // togglePopup(type, {
            //     ...restData
            // });
        } else {
            togglePopup('pile', {
                uuid: `${trayPlayer.trayPlayer}-discard`,
                title: `${playerName} discard`,
                cards: gameState?.players[trayPlayer.trayPlayer]?.cardPiles['discard'],
                source: PopupSource.User,
                buttons: null
            })
        }
    }

    const styles = {
        containerStyle: {
            display: 'flex',
            flexDirection: 'row',
            gap: '1rem',
            flex: 1,
            height: '100%',
            justifyContent: 'center',
        },
        discard: {
            discardCardStyle: (cardData?: ICardData) => ({
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                height: '100%',
                aspectRatio: '1 / 1.4',
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
                height: '100%',
                aspectRatio: '1 / 1.4',
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
            <Box
                sx={styles.discard.discardCardStyle(gameState?.players[trayPlayer.trayPlayer]?.cardPiles['discard'].at(-1))}
                onClick={handleDiscardToggle}
            />
            <Box sx={styles.deck.deckCardStyle}>
                {deckComponent}
            </Box>
        </Box>
    );
};

export default DeckDiscard;
