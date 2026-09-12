import { CardStyle, ICardData } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { Box, IconButton, Popover, PopoverOrigin, Typography } from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import { ZoneName } from '@/app/_constants/constants';
import React from 'react';
import { useLeaderCardFlipPreview } from '@/app/_hooks/useLeaderPreviewFlip';
import { useLongPress } from '@/app/_hooks/useLongPress';
import ThreeSixty from '@mui/icons-material/ThreeSixty';

/**
 * Based on the card positioning, return anchorOrigin and transformOrigin for the popover component
 * @see https://mui.com/material-ui/api/popover/
 * @param card
 */
export const usePopoverConfig = (card: ICardData): { anchorOrigin: PopoverOrigin, transformOrigin: PopoverOrigin } => {
    const { connectedPlayer } = useGame();
    const cardInPlayersHand = card.controllerId === connectedPlayer && card.zone === 'hand';
    const arena = card.zone;

    if (cardInPlayersHand) {
        return {
            anchorOrigin:{
                vertical: -5,
                horizontal: 'center',
            },
            transformOrigin: {
                vertical: 'bottom',
                horizontal: 'center',
            }
        };
    }

    // if the unit is on the left side, we display the popover to the right.
    // if the unit is on the right side, we display the popover to the left
    // we want to avoid displaying the popover on the same place as the card if there's no remaining screen left
    return {
        anchorOrigin:{
            vertical: 'center',
            horizontal: arena === ZoneName.SpaceArena ? 'right' : -5,
        },
        transformOrigin: {
            vertical: 'center',
            horizontal: arena === ZoneName.SpaceArena ? -5 : 'right',
        }
    };
}

/**
 * Hook to extract the preview card popover from the GameCard. Ideally we should be able to test this in isolation
 * @param disabled don't display a preview at all
 * @param popoverConfig preview popovert positioning
 */
export const usePreviewCardPopover = (disabled: boolean, popoverConfig: { anchorOrigin: PopoverOrigin, transformOrigin: PopoverOrigin }) => {
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const hoverTimeout = React.useRef<number | undefined>(undefined);
    const open = Boolean(anchorElement);
    const isPreviewingLeaderCard = anchorElement?.getAttribute('data-card-type') === 'leader';

    const {
        aspectRatio,
        width,
        isFlipped,
        toggleFlip,
    } = useLeaderCardFlipPreview({
        anchorElement,
        cardId: anchorElement?.getAttribute('data-card-id') || undefined,
        setPreviewImage,
        frontCardStyle: CardStyle.Plain,
        backCardStyle: CardStyle.PlainLeader,
        isLeader: isPreviewingLeaderCard,
        isDeployed: true,
    });
    const styles = {
        cardPreview: {
            borderRadius: '.38em',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            imageRendering: '-webkit-optimize-contrast',
            backfaceVisibility: 'hidden',
            userSelect: 'none',
            WebkitTouchCallout: 'none', /* Disables the long-press menu on iOS */
            WebkitUserSelect: 'none',   /* Prevents image selection */
            aspectRatio,
            width,
        },
        mobileFlipButton: {
            position: 'absolute',
            top: '0.35rem',
            right: '0.35rem',
            zIndex: 2,
            width: '3.25rem',
            height: '3.25rem',
            color: 'white',
            backgroundColor: 'rgba(3, 12, 19, 0.72)',
            border: '1px solid rgba(255, 255, 255, 0.38)',
            borderRadius: '999px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.55)',
            transition: 'opacity 140ms ease, background-color 140ms ease',
            '&:hover': {
                backgroundColor: 'rgba(3, 12, 19, 0.9)',
            },
        },
        ctrlText: {
            bottom: '0px',
            display: 'flex',
            justifySelf: 'center',
            width: 'fit-content',
            height: '2rem',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 'bold',
            textShadow: `
                -1px -1px 0 #000,
                 1px -1px 0 #000,
                -1px  1px 0 #000,
                 1px  1px 0 #000
            `
        },
    }

    const [isTouchDevice, setIsTouchDevice] = React.useState(false);

    const longPressHandlers = useLongPress({
        onLongPress: (target) => {
            const imageUrl = target.getAttribute('data-card-url');
            if (!imageUrl || disabled) return;
            setIsTouchDevice(true);
            setAnchorElement(target);
            setPreviewImage(`url(${imageUrl})`);
        },
        onRelease: () => undefined,
    });

    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
    // Skip hover preview on touch devices to avoid brief flash on tap
        if (window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches) return;

        const target = event.currentTarget;
        const imageUrl = target.getAttribute('data-card-url');
        if (!imageUrl) return;

        if (disabled) {
            return;
        }

        hoverTimeout.current = window.setTimeout(() => {
            setAnchorElement(target);
            setPreviewImage(`url(${imageUrl})`);
        }, 200);
    };

    const handlePreviewClose = () => {
        clearTimeout(hoverTimeout.current);
        setAnchorElement(null);
        setPreviewImage(null);
    };
    const getCardPreviewProps = ({ cardUrl,
        cardType,
        cardId }: { cardUrl: string; cardType?: string; cardId?: string }) => {
        return {
            onMouseEnter: handlePreviewOpen,
            onMouseLeave: handlePreviewClose,
            'data-card-url': cardUrl,
            'data-card-type': cardType,
            'data-card-id': cardId,
            ...longPressHandlers
        }
    };
    const popover = disabled ? null : (
        <Popover
            id="mouse-over-popover"
            sx={{ pointerEvents: isTouchDevice ? 'auto' : 'none' }}
            open={open}
            anchorEl={anchorElement}
            onClose={handlePreviewClose}
            disableRestoreFocus
            slotProps={{ paper: { sx: { backgroundColor: 'transparent', boxShadow: 'none' }, tabIndex: -1 } }}
            {...popoverConfig}
        >
            <Box sx={{ position: 'relative' }}>
                <Box sx={{ ...styles.cardPreview, backgroundImage: previewImage }} />
                {isPreviewingLeaderCard && isTouchDevice && (
                    <IconButton
                        aria-label="Flip leader card"
                        sx={styles.mobileFlipButton}
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={(event) => {
                            event.stopPropagation();
                            toggleFlip();
                        }}
                    >
                        <ThreeSixty fontSize="medium" />
                    </IconButton>
                )}
            </Box>
            {isPreviewingLeaderCard && !isTouchDevice && !isFlipped && (
                <Typography variant={'body1'} sx={styles.ctrlText}
                >CTRL: View Flipside</Typography>
            )}
        </Popover>
    );

    // Keep touch previews open until the next interaction anywhere on the screen.
    React.useEffect(() => {
        if (!open || !isTouchDevice) return;
        const onPointerDown = () => handlePreviewClose();
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [open, isTouchDevice]);

    return {
        getCardPreviewProps,
        closePreview: handlePreviewClose,
        popover,
    };
}