import React from 'react';
import { Card, Box, Typography, Divider, Popover, PopoverOrigin } from '@mui/material';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { IDeckData } from '@/app/_utils/fetchDeckData';

interface DeckComponentProps {
    mainDeck: IDeckData | undefined
}

const DeckComponent: React.FC<DeckComponentProps> = ({
    mainDeck
}) => {
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const hoverTimeout = React.useRef<number | undefined>(undefined);
    const open = Boolean(anchorElement);

    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.currentTarget;
        const imageUrl = target.getAttribute('data-card-url');

        if (!imageUrl) return;

        hoverTimeout.current = window.setTimeout(() => {
            setAnchorElement(target);
            setPreviewImage(`url(${imageUrl})`);
        }, 500);
    };

    const handlePreviewClose = () => {
        clearTimeout(hoverTimeout.current);
        setAnchorElement(null);
        setPreviewImage(null);
    };

    const popoverConfig = (): { anchorOrigin: PopoverOrigin, transformOrigin: PopoverOrigin } => {
        return {
            anchorOrigin:{
                vertical: 'center',
                horizontal: -5,
            },
            transformOrigin: {
                vertical: 'center',
                horizontal: 'right',
            } };
    }

    // ------------------------STYLES------------------------//
    const cardStyle = {
        borderRadius: '1.1em',
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
    };

    const titleTextStyle = {
        fontSize: '2em',
        fontWeight: 'bold',
        color: 'white',
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

    const cardPreview = {
        borderRadius: '.38em',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        aspectRatio: '1 / 1.4',
        width: '16rem',
    };
    const styleCard = {
        borderRadius: '0.5rem',
        position: 'relative',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        aspectRatio: '.718',
        width: '100%',
        border: '2px solid transparent',
        boxSizing: 'border-box',
    };
    const cardContainer = {
        backgroundColor: 'black',
        borderRadius: '0.5rem',
        width: '8rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    };
    // For debugging purposes:

    // Calculate the total counts from the decks.
    const deckCount = mainDeck?.deck.reduce(
        (sum: number, item: { count: number }) => sum + (item.count || 0),
        0
    ) ?? 0;

    const sideboardCount = mainDeck?.sideboard.reduce(
        (sum: number, item: { count: number }) => sum + (item.count || 0),
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
                        {mainDeck?.deck.map((card) => (
                            <Box sx={cardContainer} key={card.id}>
                                <Box
                                    key={card.id}
                                    sx={{ ...styleCard, backgroundImage:`url(${s3CardImageURL(card)})` }}
                                    onMouseEnter={handlePreviewOpen}
                                    onMouseLeave={handlePreviewClose}
                                    data-card-url={s3CardImageURL(card)}
                                />
                                <Popover
                                    id="mouse-over-popover"
                                    sx={{ pointerEvents: 'none' }}
                                    open={open}
                                    anchorEl={anchorElement}
                                    onClose={handlePreviewClose}
                                    disableRestoreFocus
                                    slotProps={{ paper: { sx: { backgroundColor: 'transparent' } } }}
                                    {...popoverConfig()}
                                >
                                    <Box sx={{ ...cardPreview, backgroundImage: previewImage }} />
                                </Popover>
                            </Box>
                        ))}
                    </Box>
                </Box>
                {mainDeck && mainDeck.sideboard?.length > 0 && (
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
                                {mainDeck?.sideboard.map((card) => (
                                    <Box sx={cardContainer} key={card.id}>
                                        <Box
                                            key={card.id}
                                            sx={{ ...styleCard, backgroundImage:`url(${s3CardImageURL(card)})` }}
                                            onMouseEnter={handlePreviewOpen}
                                            onMouseLeave={handlePreviewClose}
                                            data-card-url={s3CardImageURL(card)}
                                        />
                                        <Popover
                                            id="mouse-over-popover"
                                            sx={{ pointerEvents: 'none' }}
                                            open={open}
                                            anchorEl={anchorElement}
                                            onClose={handlePreviewClose}
                                            disableRestoreFocus
                                            slotProps={{ paper: { sx: { backgroundColor: 'transparent' } } }}
                                            {...popoverConfig()}
                                        >
                                            <Box sx={{ ...cardPreview, backgroundImage: previewImage }} />
                                        </Popover>
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

export default DeckComponent;