import React from 'react';
import { Card, Box, Typography, Divider } from '@mui/material';
import AllInclusiveIcon from '@mui/icons-material/AllInclusive';
import { CardStyle, ICardData } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import GameCard from '@/app/_components/_sharedcomponents/Cards/GameCard';
import { ILobbyUserProps } from '@/app/_components/Lobby/LobbyTypes';
import { DeckValidationFailureReason, IDeckValidationFailures } from '@/app/_validators/DeckValidation/DeckValidationTypes';

const Deck: React.FC = () => {
    const { connectedPlayer, lobbyState, sendLobbyMessage } = useGame();
    const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null;

    const notImplementedList = connectedUser?.unimplementedCards ?? [];
    const isCardNotImplemented = (cardId: number | undefined) =>
        notImplementedList.some((item:ICardData) => item.id === cardId);
    // set decks for connectedUser
    const userMain = connectedUser.deck?.deck || []
    const usersSideboard = connectedUser.deck?.sideboard || []

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
    const minDeckSize = connectedUser.minDeckSize;
    const maxSideBoard = connectedUser.maxSideBoard

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
        scrollableBoxStyleSideboard: {
            height: '36vh',
            overflow:'auto',
        },
        scrollableBoxStyle: {
            height: usersSideboard?.length > 0 ? '50vh' : '86vh',
            overflow:'auto',
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
        }
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
                <Box
                    sx={styles.scrollableBoxStyle}
                >
                    <Box sx={styles.mainContainerStyle}>
                        {sortedUserMain.map((card:ICardData) => (
                            <GameCard
                                key={card.id}
                                card={{ ...card, implemented: !isCardNotImplemented(card.id) }}
                                cardStyle={CardStyle.Lobby}
                                disabled={connectedUser.ready}
                                onClick={() => sendLobbyMessage(['updateDeck','Deck', card.id])}
                            />
                        ))}
                    </Box>
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
                        <Box
                            sx={styles.scrollableBoxStyleSideboard}
                        >
                            <Box sx={styles.mainContainerStyle}>
                                {sortedUsersSideboard.map((card:ICardData) => (
                                    <GameCard
                                        key={card.id}
                                        card={{ ...card, implemented: !isCardNotImplemented(card.id) }}
                                        cardStyle={CardStyle.Lobby}
                                        disabled={connectedUser.ready}
                                        onClick={() => sendLobbyMessage(['updateDeck','Sideboard', card.id])}
                                    />
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