import React, { useRef, useLayoutEffect, useState } from 'react';
import { Box, Typography, Popover, PopoverOrigin } from '@mui/material';
import { IDeckDiscardProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { PopupSource } from '@/app/_components/_sharedcomponents/Popup/Popup.types';
import { debugBorder } from '@/app/_utils/debug';
import useScreenOrientation from '@/app/_utils/useScreenOrientation';
import { useCosmetics } from '@/app/_contexts/CosmeticsContext';

const DeckDiscard: React.FC<IDeckDiscardProps> = ({ trayPlayer, cardback }) => {
    const { gameState, connectedPlayer } = useGame();
    const { togglePopup, popups } = usePopup();
    const { isPortrait } = useScreenOrientation();
    const { getCardback } = useCosmetics();
    // Refs for individual card containers
    const discardRef = useRef<HTMLDivElement>(null);
    const deckRef = useRef<HTMLDivElement>(null);
    
    // Individual ratio states
    const [isDiscardWiderThanTall, setIsDiscardWiderThanTall] = useState(false);
    const [isDeckWiderThanTall, setIsDeckWiderThanTall] = useState(false);
    
    // Use a more stable layout effect for dimension measurements
    useLayoutEffect(() => {
        let debounceTimer: number;
        const containerRatio = 1 / 1.4; // Card aspect ratio
        
        const checkRatios = () => {
            // Clear any pending timer
            clearTimeout(debounceTimer);
            
            // Debounce the check to avoid feedback loops
            debounceTimer = window.setTimeout(() => {
                // Check discard ratio
                if (discardRef.current) {
                    const { width, height } = discardRef.current.getBoundingClientRect();
                    const spaceRatio = width / height;
                    // Only update if there's a significant difference to avoid oscillation
                    if (Math.abs(spaceRatio - containerRatio) > 0.05) {
                        setIsDiscardWiderThanTall(spaceRatio > containerRatio);
                    }
                }
                
                // Check deck ratio
                if (deckRef.current) {
                    const { width, height } = deckRef.current.getBoundingClientRect();
                    const spaceRatio = width / height;
                    if (Math.abs(spaceRatio - containerRatio) > 0.05) {
                        setIsDeckWiderThanTall(spaceRatio > containerRatio);
                    }
                }
            }, 100); // 100ms debounce
        };
        
        // Check initially
        checkRatios();
        
        // Attach resize listener
        window.addEventListener('resize', checkRatios);
        
        return () => {
            clearTimeout(debounceTimer);
            window.removeEventListener('resize', checkRatios);
        };
    }, [isPortrait]); // Re-run when portrait mode changes

    const topDiscardCard = gameState?.players[trayPlayer]?.cardPiles['discard'].at(-1);
    const topDiscardCardUrl = topDiscardCard && typeof topDiscardCard === 'object' ? `url(${s3CardImageURL(topDiscardCard)})` : 'none';
    const selectableDiscardCard = gameState.players[trayPlayer].cardPiles.discard.some((item: { selectable: boolean }) => item.selectable === true);

    const handleDiscardToggle = () => {
        const playerName = connectedPlayer != trayPlayer ? 'Your Opponent\'s' : 'Your';
        const existingPopup = popups.find(popup => popup.uuid === `${trayPlayer}-discard`);

        if (existingPopup && existingPopup.source === PopupSource.PromptState) {
            // TODO: allow game propt to be toggled
            // const { type, ...restData } = existingPopup
            // togglePopup(type, {
            //     ...restData
            // });
        } else {
            togglePopup('pile', {
                uuid: `${trayPlayer}-discard`,
                title: `${playerName} discard`,
                cards: gameState?.players[trayPlayer]?.cardPiles['discard'],
                source: PopupSource.User,
                buttons: null
            })
        }
    }

    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const hoverTimeout = React.useRef<number | undefined>(undefined);
    const open = Boolean(anchorElement);

    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.currentTarget;
        hoverTimeout.current = window.setTimeout(() => {
            setAnchorElement(target);
        }, 200);
    };
 
    const handlePreviewClose = () => {
        clearTimeout(hoverTimeout.current);
        setAnchorElement(null);
    };

    const popoverConfig = (): { anchorOrigin: PopoverOrigin, transformOrigin: PopoverOrigin } => {
        return { 
            anchorOrigin:{
                vertical: connectedPlayer != trayPlayer ? 'top' : 'bottom',
                horizontal: 'right',
            },
            transformOrigin: {
                vertical: connectedPlayer != trayPlayer ? 'top' : 'bottom',
                horizontal: 'left',
            } 
        };
    }
    console.log(cardback);
    const styles = {
        containerStyle: {
            ...debugBorder('yellow'),
            display: 'flex',
            flexDirection: 'row',
            gap: isPortrait ? '0.5rem' : isDiscardWiderThanTall ? '1rem' : '0.2rem',
            flex: isPortrait ? '0 0 auto' : 1,
            width: isPortrait ? '100%' : '60%',
            height: isPortrait ? '50%' : '100%',
            justifyContent: 'center',
            alignItems: 'center',
        },
        discard: {
            discardCardStyle: {
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                ...(isDiscardWiderThanTall
                    ? {
                        height: '100%',
                        width: 'auto',
                        maxWidth: '50%',
                    }
                    : {
                        maxHeight: '100%',
                        height: 'auto',
                        width: '50%',
                    }),
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
                backgroundImage: topDiscardCardUrl,
                backgroundRepeat: 'no-repeat',
                border: selectableDiscardCard ? '2px solid var(--selection-green)' : 'none',
            },
            discardContentStyle: {
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: '800',
                fontSize: '1.2em',
                color: 'white',
                textAlign: 'center',
            },
            discardTopCardPreview: {
                borderRadius: '.38em',
                backgroundImage: topDiscardCardUrl,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                aspectRatio: '1 / 1.4',
                width: '16rem',
            }
        },
        deck: {
            deckCardStyle: {
                backgroundColor: 'black',
                backgroundPosition: 'center',
                backgroundSize: '88%',
                backgroundImage: cardback ? `url(${getCardback(cardback).path})` : 'url(\'/card-back.png\')',
                backgroundRepeat: 'no-repeat',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...(isDeckWiderThanTall
                    ? {
                        height: '100%',
                        width: 'auto',
                        maxWidth: '50%',
                    }
                    : {
                        maxHeight: '100%',
                        height: 'auto',
                        width: '50%',
                    }),
                aspectRatio: '1 / 1.4',
                borderRadius: '5px',
            },

            deckContentStyle: {
                fontFamily: 'var(--font-barlow), sans-serif',
                fontWeight: '800',
                fontSize: 'clamp(0.8rem, 0.6rem + 0.6vw, 1.5rem)',
                color: 'white',
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0, 0, 0, .75)',
                borderRadius: '100px',
                width: '35%',
                height: 'auto',
                aspectRatio: '1 / 1',
            }
        }
    }

    const deckComponent = <Typography sx={styles.deck.deckContentStyle}>{gameState?.players[trayPlayer].numCardsInDeck}</Typography>

    return (
        <Box sx={styles.containerStyle}>
            <Box
                ref={discardRef}
                sx={styles.discard.discardCardStyle}
                onMouseEnter={handlePreviewOpen}
                onMouseLeave={handlePreviewClose} 
                onClick={handleDiscardToggle}
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
                <Box sx={{ ...styles.discard.discardTopCardPreview }} />
            </Popover>
            <Box ref={deckRef} sx={styles.deck.deckCardStyle}>
                {deckComponent}
            </Box>
        </Box>
    );
};

export default DeckDiscard;
