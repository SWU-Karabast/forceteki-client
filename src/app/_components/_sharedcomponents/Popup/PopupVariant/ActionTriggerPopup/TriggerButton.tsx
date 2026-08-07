import { PopupSourceCard } from '@/app/_components/_sharedcomponents/Popup/Popup.types';
import { Box, Button } from '@mui/material';
import RichText from '@/app/_components/_sharedcomponents/RichText/RichText';
import ViewCardButton from '@/app/_components/_sharedcomponents/Popup/PopupVariant/ActionTriggerPopup/ViewCardButton';
import { useCardImageLocale } from '@/app/_contexts/CardImageLocale.context';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { CardStyle, CardType } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

type SourceCardImageData = Parameters<typeof s3CardImageURL>[0];

// vertical offset per stacked card; larger = more obvious stack. Kept in sync with the row's reserved
// headroom (ACTION_TRIGGER_STACK_HEADROOM) so the upward peek + badge are never clipped.
export const STACK_OFFSET_PX = 10;
export const STACK_SCALE = 0.92; // scale factor for each stacked card; smaller = more obvious stack

const styles = {
    // the flex item. It is always exactly one card in size (same as an ungrouped trigger) so the row
    // stays aligned; the stacked cards and count badge overflow upward beyond it without affecting layout.
    wrapper: {
        position: 'relative',
        // to avoid cutoff when doing the Y translation on hover effect
        mt: '1px',
        flex: '0 0 clamp(116px, 16vw, 10rem)',
        width: 'clamp(116px, 16vw, 10rem)',
        aspectRatio: '1 / 1.4',
    },
    container: {
        position: 'absolute',
        inset: 0,
        zIndex: 2,
        isolation: 'isolate',
        overflow: 'hidden',
        padding: '2px',
        borderRadius: '15px',
        border: '1px solid rgb(102, 229, 255)',
        boxShadow: '0 3px 8px rgba(102, 229, 255, 0.16), 0 1px 3px rgba(0, 0, 0, 0.38)',
        transition: 'box-shadow 140ms ease, transform 140ms ease',
        '&:hover': {
            boxShadow: '0 5px 12px rgba(102, 229, 255, 0.21), 0 2px 5px rgba(0, 0, 0, 0.46)',
            transform: 'translateY(-1px)'
        },
        '@media (hover: hover) and (pointer: fine)': {
            '& .trigger-card-preview-button': {
                opacity: 0,
                pointerEvents: 'none',
            },
            '&:hover .trigger-card-preview-button': {
                opacity: 1,
                pointerEvents: 'auto',
            },
        },
    },
    // a card "edge" peeking out above the main card to suggest a stack; offset upward, behind, and
    // scaled down (deeper == smaller). `top center` origin keeps the top edge peeking while it tapers.
    stackLayer: (depth: number) => ({
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        transformOrigin: 'top center',
        transform: `translateY(-${depth * STACK_OFFSET_PX}px) scale(${STACK_SCALE ** depth})`,
        borderRadius: '15px',
        border: '1px solid rgba(102, 229, 255, 0.45)',
        backgroundColor: '#16232B',
        boxShadow: '0 -3px 7px rgba(0, 0, 0, 0.4)',
        pointerEvents: 'none',
    }),
    button: {
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        padding: '0.75rem',
        alignItems: 'flex-end',
        justifyContent: 'center',
        textAlign: 'center',
        whiteSpace: 'normal',
        border: 0,
        borderRadius: '13px',
        backgroundColor: '#1E2D32',
        backgroundPosition: 'center top',
        backgroundSize: 'cover',
        fontSize: { xs: '11px', lg: '15px' },
        '&:hover': {
            filter: 'brightness(1.15)',
        },
        '& > *': {
            position: 'relative',
            zIndex: 1,
        },
        '& .MuiTypography-root': {
            fontSize: '0.78rem',
            lineHeight: 1.2,
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.95)',
        },
    },
    noEffectContainer: {
        // borderColor: 'rgba(160, 160, 160, 0.75)',
        boxShadow: '0 3px 8px rgba(160, 160, 160, 0.12), 0 1px 3px rgba(0, 0, 0, 0.38)',
        '&:hover': {
            boxShadow: '0 5px 12px rgba(160, 160, 160, 0.16), 0 2px 5px rgba(0, 0, 0, 0.46)',
            transform: 'translateY(-1px)'
        },
    },
    noEffectIndicator: {
        position: 'absolute',
        top: '0.35rem',
        left: '0.35rem',
        zIndex: 2,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '28px',
        padding: '0 0.5rem',
        color: 'white',
        backgroundColor: 'rgba(3, 12, 19, 0.72)',
        border: '1px solid rgba(255, 255, 255, 0.38)',
        borderRadius: '999px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.55)',
        cursor: 'pointer',
        fontSize: '0.68rem',
        fontWeight: 700,
        letterSpacing: 0,
        lineHeight: 1,
        textTransform: 'uppercase',
        userSelect: 'none',
    },
    // sits at the top-left of the frontmost card, straddling its top edge. Tweak `top`/`left` to taste.
    countBadge: {
        position: 'absolute',
        // top: '0rem',
        left: '50%',
        transform: 'translateX(-50%) translateY(-50%)',
        zIndex: 3,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '30px',
        height: '24px',
        padding: '0 0.5rem',
        color: 'white',
        // opaque so the stacked card borders don't show through the label
        backgroundColor: '#21414A',
        border: '1px solid rgba(102, 229, 255, 0.85)',
        borderRadius: '999px',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.55)',
        fontSize: '0.8rem',
        fontWeight: 700,
        lineHeight: 1,
        userSelect: 'none',
        pointerEvents: 'none',
    },
}

