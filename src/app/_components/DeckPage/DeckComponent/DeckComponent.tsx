import React from 'react';
import { Card, Box, Typography, Divider } from '@mui/material';
import { IServerCardData, CardStyle } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import GameCard from '@/app/_components/_sharedcomponents/Cards/GameCard';

const DeckComponent: React.FC = () => {
    // ------------------------STYLES------------------------//
    const cardStyle = {
        borderRadius: '1.1em',
        pt: '.8em',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
    };

    const headerBoxStyle = {
        display: 'flex',
        height: '50px',
        width: '100%',
        justifyContent: 'space-between',
        position: 'sticky',
        top: '0',
        zIndex: 1,
        pt: '.2em',
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

    };
    const scrollableBoxStyle = {

    };
    const mainContainerStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1em',
        p: '1em',
        textWrap: 'wrap',
    };
    // set decks for connectedUser
    const newDeck: [] = [];
    const sideBoard: [] = [];
    console.log('newDeck', newDeck);
    console.log('sideBoard', sideBoard);

    // Calculate the total counts
    const deckCount = newDeck.reduce(
        (sum: number, item: { count: number; }) => sum + (item.count || 0),
        0
    ) ?? 0;

    const sideboardCount = sideBoard.reduce(
        (sum: number, item: { count: number; }) => sum + (item.count || 0),
        0
    ) ?? 0;

    return (
        <Box sx={{ width:'100%', height:'100%', overflowY: 'scroll' }}>
            <Card sx={cardStyle}>
                <Box sx={headerBoxStyle}>
                    <Typography sx={titleTextStyle}>Your Deck</Typography>
                    <Typography sx={deckSizeTextStyle}>
                        {deckCount}/50
                    </Typography>
                </Box>
                <Box
                    sx={scrollableBoxStyle}
                >
                    <Box sx={mainContainerStyle}>
                        {newDeck.map((card:IServerCardData) => (
                            <GameCard
                                key={card.card.id}
                                card={card}
                                cardStyle={CardStyle.Lobby}
                            />
                        ))}
                    </Box>
                </Box>
                {sideBoard?.length > 0 && (
                    <>
                        <Box sx={headerBoxStyle}>
                            <Typography sx={titleTextStyle}>Sideboard</Typography>
                            <Divider sx={dividerStyle} />
                            <Typography sx={deckSizeTextStyle}>
                                {sideboardCount}/10
                            </Typography>
                        </Box>
                        <Box
                            sx={scrollableBoxStyleSideboard}
                        >
                            <Box sx={mainContainerStyle}>
                                {sideBoard.map((card:IServerCardData) => (
                                    <GameCard
                                        key={card.card.id}
                                        card={card}
                                        cardStyle={CardStyle.Lobby}
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

export default DeckComponent;