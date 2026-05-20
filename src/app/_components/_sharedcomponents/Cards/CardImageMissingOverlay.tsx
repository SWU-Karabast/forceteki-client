import { Box } from '@mui/material';

interface ICardImageMissingOverlayProps {
    label: string;
}

/**
 * Shared sx for the `<img>` element that replaces the prior CSS
 * `background-image`. Renders the image as an absolutely-positioned fill
 * layer with cover cropping, inheriting the parent's border radius and
 * letting pointer events pass through to the container.
 */
export const cardImageFillSx = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: 'inherit',
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: 0,
} as const;

/** As `cardImageFillSx`, but with `object-fit: contain` for hero tiles
 *  whose previous styling used `background-size: contain`. */
export const cardImageFillContainSx = {
    ...cardImageFillSx,
    objectFit: 'contain',
    objectPosition: 'center',
} as const;

/**
 * Debug overlay shown on top of a card whose image failed to load. Rendered
 * absolutely-positioned so callers only need `position: 'relative'` on the
 * card container. `pointer-events: none` keeps existing click handlers
 * working unchanged.
 */
export const CardImageMissingOverlay = ({ label }: ICardImageMissingOverlayProps) => (
    <Box
        sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontFamily: 'sans-serif',
            fontWeight: 600,
            fontSize: 'clamp(0.55rem, 4cqw, 1rem)',
            lineHeight: 1.15,
            textAlign: 'center',
            padding: '6%',
            containerType: 'inline-size',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 1,
        }}
    >
        {label} IMAGE NOT FOUND
    </Box>
);
