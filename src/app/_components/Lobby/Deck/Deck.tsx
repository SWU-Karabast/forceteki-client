import React from 'react';
import { Card, Box, Typography, Divider } from '@mui/material';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import { CardStyle, ICardData } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import GameCard from '@/app/_components/_sharedcomponents/Cards/GameCard';
import { ILobbyUserProps } from '@/app/_components/Lobby/LobbyTypes';
import { DeckValidationFailureReason, IDeckValidationFailures } from '@/app/_validators/DeckValidation/DeckValidationTypes';
import { GamesToWinMode } from '@/app/_constants/constants';

const Deck: React.FC = () => {
    const { connectedPlayer, lobbyState, sendLobbyMessage } = useGame();
    const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null;

    // Bo3 state - check if sideboarding should be disabled (Game 1 of Bo3)
    const winHistory = lobbyState?.winHistory || null;
    const gamesToWinMode = winHistory?.gamesToWinMode || GamesToWinMode.BestOfOne;
    const currentGameNumber = winHistory?.currentGameNumber || 1;
    const isBo3Game1 = gamesToWinMode === GamesToWinMode.BestOfThree && currentGameNumber === 1;

    const notImplementedList = connectedUser?.unimplementedCards ?? [];
    const isCardNotImplemented = (cardId: string | undefined) =>
        notImplementedList.some((item:ICardData) => item.id === cardId);
    // set decks for connectedUser
    const userMain = connectedUser?.deck?.deck ?? []
    const usersSideboard = connectedUser?.deck?.sideboard ?? []

    // sort main deck and sideboard by card cost ascending
    const sortedUserMain = [...userMain].sort((a: { cost: number }, b: { cost: number }) => a.cost - b.cost);
    const sortedUsersSideboard = [...usersSideboard].sort((a: { cost: number }, b: { cost: number }) => a.cost - b.cost);

    // Calculate the total counts
    const deckCount = userMain.reduce(
        (sum: number, item: { count: number; }) => sum + (item.count || 0),
        0
    ) ?? 0;

    const sideboardCount = usersSideboard.reduce(
        (sum: number, item: { count: number; }) => sum + (item.count || 0),
        0
    ) ?? 0;

    // check if errors exist
    const deckErrors: IDeckValidationFailures = connectedUser?.deckErrors ?? {};
    const mainboardError = Object.keys(deckErrors).includes(DeckValidationFailureReason.MinMainboardSizeNotMet);
    const sideboardError = Object.keys(deckErrors).includes(DeckValidationFailureReason.MaxSideboardSizeExceeded);

    // sideboard and deck limits
    const minDeckSize = connectedUser?.minDeckSize ?? 50;
    const maxSideBoard = connectedUser?.maxSideBoard ?? 10;

    // ------------------------STYLES------------------------//
    const styles = {
        cardStyle: {
            borderRadius: '1.1em',
            pt: '.8em',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#00000080',
            backdropFilter: 'blur(30px)',
        },
        headerBoxStyle: {
            display: 'flex',
            height: '50px',
            width: '100%',
            justifyContent: 'space-between',
            position: 'sticky',
            top: '0',
            zIndex: 1,
        },
        titleTextStyle: {
            fontSize: '2em',
            fontWeight: 'bold',
            color: 'white',
            ml: '.6em',
        },
        deckSizeTextStyle: {
            fontSize: '2em',
            fontWeight: '400',
            color: 'white',
            mb: 0
        },
        dividerStyle: {
            backgroundColor: '#fff',
            mt: '.5vh',
            mb: '0.5vh',
            alignSelf: 'center',
            height: '1px',
        },
        cardWrapper: {
            width: {
                xs: '5rem',
                md: '6rem',
                xl: '6.8rem'
            }
        },
        mainContainerStyle: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1em',
            p: '1em',
            textWrap: 'wrap',
        },
        sideboardUnlimitedContainer: {
            display: 'flex',
            alignItems: 'center',
            mr: '.6em'
        },
        lineTypography: {
            fontSize: '1.8em',
            mr: '2px',
            mb: 0
        },
        infiniteSymbol: {
            fontSize: '1.6em',
            color: 'white',
            mt: '0.3rem'
        },
        sideboardOverlayContainer: {
            position: 'relative',
        },
        sideboardOverlay: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
        },
        sideboardOverlayText: {
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: '500',
            textAlign: 'center',
            padding: '1rem',
        },
    };

    return (
        <Box sx={{ width:'100%', height:'100%', overflowY: 'scroll' }}>
            <Card sx={styles.cardStyle}>
                <Box sx={styles.headerBoxStyle}>
                    <Typography sx={styles.titleTextStyle}>Your Deck</Typography>
                    <Box sx={{ display : 'flex', alignItems: 'center', mr: 1 }}>
                        <Typography sx={{ ...styles.deckSizeTextStyle, mr:'0px',color: mainboardError ? 'red' : styles.deckSizeTextStyle.color }}>
                            {deckCount}
                        </Typography>
                        <Typography sx={styles.deckSizeTextStyle}>/{minDeckSize}</Typography>
                    </Box>
                </Box>
                <Box sx={styles.mainContainerStyle}>
                    {sortedUserMain.map((card:ICardData) => (
                        <Box key={card.id} sx={styles.cardWrapper}>
                            <GameCard
                                key={card.id}
                                card={{ ...card, unimplemented: isCardNotImplemented(card.id) }}
                                cardStyle={CardStyle.Lobby}
                                disabled={connectedUser.ready || isBo3Game1}
                                onClick={isBo3Game1 ? undefined : () => sendLobbyMessage(['updateDeck','Deck', card.id])}
                            />
                        </Box>
                    ))}
                </Box>
                {usersSideboard?.length > 0 && (
                    <>
                        <Box sx={styles.headerBoxStyle}>
                            <Typography sx={styles.titleTextStyle}>Sideboard</Typography>
                            <Divider sx={styles.dividerStyle} />
                            <Box sx={{ display : 'flex', alignItems: 'center', mr: 1 }}>
                                <Typography sx={{ ...styles.deckSizeTextStyle, color: sideboardError ? 'red' : styles.deckSizeTextStyle.color }}>
                                    {sideboardCount}
                                </Typography>
                                {maxSideBoard === -1 ? (
                                    <Box sx={styles.sideboardUnlimitedContainer}>
                                        <Typography sx={styles.lineTypography}>/</Typography>
                                        <AllInclusiveIcon sx={styles.infiniteSymbol} />
                                    </Box>
                                ) : (
                                    <Typography sx={styles.deckSizeTextStyle}>
                                        /{maxSideBoard}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        <Box sx={styles.sideboardOverlayContainer}>
                            {isBo3Game1 && (
                                <Box sx={styles.sideboardOverlay}>
                                    <Typography sx={styles.sideboardOverlayText}>
                                        Sideboarding is restricted for Game 1
                                    </Typography>
                                </Box>
                            )}
                            <Box sx={styles.mainContainerStyle}>
                                {sortedUsersSideboard.map((card:ICardData) => (
                                    <Box key={card.id} sx={styles.cardWrapper}>
                                        <GameCard
                                            key={card.id}
                                            card={{ ...card, unimplemented: isCardNotImplemented(card.id) }}
                                            cardStyle={CardStyle.Lobby}
                                            disabled={connectedUser.ready || isBo3Game1}
                                            onClick={isBo3Game1 ? undefined : () => sendLobbyMessage(['updateDeck','Sideboard', card.id])}
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                    </>
                )}
            </Card>
        </Box>
    );
};

export default Deck;