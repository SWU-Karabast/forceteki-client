import { useGame } from '@/app/_contexts/Game.context';
import { Box, IconButton, Typography } from '@mui/material';
import { MouseEvent, useState } from 'react';
import { BiMinus, BiPlus } from 'react-icons/bi';
import {
    containerStyle,
    footerStyle,
    headerStyle,
    minimizeButtonStyle,
    textStyle,
    titleStyle,
} from '../../Popup.styles';
import { BatchTriggerPopup, PopupButton } from '../../Popup.types';
import RichText from '../../../RichText/RichText';
import GradientBorderButton from '@/app/_components/_sharedcomponents/_styledcomponents/GradientBorderButton';
import ViewCardButton from '../ActionTriggerPopup/ViewCardButton';
import { isBaseSourceCard, useCardImageURL } from '../ActionTriggerPopup/TriggerButton';

interface IBatchTriggerPopupProps {
    data: BatchTriggerPopup;
}

const styles = {
    body: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        marginTop: '1rem',
    },
    cardContainer: {
        position: 'relative',
        isolation: 'isolate',
        aspectRatio: '1 / 1.4',
        width: 'clamp(140px, 22vw, 12rem)',
        borderRadius: '15px',
        // no cyan border here — this card is illustrative only (not selectable)
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.45)',
        backgroundColor: '#1E2D32',
        backgroundPosition: 'center top',
        backgroundSize: 'cover',
        overflow: 'hidden',
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
    remainingText: {
        ...textStyle,
        fontWeight: 600,
    },
};

export default function BatchTriggerPopupModal({ data }: IBatchTriggerPopupProps) {
    const { sendGameMessage } = useGame();
    const [isMinimized, setIsMinimized] = useState(false);

    const backgroundImage = useCardImageURL(data.sourceCard);
    const isLandscapePreview = isBaseSourceCard(data.sourceCard);

    const handleMinimize = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
    };

    return (
        <Box sx={containerStyle}>
            <Box sx={headerStyle(isMinimized)}>
                <RichText text={data.title} sx={titleStyle} component={Typography}/>
                <IconButton
                    sx={minimizeButtonStyle}
                    aria-label="minimize"
                    onClick={handleMinimize}
                >
                    {isMinimized ? <BiPlus /> : <BiMinus />}
                </IconButton>
            </Box>
            {!isMinimized && (
                <Box sx={styles.body}>
                    <Box
                        sx={[
                            styles.cardContainer,
                            backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {},
                        ]}
                    >
                        {backgroundImage && <ViewCardButton imageUrl={backgroundImage} isLandscape={isLandscapePreview} />}
                    </Box>
                    <Typography sx={styles.remainingText}>
                        {`${data.remainingCount} trigger${data.remainingCount === 1 ? '' : 's'} remaining`}
                    </Typography>
                    <Box sx={footerStyle}>
                        {data.buttons.map((button: PopupButton, index: number) => (
                            <GradientBorderButton
                                key={`${button.uuid}:${index}`}
                                onClick={() => {
                                    sendGameMessage([button.command, button.arg, button.uuid]);
                                }}
                            >
                                <RichText text={button.text} />
                            </GradientBorderButton>
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
};
