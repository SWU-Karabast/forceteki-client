import React from 'react';
import {
    Typography,
    Box,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { IGameCardProps, ICardData, IServerCardData, CardStyle } from './CardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { s3CardImageURL, s3TokenImageURL } from '@/app/_utils/s3Utils';
import { getBorderColor } from './cardUtils';
import { TbBackground } from 'react-icons/tb';
import { Black_And_White_Picture } from 'next/font/google';

// Type guard to check if the card is ICardData
const isICardData = (card: ICardData | IServerCardData): card is ICardData => {
    return (card as ICardData).zone !== undefined;
};

const GameCard: React.FC<IGameCardProps> = ({
    card,
    onClick,
    cardStyle = CardStyle.Plain,
    subcards = [],
    capturedCards = [],
    disabled = false,
}) => {
    const { sendGameMessage, connectedPlayer, getConnectedPlayerPrompt } = useGame();
    const cardData = isICardData(card) ? card : card.card;

    if (!cardData) {
        return null;
    }

    const cardCounter = !isICardData(card) ? card.count : 0;

    // default on click
    const defaultClickFunction = () => {
        if (cardData.selectable) {
            sendGameMessage(['cardClicked', cardData.uuid]);
        }
    };
    const handleClick = onClick ?? defaultClickFunction;

    // helper function to get the correct aspects for the upgrade cards
    const cardUpgradebackground = (card: ICardData) => {
        if (!card.aspects){
            return null
        }

        // Check if Villainy or Heroism are the sole aspects
        if (card.aspects.includes('villainy') && card.aspects.length === 1) {
            return 'upgrade-black.png';
        }
        if (card.aspects.includes('heroism') && card.aspects.length === 1) {
            return 'upgrade-white.png';
        }
        // Check other aspects
        switch (true) {
            case card.aspects.includes('aggression'):
                return 'upgrade-red.png';
            case card.aspects.includes('command'):
                return 'upgrade-green.png';
            case card.aspects.includes('cunning'):
                return 'upgrade-yellow.png';
            case card.aspects.includes('vigilance'):
                return 'upgrade-blue.png';
            default:
                // Fallback for unexpected cases
                return 'upgrade-grey.png';
        }
    };
    // Filter subcards into Shields and other upgrades
    const shieldCards = subcards.filter((subcard) => subcard.name === 'Shield');
    const otherUpgradeCards = subcards.filter((subcard) => subcard.name !== 'Shield');
    const borderColor = getBorderColor(cardData, connectedPlayer, getConnectedPlayerPrompt()?.promptType, cardStyle);

    // Styles
    const styles = {
        cardContainer: {
            backgroundColor: 'black',
            width: cardStyle === CardStyle.InPlay ? '7.18rem' : '8rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: cardData.exhausted ? 'rotate(4deg)' : 'none',
            transition: 'transform 0.15s ease',
            '&:hover': {
                cursor: disabled ? 'normal' : 'pointer',
            },
        },
        card: {
            borderRadius: '.38em',
            position: 'relative',
            backgroundImage: `url(${s3CardImageURL(cardData)})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio: cardStyle === CardStyle.InPlay ? '1.058' : '.718',
            width: '100%',
            border: borderColor ? `2px solid ${borderColor}` : '2px solid transparent',
            boxSizing: 'border-box',
        },
        cardOverlay: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: cardData?.exhausted ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
            filter: 'none',
            clickEvents: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
        numberFont: {
            fontSize: '1.85rem',
            fontWeight: '700',
            textShadow: '0px 0px 3px black',
            lineHeight: 1
        },
        counterIcon:{
            position: 'absolute',
            width: '2rem',
            aspectRatio: '1 / 1',
            display: 'flex',
            bottom: '-5px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/counterIcon.svg)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        powerIcon:{
            position: 'absolute',
            width: '1.9rem',
            aspectRatio: '3 / 4',
            display: 'flex',
            bottom: '-6px',
            left: '-4px',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: `url(${s3TokenImageURL('power-badge')})`,
            alignItems: 'center',
            justifyContent: 'center',
        },
        healthIcon:{
            position: 'absolute',
            width: '1.9rem',
            aspectRatio: '3 / 4',
            display: 'flex',
            bottom: '-6px',
            right: '-4px',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: `url(${s3TokenImageURL('hp-badge')})`,
            alignItems: 'center',
            justifyContent: 'center',
        },
        damageIcon:{
            position: 'absolute',
            width: '6.5rem',
            display: 'flex',
            height: '2.5rem',
            bottom: '-6px',
            right: '14px',
            background: 'linear-gradient(90deg, rgba(255, 0, 0, 0) 47.44%, rgba(255, 0, 0, 0.911111) 75.61%, #FF0000 102.56%)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        damageNumber:{
            fontSize: '1.9rem',
            fontWeight: '700',
            position: 'absolute',
            right:'16px',
        },
        shieldContainer: {
            position:'absolute',
            top:'-6px',
            right: '-4px',
            width: '100%',
            justifyContent: 'right',
            alignItems: 'center',
            columnGap: '4px'
        },
        shieldIcon:{
            width: '1.8rem',
            aspectRatio: '1 / 1',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: `url(${s3TokenImageURL('shield-token')})`,
        },
        upgradeIcon:{
            width: '100%',
            aspectRatio: '4.85',
            display: 'flex',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            alignItems: 'center',
            justifyContent: 'center',
        },
        upgradeName:{
            fontSize: '11px',
            marginTop: '2px',
            fontWeight: '800',
            color: 'black'
        },
        sentinelIcon:{
            position: 'absolute',
            width: '1.8rem',
            aspectRatio: '1 / 1',
            top:'32%',
            right: '-4px',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/SentinelToken.png)',
        },
        unimplementedAlert: {
            display: cardData?.hasOwnProperty('implemented') && !cardData?.implemented ? 'flex' : 'none',
            backgroundImage: 'url(/not-implemented.svg)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            aspectRatio: '1/1',
            width: '50%'
        },
        capturedCardsDivider:{
            fontSize: '11px',
            fontWeight: 'bold',
            textAlign: 'center',
            color: 'white',
            width: '100%',
            backgroundColor:'black',
            mb:'0px',
            position:'relative'
        }
    }
    return (
        <Box sx={styles.cardContainer}>
            <Box sx={styles.card} onClick={disabled ? undefined : handleClick}>
                <Box sx={styles.cardOverlay}>
                    <Box sx={styles.unimplementedAlert}></Box>
                </Box>
                {cardStyle === CardStyle.Lobby && (
                    <Box sx={styles.counterIcon}>
                        <Typography sx={styles.numberFont}>{cardCounter}</Typography>
                    </Box>
                )}
                {cardStyle === CardStyle.InPlay && (
                    <>
                        <Grid direction="row" container sx={styles.shieldContainer}>
                            {shieldCards.map((_, index) => (
                                <Box
                                    key={`${cardData.uuid}-shield-${index}`}
                                    sx={styles.shieldIcon}
                                />
                            ))}
                        </Grid>
                        {cardData.sentinel && (
                            <Box sx={styles.sentinelIcon}/>
                        )}
                        <Box sx={styles.powerIcon}>
                            <Typography sx={styles.numberFont}>{cardData.power}</Typography>
                        </Box>
                        {Number(cardData.damage) > 0 && (
                            <Box sx={styles.damageIcon}>
                                <Typography sx={styles.damageNumber}>
                                    {cardData.damage}
                                </Typography>
                            </Box>
                        )}
                        <Box sx={styles.healthIcon}>
                            <Typography sx={styles.numberFont}>{cardData.hp}</Typography>
                        </Box>
                    </>
                )}
            </Box>

            {otherUpgradeCards.map((subcard) => (
                <Box
                    key={subcard.uuid}
                    sx={{ ...styles.upgradeIcon,
                        backgroundImage: `url(${(cardUpgradebackground(subcard))})`,
                    }}
                >
                    <Typography key={subcard.uuid} sx={styles.upgradeName}>{subcard.name}</Typography>
                </Box>
            ))}

            {capturedCards.length > 0 && (
                <>
                    <Typography sx={styles.capturedCardsDivider}>
                        Captured
                    </Typography>
                    {capturedCards.map((capturedCard) => (
                        <Box
                            key={`captured-${capturedCard.uuid}`}
                            sx={{
                                ...styles.upgradeIcon,
                                backgroundImage: `url(${cardUpgradebackground(capturedCard)})`
                            }}
                        >
                            <Typography sx={styles.upgradeName}>
                                {capturedCard.name}
                            </Typography>
                        </Box>
                    ))}
                </>
            )}
        </Box>
    );
};

export default GameCard;