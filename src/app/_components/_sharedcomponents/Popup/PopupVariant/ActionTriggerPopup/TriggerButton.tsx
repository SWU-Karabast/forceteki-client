import { PopupSourceCard } from '@/app/_components/_sharedcomponents/Popup/Popup.types';
import { Box, Button } from '@mui/material';
import RichText from '@/app/_components/_sharedcomponents/RichText/RichText';
import ViewCardButton from '@/app/_components/_sharedcomponents/Popup/PopupVariant/ActionTriggerPopup/ViewCardButton';
import { useCardImageLocale } from '@/app/_contexts/CardImageLocale.context';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { CardStyle, CardType } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

type SourceCardImageData = Parameters<typeof s3CardImageURL>[0];

const styles = {
    container: {
        position: 'relative',
        overflow: 'hidden',
        aspectRatio: '1 / 1.4',
        // to avoid cutoff when doing the Y translation on hover effect
        mt: '1px',
        flex: '0 0 clamp(116px, 16vw, 10rem)',
        width: 'clamp(116px, 16vw, 10rem)',
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
    button: {
        width: '100%',
        height: '100%',
        padding: '0.75rem',
        alignItems: 'flex-end',
        justifyContent: 'center',
        textAlign: 'center',
        whiteSpace: 'normal',
        border: 0,
        borderRadius: '13px',
        backgroundPosition: 'center top',
        backgroundSize: 'cover',
        fontSize: { xs: '11px', lg: '15px' },
        '&:hover': {
            filter: 'brightness(1.15)',
        },
        '& .MuiTypography-root': {
            fontSize: '0.78rem',
            lineHeight: 1.2,
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.95)',
        },
    }
}

const useCardImageURL = (sourceCard?: PopupSourceCard): string | null => {
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

const isBaseSourceCard = (sourceCard?: PopupSourceCard): boolean => {
    const sourceType = sourceCard?.printedType ?? sourceCard?.type;

    return sourceType?.toLowerCase() === CardType.Base;
};

export default function TriggerButton({ onClick, sourceCard, text }: { onClick(): void; sourceCard?: PopupSourceCard, text: string }) {
    const backgroundImage = useCardImageURL(sourceCard);
    const isLandscapePreview = isBaseSourceCard(sourceCard);

    return (
        <Box sx={styles.container}>
            <Button
                sx={[
                    styles.button,
                    backgroundImage 
                        ? { backgroundImage: `linear-gradient(to top, rgba(3, 12, 19, 0.96) 0%, rgba(3, 12, 19, 0.9) 45%, rgba(15, 31, 39, 0.58) 76%, rgba(15, 31, 39, 0.34) 100%), url(${backgroundImage})` } 
                        : { backgroundColor: '#1E2D32' } 
                ]}
                onClick={onClick}
            >
                <RichText text={text} />
            </Button>
            {backgroundImage && <ViewCardButton imageUrl={backgroundImage} isLandscape={isLandscapePreview} />}
        </Box>
    );
}