const cardArtBackground = (backgroundImage: string, isNoEffect: boolean) => ({
    '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        backgroundImage: `url(${backgroundImage})`,
        backgroundPosition: 'center top',
        backgroundSize: 'cover',
        filter: isNoEffect ? 'grayscale(0.8)' : 'none',
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        background: 'linear-gradient(to top, rgba(3, 12, 19, 0.96) 0%, rgba(3, 12, 19, 0.9) 45%, rgba(15, 31, 39, 0.58) 76%, rgba(15, 31, 39, 0.34) 100%)',
    },
});

export const useCardImageURL = (sourceCard?: PopupSourceCard): string | null => {
    const locale = useCardImageLocale();

    if (!sourceCard || !sourceCard?.id || !sourceCard.type) {
        return null;
    }

    return s3CardImageURL(
        sourceCard as SourceCardImageData,
        locale,
        CardStyle.Plain
    );
}

export const isBaseSourceCard = (sourceCard?: PopupSourceCard): boolean => {
    const sourceType = sourceCard?.printedType ?? sourceCard?.type;

    return sourceType?.toLowerCase() === CardType.Base;
};

export default function TriggerButton({ onClick, sourceCard, text, hasLegalEffects, count }: { onClick(): void; sourceCard?: PopupSourceCard, text: string, hasLegalEffects?: boolean, count?: number }) {
    const backgroundImage = useCardImageURL(sourceCard);
    const isLandscapePreview = isBaseSourceCard(sourceCard);
    const isNoEffect = !hasLegalEffects;
    const isGrouped = (count ?? 0) > 1;
    // show at most a 3-card stack regardless of how many triggers are grouped
    const behindLayers = isGrouped ? Math.min(count ?? 1, 3) - 1 : 0;

    return (
        <Box sx={styles.wrapper}>
            {/* render deepest layer first so shallower layers stack on top of it */}
            {Array.from({ length: behindLayers }).map((_, i) => {
                const depth = behindLayers - i;
                return <Box key={`stack-${depth}`} sx={styles.stackLayer(depth)} />;
            })}
            <Box sx={[styles.container, isNoEffect && styles.noEffectContainer]}>
                <Button
                    sx={[
                        styles.button,
                        backgroundImage
                            ? cardArtBackground(backgroundImage, isNoEffect)
                            : { backgroundColor: '#1E2D32' }
                    ]}
                    onClick={onClick}
                >
                    <RichText text={text} />
                </Button>
                {isNoEffect && (
                    <Box
                        component="span"
                        aria-label="This choice has no effect"
                        onClick={onClick}
                        sx={styles.noEffectIndicator}
                    >
                        No effect
                    </Box>
                )}
                {backgroundImage && <ViewCardButton imageUrl={backgroundImage} isLandscape={isLandscapePreview} />}
            </Box>
            {isGrouped && (
                <Box
                    component="span"
                    aria-label={`${count} similar triggers grouped together`}
                    sx={styles.countBadge}
                >
                    {`x${count}`}
                </Box>
            )}
        </Box>
    );
}
