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
    const styles = {
        cardStyle: {
            borderRadius: '1.1em',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'transparent',
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
        },
        deckSizeTextStyle: {
            fontSize: '2em',
            fontWeight: '400',
            color: 'white',
            mr: '.6em',
        },
        dividerStyle: {
            backgroundColor: '#fff',
            mt: '.5vh',
            mb: '0.5vh',
            alignSelf: 'center',
            height: '1px',
        },
        scrollableBoxStyleSideboard: {
            height: '24vh',
            overflow: 'auto',
        },
        scrollableBoxStyle: {
            height: mainDeck ? mainDeck.sideboard?.length > 0 ? '37vh' : '61vh' : '61vh',
            overflow: 'auto',
        },
        mainContainerStyle: {
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1em',
            p: '1em',
            textWrap: 'wrap',
        },
        cardPreview: {
            borderRadius: '.38em',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio: '1 / 1.4',
            width: '16rem',
        },
        styleCard: {
            borderRadius: '0.5rem',
            position: 'relative',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio: '.718',
            width: '100%',
            border: '2px solid transparent',
            boxSizing: 'border-box',
        },
        cardContainer: {
            backgroundColor: 'black',
            borderRadius: '0.5rem',
            width: '8rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
        },
        counterIcon: {
            position: 'absolute',
            width: '2rem',
            aspectRatio: '1 / 1',
            display: 'flex',
            bottom: '-5px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/counterIcon.svg)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
        },
        numberFont: {
            fontSize: '1.85rem',
            fontWeight: '700',
            textShadow: '0px 0px 3px black',
            lineHeight: 1,
            color: 'white',
        },
    }

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
            <Card sx={styles.cardStyle}>
                <Box sx={styles.headerBoxStyle}>
                    <Typography sx={styles.titleTextStyle}>Your Deck</Typography>
                    <Typography sx={styles.deckSizeTextStyle}>
                        {deckCount}/50
                    </Typography>
                </Box>
                <Box
                    sx={styles.scrollableBoxStyle}
                >
                    <Box sx={styles.mainContainerStyle}>
                        {mainDeck?.deck.map((card) => (
                            <Box sx={styles.cardContainer} key={card.id}>
                                <Box
                                    key={card.id}
                                    sx={{ ...styles.styleCard, backgroundImage:`url(${s3CardImageURL(card)})` }}
                                    onMouseEnter={handlePreviewOpen}
                                    onMouseLeave={handlePreviewClose}
                                    data-card-url={s3CardImageURL(card)}
                                />
                                <Box sx={styles.counterIcon}>
                                    <Typography sx={styles.numberFont}>
                                        {card.count}
                                    </Typography>
                                </Box>
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
                                    <Box sx={{ ...styles.cardPreview, backgroundImage: previewImage }} />
                                </Popover>
                            </Box>
                        ))}
                    </Box>
                </Box>
                {mainDeck && mainDeck.sideboard?.length > 0 && (
                    <>
                        <Box sx={styles.headerBoxStyle}>
                            <Typography sx={styles.titleTextStyle}>Sideboard</Typography>
                            <Divider sx={styles.dividerStyle} />
                            <Typography sx={styles.deckSizeTextStyle}>
                                {sideboardCount}/10
                            </Typography>
                        </Box>
                        <Box
                            sx={styles.scrollableBoxStyleSideboard}
                        >
                            <Box sx={styles.mainContainerStyle}>
                                {mainDeck?.sideboard.map((card) => (
                                    <Box sx={styles.cardContainer} key={card.id}>
                                        <Box
                                            key={card.id}
                                            sx={{ ...styles.styleCard, backgroundImage:`url(${s3CardImageURL(card)})` }}
                                            onMouseEnter={handlePreviewOpen}
                                            onMouseLeave={handlePreviewClose}
                                            data-card-url={s3CardImageURL(card)}
                                        />
                                        <Box sx={styles.counterIcon}>
                                            <Typography sx={styles.numberFont}>
                                                {card.count}
                                            </Typography>
                                        </Box>
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
                                            <Box sx={{ ...styles.cardPreview, backgroundImage: previewImage }} />
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