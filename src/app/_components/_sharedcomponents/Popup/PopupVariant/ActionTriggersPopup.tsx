import { useGame } from '@/app/_contexts/Game.context';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Box, IconButton, Popover, Typography } from '@mui/material';
import { MouseEvent, useState } from 'react';
import { BiMinus, BiPlus } from 'react-icons/bi';
import GradientBorderButton from '@/app/_components/_sharedcomponents/_styledcomponents/GradientBorderButton';
import {
    containerStyle,
    headerStyle,
    minimizeButtonStyle,
    textStyle,
    titleStyle,
} from '../Popup.styles';
import { ActionTriggerPopup, PopupButton } from '../Popup.types';
import RichText from '../../RichText/RichText';
import { CardStyle } from '../../Cards/CardTypes';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { useCardImageLocale } from '@/app/_contexts/CardImageLocale.context';

interface ButtonProps {
    data: ActionTriggerPopup;
}

type SourceCardImageData = Parameters<typeof s3CardImageURL>[0];

const styles = {
    modalContent: {
        display: 'flex',
        gap: '1rem',
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'safe center',
        overflowX: 'auto',
        overflowY: 'hidden',
        paddingBottom: '0.5rem',
        marginTop: '1rem',
        marginBottom: '2rem',
    }
};

export const ActionTriggerPopupModal = ({ data }: ButtonProps) => {
    const { sendGameMessage } = useGame();
    const locale = useCardImageLocale();
    const [isMinimized, setIsMinimized] = useState(false);
    const [previewAnchorElement, setPreviewAnchorElement] = useState<HTMLElement | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const previewOpen = Boolean(previewAnchorElement);

    const getSourceCardImageData = (button: PopupButton): SourceCardImageData | undefined => {
        if (button.sourceCard?.id && button.sourceCard.type) {
            return button.sourceCard as SourceCardImageData;
        }

        return undefined;
    };

    const getButtonBackgroundImage = (button: PopupButton): string | undefined => {
        const sourceCard = getSourceCardImageData(button);
        if (!sourceCard) {
            return undefined;
        }

        return s3CardImageURL(
            sourceCard,
            locale,
            CardStyle.Plain
        );
    };

    const handlePreviewOpen = (event: MouseEvent<HTMLElement>, button: PopupButton) => {
        const sourceCard = getSourceCardImageData(button);
        if (!sourceCard) {
            return;
        }
        const imageUrl = s3CardImageURL(
            sourceCard,
            locale,
            CardStyle.Plain
        );

        setPreviewAnchorElement(event.currentTarget);
        setPreviewImage(`url(${imageUrl})`);
    };

    const handlePreviewClose = () => {
        setPreviewAnchorElement(null);
        setPreviewImage(null);
    };

    const renderPopupContent = () => {
        if (isMinimized) return null;
        return (
            <>
                {data.description && (
                    <RichText text={data.description} sx={textStyle} component={Typography}/>
                )}
                <Box sx={styles.modalContent}>
                    {data.buttons.map((button: PopupButton, index: number) => {
                        const backgroundImage = getButtonBackgroundImage(button);
                        const triggerButtonSx = {
                            width: '100%',
                            height: '100%',
                            padding: '0.75rem',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            textAlign: 'center',
                            whiteSpace: 'normal',
                            border: 0,
                            borderRadius: '13px',
                            background: backgroundImage
                                ? `linear-gradient(to top, rgba(3, 12, 19, 0.96) 0%, rgba(3, 12, 19, 0.9) 45%, rgba(15, 31, 39, 0.58) 76%, rgba(15, 31, 39, 0.34) 100%), url(${backgroundImage})`
                                : '#1E2D32',
                            backgroundPosition: 'center top',
                            backgroundSize: 'cover',
                            fontSize: { xs: '11px', md: '15px' },
                            '&:hover': {
                                filter: 'brightness(1.15)',
                            },
                            '& .MuiTypography-root': {
                                fontSize: '0.78rem',
                                lineHeight: 1.2,
                                textShadow: '0 1px 3px rgba(0, 0, 0, 0.95)',
                            },
                        };

                        const triggerButton = (
                            <GradientBorderButton
                                fillColor={button.selected ? 'rgba(102, 229, 255, 0.2)' : undefined}
                                sx={triggerButtonSx}
                                onClickHandler={() => {
                                    sendGameMessage([button.command, button.arg, button.uuid]);
                                }}
                            >
                                <RichText text={button.text} />
                            </GradientBorderButton>
                        );

                        return (
                            <Box
                                key={`${button.uuid}:${index}`}
                                sx={{
                                    position: 'relative',
                                    overflow: 'hidden',
                                    aspectRatio: '1 / 1.4',
                                    flex: '0 0 clamp(116px, 16vw, 10rem)',
                                    width: 'clamp(116px, 16vw, 10rem)',
                                    padding: '2px',
                                    borderRadius: '15px',
                                    border: '1px solid #21313ac2',
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
                                }}
                            >
                                {triggerButton}
                                {getSourceCardImageData(button) && (
                                    <IconButton
                                        className="trigger-card-preview-button"
                                        aria-label="View card details"
                                        size="small"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            handlePreviewOpen(event, button);
                                        }}
                                        onMouseEnter={(event) => handlePreviewOpen(event, button)}
                                        onMouseLeave={handlePreviewClose}
                                        sx={{
                                            position: 'absolute',
                                            top: '0.35rem',
                                            right: '0.35rem',
                                            zIndex: 2,
                                            color: 'white',
                                            backgroundColor: 'rgba(3, 12, 19, 0.72)',
                                            border: '1px solid rgba(255, 255, 255, 0.38)',
                                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.55)',
                                            transition: 'opacity 140ms ease, background-color 140ms ease',
                                            '&:hover': {
                                                backgroundColor: 'rgba(3, 12, 19, 0.9)',
                                            },
                                        }}
                                    >
                                        <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                        );
                    })}
                </Box>
                <Popover
                    id="trigger-card-preview-popover"
                    sx={{ pointerEvents: 'none' }}
                    open={previewOpen}
                    anchorEl={previewAnchorElement}
                    onClose={handlePreviewClose}
                    disableRestoreFocus
                    slotProps={{ paper: { sx: { backgroundColor: 'transparent', boxShadow: 'none' }, tabIndex: -1 } }}
                    anchorOrigin={{
                        vertical: 'center',
                        horizontal: 'right',
                    }}
                    transformOrigin={{
                        vertical: 'center',
                        horizontal: 'left',
                    }}
                >
                    <Box
                        sx={{
                            borderRadius: '.38em',
                            backgroundImage: previewImage,
                            backgroundSize: 'cover',
                            backgroundRepeat: 'no-repeat',
                            aspectRatio: '1 / 1.4',
                            width: 'clamp(200px, 60vw, 16rem)',
                        }}
                    />
                </Popover>
            </>
        );
    };

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
            {renderPopupContent()}
        </Box>
    );
};
