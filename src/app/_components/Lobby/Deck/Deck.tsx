import React from 'react';
import { Card, Box, Typography, Divider } from '@mui/material';
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
    const cardStyle = {
        borderRadius: '1.1em',
        pt: '.8em',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#00000080',
        backdropFilter: 'blur(30px)',
    };

    const headerBoxStyle = {
        display: 'flex',
        height: '50px',
        width: '100%',
        justifyContent: 'space-between',
        position: 'sticky',
        top: '0',
        zIndex: 1,
    };

    const titleTextStyle = {
        fontSize: '2em',
        fontWeight: 'bold',
        color: 'white',
        ml: '.6em',
    };

    const deckSizeTextStyle = {
        fontSize: '2em',
        fontWeight: '400',
        color: 'white',
        mr: '.6em',
    };
    const dividerStyle = {
        backgroundColor: '#fff',
        mt: '.5vh',
        mb: '0.5vh',
        alignSelf: 'center',
        height: '1px',
    };
    const scrollableBoxStyleSideboard = {
        height: '36vh',
        overflow:'auto',
    };
    const scrollableBoxStyle = {
        height: usersSideboard?.length > 0 ? '50vh' : '86vh',
        overflow:'auto',
    };
    const mainContainerStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1em',
        p: '1em',
        textWrap: 'wrap',
    };

    return (
        <Box sx={{ width:'100%', height:'100%', overflowY: 'scroll' }}>
            <Card sx={cardStyle}>
                <Box sx={headerBoxStyle}>
                    <Typography sx={titleTextStyle}>Your Deck</Typography>
                    <Box sx={{ display : 'flex' }}>
                        <Typography sx={{ ...deckSizeTextStyle, mr:'0px',color: mainboardError ? 'red' : deckSizeTextStyle.color }}>
                            {deckCount}
                        </Typography>
                        <Typography sx={deckSizeTextStyle}>/{minDeckSize}</Typography>
                    </Box>
                </Box>
                <Box
                    sx={scrollableBoxStyle}
                >
                    <Box sx={mainContainerStyle}>
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
                        <Box sx={headerBoxStyle}>
                            <Typography sx={titleTextStyle}>Sideboard</Typography>
                            <Divider sx={dividerStyle} />
                            <Box sx={{ display : 'flex' }}>
                                <Typography sx={{ ...deckSizeTextStyle, mr:'0px', color: sideboardError ? 'red' : deckSizeTextStyle.color }}>
                                    {sideboardCount}
                                </Typography>
                                <Typography sx={deckSizeTextStyle}>
                                    /{maxSideBoard}
                                </Typography>
                            </Box>
                        </Box>
                        <Box
                            sx={scrollableBoxStyleSideboard}
                        >
                            <Box sx={mainContainerStyle}>
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