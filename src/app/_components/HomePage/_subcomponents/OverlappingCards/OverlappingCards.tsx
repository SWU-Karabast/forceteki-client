import { ICardData, ISetCode, LeaderBaseCardStyle } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import React from 'react';
import { useCardImageLocale } from '@/app/_contexts/CardImageLocale.context';
import { Box, BoxProps, Popover } from '@mui/material';
import { s3CardImageURL } from '@/app/_utils/s3Utils';

const styles = {
    cardPopover: {
        borderRadius: '.38em',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        aspectRatio: '1.4 / 1',
        width: '24rem',
    },
    leaderStyleCard:{
        borderRadius: '0.5rem',
        backgroundSize: 'cover',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        border: '2px solid transparent',
        boxSizing: 'border-box',
        cursor: 'pointer',
        aspectRatio: '1.39',
        width: '100%',
    },
    leaderContainer: {
        position:'absolute',
        left:'-11.5%',
        top:'25%',
        width: '100%',
    },
    cardsContainer: {
        position: 'relative',
        width: 'clamp(5rem, 100%, 8rem)'
        // marginLeft: '7.5%',
        // marginBottom: '8%',

    },
    container: {
        aspectRatio: '1.39',
        width: 'clamp(5rem, 100%, 8rem)', // Min 5rem, max 10rem, scales with viewport
    }
};

export type OverlappingCardProps = BoxProps & { baseCard: ICardData | ISetCode, leaderCard: ICardData | ISetCode };

/**
 * Parent must provide with width to be able to occupy the available space (but maintaining the aspect ratio of the card)
 */
export default function OverlappingCards({ baseCard, leaderCard, ...boxProps }: OverlappingCardProps) {
    const { sx = {}, ...otherBoxProps } = boxProps || {};
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const locale = useCardImageLocale();
    const hoverTimeout = React.useRef<number | undefined>(undefined);
    const open = Boolean(anchorElement);

    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.currentTarget;
        const imageUrl = target.getAttribute('data-card-url');

        if (!imageUrl) return;

        hoverTimeout.current = window.setTimeout(() => {
            setAnchorElement(target);
            setPreviewImage(`url(${imageUrl})`);
        }, 300);
    };
    const handlePreviewClose = () => {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = undefined;
        setAnchorElement(null);
        setPreviewImage(null);
    };
    return (
        <Box sx={[styles.container, ...(Array.isArray(sx) ? sx : [sx])]} {...otherBoxProps}>
            <Box sx={styles.cardsContainer}>
                <Box
                    sx={{ ...styles.leaderStyleCard, backgroundImage:`url(${s3CardImageURL(baseCard, locale)})` }}
                    onMouseEnter={handlePreviewOpen}
                    onMouseLeave={handlePreviewClose}
                    data-card-url={s3CardImageURL(baseCard, locale)}
                />
                <Box
                    sx={[styles.leaderStyleCard, styles.leaderContainer, { backgroundImage:`url(${s3CardImageURL(leaderCard, locale, LeaderBaseCardStyle.PlainLeader)})` }]}
                    onMouseEnter={handlePreviewOpen}
                    onMouseLeave={handlePreviewClose}
                    data-card-url={s3CardImageURL(leaderCard, locale, LeaderBaseCardStyle.PlainLeader)}
                />
            </Box>

            <Popover
                id="mouse-over-popover"
                sx={{ pointerEvents: 'none' }}
                open={open}
                anchorEl={anchorElement}
                onClose={handlePreviewClose}
                disableRestoreFocus
                slotProps={{ paper: { sx: { backgroundColor: 'transparent' } } }}
                anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'center',
                    horizontal: 'left',
                }}>
                <Box sx={{ ...styles.cardPopover, backgroundImage: previewImage }} />
            </Popover>
        </Box>
    );
}
