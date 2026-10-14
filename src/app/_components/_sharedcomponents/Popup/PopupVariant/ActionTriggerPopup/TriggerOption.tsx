import { Box } from '@mui/material';
import { PopupSourceCard } from '@/app/_components/_sharedcomponents/Popup/Popup.types';
import RichText from '@/app/_components/_sharedcomponents/RichText/RichText';
import GradientBorderButton from '@/app/_components/_sharedcomponents/_styledcomponents/GradientBorderButton';
import OrDivider from '@/app/_components/_sharedcomponents/_styledcomponents/OrDivider';
import TriggerButton, { CARD_WIDTH, PASS_BUTTON_WIDTH } from './TriggerButton';

interface IPassOption {
    text: string;
    onPass: () => void;
}

interface ITriggerOptionProps {
    cardText: string;
    onTrigger: () => void;
    sourceCard?: PopupSourceCard;
    hasLegalEffects?: boolean;
    count?: number;
    // when present, the card's ability is optional: render the "Or" fence and an inset Pass button
    // beneath the card as the alternative choice for the same ability
    pass?: IPassOption;
    // when true, still reserve (but hide) the fence + Pass row even without a `pass`, so a row of
    // options with mixed optional/non-optional cards stays bottom-aligned
    reservePassSpace?: boolean;
}

const styles = {
    // card on top, fence + Pass beneath, all centered and exactly one card wide
    column: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: CARD_WIDTH,
    },
    passGroup: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
    },
    orDivider: {
        width: PASS_BUTTON_WIDTH,
        marginTop: '0.2rem',
        marginBottom: '0.2rem',
    },
    // inset from the card width so the card stays the more prominent option
    passButton: {
        width: PASS_BUTTON_WIDTH,
    },
};

export default function TriggerOption({
    cardText,
    onTrigger,
    sourceCard,
    hasLegalEffects,
    count,
    pass,
    reservePassSpace,
}: ITriggerOptionProps) {
    return (
        <Box sx={styles.column}>
            <TriggerButton
                text={cardText}
                sourceCard={sourceCard}
                hasLegalEffects={hasLegalEffects}
                count={count}
                onClick={onTrigger}
            />
            {(pass || reservePassSpace) && (
                <Box sx={{ ...styles.passGroup, visibility: pass ? 'visible' : 'hidden' }}>
                    <OrDivider sx={styles.orDivider} />
                    <GradientBorderButton
                        sx={styles.passButton}
                        disabled={!pass}
                        onClick={pass?.onPass}
                    >
                        <RichText text={pass?.text ?? 'Pass'} />
                    </GradientBorderButton>
                </Box>
            )}
        </Box>
    );
}
