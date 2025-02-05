import React from 'react';
import {
    Card as MuiCard,
    CardContent,
    Typography,
    Box,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { IGameCardProps, ICardData, IServerCardData } from './CardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { s3CardImageURL, s3TokenImageURL } from '@/app/_utils/s3Utils';
import { getBorderColor } from './cardUtils';
import { usePathname } from 'next/navigation'

// Type guard to check if the card is ICardData
const isICardData = (card: ICardData | IServerCardData): card is ICardData => {
    return (card as ICardData).uuid !== undefined;
};

const GameCard: React.FC<IGameCardProps> = ({
    card,
    size = 'standard',
    onClick,
    subcards = [],
    capturedCards = [],
    variant,
    disabled = false,
}) => {
    const pathname = usePathname();
    const isLobbyView = pathname === '/lobby';
    
    // Determine whether card is ICardData or IServerCardData
    const cardData = isICardData(card) ? card : card.card;
    const cardCounter = !isICardData(card) ? card.count : 0;
    const { sendGameMessage, connectedPlayer, getConnectedPlayerPrompt } = useGame();
    const isFaceUp = !!cardData;

    // default on click
    const defaultClickFunction = () => {
        if (cardData.selectable) {
            sendGameMessage(['cardClicked', cardData.uuid]);
        }
    };

    // upgrade on click
    /* const upgradeClickFunction = (card:ICardData) => {
		if(card.selectable){
			sendGameMessage(["cardClicked", card.uuid]);
		}
	}*/
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

    // Styles
    const styles = {
        cardStyles: {
            borderRadius: '.38em',
            position: 'relative',
            ...(variant === 'lobby'
                ? {
                    height: '13rem',
                    width: '10rem',
                    minWidth: '101px',
                    minHeight: '151px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                }
                : {
                    // For "standard" or other sizes:
                    height: size === 'standard' ? '10rem' : '7.7rem',
                    width: size === 'standard' ? '7.18rem' : '8rem',
                    border: `2px solid ${getBorderColor(cardData, connectedPlayer, getConnectedPlayerPrompt()?.promptType)}`,
                    ...(cardData?.exhausted && {
                        transform: 'rotate(4deg)',
                        transition: 'transform 0.15s ease' }
                    ),

                }
            ),
            '&:hover': {
                cursor: 'pointer',
            },
        },

        cardContentStyle: {
            width: '100%',
            height: '100%',
            position: 'relative',
            textAlign: 'center',
            whiteSpace: 'normal',
            backgroundColor: variant === 'lobby' ? 'transparent' : 'black',
            backgroundImage: `url(${s3CardImageURL(cardData)})`,
            backgroundSize: size === 'standard' ? 'contain' : 'cover',
            backgroundPosition: size === 'standard' ? 'center' : 'top',
            backgroundRepeat: 'no-repeat',
        },
        cardOverlay: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: cardData?.exhausted ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
            filter: 'none',
            clickEvents: 'none',
        },
        imageStyle: {
            width: '2.5rem',
            height: 'auto',
        },
        typographyStyle: {
            color: 'black',
            fontWeight: '400',
            fontSize: '1.3em',
            margin: 0,
        },

        counterIconLayer:{
            position: 'absolute',
            width: '100%',
            display: 'flex',
            height: '20%',
            bottom: '0px',
            backgroundPosition: 'center',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/counterIcon.svg)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        powerIconLayer:{
            position: 'absolute',
            width: '2rem',
            display: 'flex',
            height: '2.5rem',
            bottom: '0px',
            backgroundPosition: 'left',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: `url(${s3TokenImageURL('power-badge')})`,
            alignItems: 'center',
            justifyContent: 'center',
        },
        healthIconLayer:{
            position: 'absolute',
            width: '2rem',
            display: 'flex',
            height: '2.5rem',
            bottom: '0px',
            right: '0px',
            backgroundPosition: 'right',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: `url(${s3TokenImageURL('hp-badge')})`,
            alignItems: 'center',
            justifyContent: 'center',
        },
        damageIconLayer:{
            position: 'absolute',
            width: '6.5rem',
            display: 'flex',
            height: '2.5rem',
            bottom: '0px',
            right: '18px',
            background: 'linear-gradient(90deg, rgba(255, 0, 0, 0) 47.44%, rgba(255, 0, 0, 0.911111) 75.61%, #FF0000 102.56%)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        shieldIconLayer:{
            position: 'relative',
            width: '2rem',
            display: 'flex',
            height: '2.5rem',
            top:'0px',
            right: '0px',
            backgroundPosition: 'right',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: `url(${s3TokenImageURL('shield-token')})`,
            alignItems: 'center',
            justifyContent: 'center',
        },
        shieldContainerStyle: {
            position:'absolute',
            top:'0px',
            width: '100%',
            justifyContent: 'right',
            alignItems: 'center',
            columnGap: '4px'
        },
        upgradeIconLayer:{
            position: 'relative',
            width: '100%',
            display: 'flex',
            height: '30px',
            bottom:'0px',
            right: '0px',
            backgroundPosition: 'right',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'transparent',
        },
        damageNumberStyle:{
            fontSize: variant === 'lobby' ? '2rem' : '1.9rem',
            fontWeight: '700',
            position: 'absolute',
            right:'16px',
        },
        numberStyle:{
            fontSize: variant === 'lobby' ? '2rem' : '1.9rem',
            fontWeight: '700',
        },
        upgradeNameStyle:{
            fontSize: '11px',
            marginTop: '2px',
            fontWeight: '800',
            color: 'black'
        },
        sentinelStyle:{
            position: 'absolute',
            width: '2rem',
            display: 'flex',
            height: '2.5rem',
            top:'36px',
            right: '0px',
            backgroundPosition: 'right',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/SentinelToken.png)',
            alignItems: 'center',
            justifyContent: 'center',
        },
        unimplementedContainerStyle: {
            position: 'absolute',
            height: '100%',
            width: '100%',
            display: !cardData?.implemented && isFaceUp && !isLobbyView ? 'flex' : 'none',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '2',
            top: '0',
            left: '0'
        },
        unimplementedAlertStyle: {
            fontSize: '1rem',
            fontWeight: '700',
            backgroundImage: 'url(/not-implemented.svg)',
            backgroundPosition: 'center',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            height: 'auto',
            aspectRatio: '1/1',
            width: '50%'
        },
        capturedCardsDivider:{
            fontSize: '11px',
            fontWeight: 'bold',
            textAlign: 'center',
            color: 'white',
            mb:'0px',
            borderTop: '2px solid black',
            borderLeft: '2px solid black',
            borderRight: '2px solid black',
            position:'relative'
        }
    }
    return (
        <>
            <MuiCard sx={styles.cardStyles}

                onClick={disabled ? undefined : handleClick}
            >
                <Box sx={{ position: 'relative', height: '100%', width: '100%', backgroundColor: 'transparent' }}>
                    <Box sx={styles.unimplementedContainerStyle}>
                        <Box sx={styles.unimplementedAlertStyle}></Box>
                    </Box>
                    <CardContent sx={styles.cardContentStyle}>
                        <Box sx={styles.cardOverlay}></Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        </Box>
                        {variant === 'lobby' ? (
                            <Box sx={styles.counterIconLayer}>
                                <Typography sx={styles.numberStyle}>{cardCounter}</Typography>
                            </Box>
                        ) : variant === 'gameboard' ? (
                            <>
                                <Grid direction="row" container sx={styles.shieldContainerStyle}>
                                    {shieldCards.map((_, index) => (
                                        <Box
                                            key={`${cardData.uuid}-shield-${index}`}
                                            sx={styles.shieldIconLayer}
                                        />
                                    ))}
                                </Grid>
                                {cardData.sentinel && (
                                    <Box sx={styles.sentinelStyle}/>
                                )}
                                <Box sx={styles.powerIconLayer}>
                                    <Typography sx={{ ...styles.numberStyle,marginRight:'2px' }}>{cardData.power}</Typography>
                                </Box>
                                {Number(cardData.damage) > 0 && (
                                    <Box sx={styles.damageIconLayer}>
                                        <Typography sx={styles.damageNumberStyle}>
                                            {cardData.damage}
                                        </Typography>
                                    </Box>
                                )}
                                <Box sx={styles.healthIconLayer}>
                                    <Typography sx={{ ...styles.numberStyle,marginLeft:'2px' }}>{cardData.hp}</Typography>
                                </Box>
                            </>
                        ) : null}
                    </CardContent>
                </Box>
            </MuiCard>
            {otherUpgradeCards.map((subcard, index) => (
                <Box
                    key={subcard.uuid}
                    sx={{ ...styles.upgradeIconLayer,
                        backgroundImage: `url(${(cardUpgradebackground(subcard))})`,
                        bottom: `${index * 7 + 2}px`,
                    }}
                    // onClick={() => upgradeClickFunction(subcard)}
                >
                    <Typography key={subcard.uuid} sx={styles.upgradeNameStyle}>{subcard.name}</Typography>
                </Box>
            ))}

            {/* Separator for Captured Cards */}
            {capturedCards.length > 0 && (
                <>
                    <Typography
                        sx={{
                            ...styles.capturedCardsDivider,
                            bottom:`${otherUpgradeCards.length * 7}px`,
                        }}
                    >
                        Captured
                    </Typography>
                    {capturedCards.map((capturedCard, index) => (
                        <Box
                            key={`captured-${capturedCard.uuid}`}
                            sx={{
                                ...styles.upgradeIconLayer,
                                backgroundImage: `url(${cardUpgradebackground(capturedCard)})`,
                                bottom:`${(otherUpgradeCards.length * 7 + 2) + index * 7}px`,
                            }}
                        >
                            <Typography sx={styles.upgradeNameStyle}>
                                {capturedCard.name}
                            </Typography>
                        </Box>
                    ))}
                </>
            )}
        </>
    );
};

export default GameCard;