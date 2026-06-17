import { useGame } from '@/app/_contexts/Game.context';
import { Box, IconButton, Typography } from '@mui/material';
import { MouseEvent, useState } from 'react';
import { BiMinus, BiPlus } from 'react-icons/bi';
import GradientBorderButton from '@/app/_components/_sharedcomponents/_styledcomponents/GradientBorderButton';
import {
    containerStyle,
    footerStyle,
    headerStyle,
    minimizeButtonStyle,
    textStyle,
    titleStyle,
} from '../Popup.styles';
import { DefaultPopup, PopupButton } from '../Popup.types';
import RichText from '../../RichText/RichText';
import { ICardData, CardStyle } from '../../Cards/CardTypes';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { useCardImageLocale } from '@/app/_contexts/CardImageLocale.context';

interface ButtonProps {
    data: DefaultPopup;
}

type PlayerCardContainers = {
    leader?: ICardData;
    base?: ICardData;
    forceToken?: ICardData;
    cardPiles?: Record<string, ICardData[]>;
};

export const DefaultPopupModal = ({ data }: ButtonProps) => {
    const { sendGameMessage, gameState, connectedPlayer } = useGame();
    const locale = useCardImageLocale();
    const [isMinimized, setIsMinimized] = useState(false);

    const triggerWindow = gameState?.players[connectedPlayer]?.promptState?.promptType === 'triggerWindow';

    const findCardByUuid = (uuid?: string): ICardData | null => {
        if (!uuid || !gameState?.players) {
            return null;
        }

        const visitCard = (card?: ICardData | null): ICardData | null => {
            if (!card) {
                return null;
            }
            if (card.uuid === uuid) {
                return card;
            }
            for (const child of [...(card.subcards ?? []), ...(card.capturedCards ?? [])]) {
                const found = visitCard(child);
                if (found) {
                    return found;
                }
            }
            return null;
        };

        for (const player of Object.values(gameState.players) as PlayerCardContainers[]) {
            const playerCards = [
                player.leader,
                player.base,
                player.forceToken,
                ...Object.values(player.cardPiles ?? {}).flat(),
            ];
            for (const card of playerCards) {
                const found = visitCard(card as ICardData);
                if (found) {
                    return found;
                }
            }
        }

        return null;
    };

    const getButtonBackgroundImage = (button: PopupButton): string | undefined => {
        const card = findCardByUuid(button.relatedCardId);
        if (!card) {
            return undefined;
        }

        return s3CardImageURL(
            { ...card, setId: card.clonedCardId ?? card.setId },
            locale,
            CardStyle.Plain
        );
    };

    const renderPopupContent = () => {
        if (isMinimized) return null;
        return (
            <>
                {data.description && (
                    <RichText text={data.description} sx={textStyle} component={Typography}/>
                )}
                <Box sx={triggerWindow ? {
                    ...footerStyle,
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'stretch',
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    maxWidth: 'min(80vw, 58rem)',
                    paddingBottom: '0.5rem',
                } : footerStyle}>
                    {data.buttons.map((button: PopupButton, index: number) => {
                        const backgroundImage = triggerWindow ? getButtonBackgroundImage(button) : undefined;

                        return (
                            <GradientBorderButton
                                key={`${button.uuid}:${index}`}
                                fillColor={button.selected ? 'rgba(102, 229, 255, 0.2)' : undefined}
                                sx={triggerWindow ? {
                                    position: 'relative',
                                    overflow: 'hidden',
                                    aspectRatio: '1 / 1.4',
                                    flex: '0 0 clamp(7.5rem, 16vw, 10rem)',
                                    width: 'clamp(7.5rem, 16vw, 10rem)',
                                    padding: '0.75rem',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    whiteSpace: 'normal',
                                    backgroundImage: backgroundImage
                                        ? `linear-gradient(rgba(15, 31, 39, 0.32), rgba(3, 12, 19, 0.84)), url(${backgroundImage})`
                                        : undefined,
                                    backgroundPosition: 'center top',
                                    backgroundSize: 'cover',
                                    '&:hover': {
                                        filter: 'brightness(1.15)',
                                    },
                                    '& .MuiTypography-root': {
                                        fontSize: '0.78rem',
                                        lineHeight: 1.2,
                                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.95)',
                                    },
                                } : undefined}
                                onClickHandler={() => {
                                    sendGameMessage([button.command, button.arg, button.uuid]);
                                }}
                            >
                                <RichText text={button.text} />
                            </GradientBorderButton>
                        );
                    })}
                </Box>
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
