import React from 'react';
import {
    Typography,
    Box,
    Popover,
    PopoverOrigin,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { IGameCardProps, ICardData, CardStyle } from './CardTypes';
import CardValueAdjuster from './CardValueAdjuster';
import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';
import { s3CardImageURL, s3TokenImageURL } from '@/app/_utils/s3Utils';
import { getBorderColor } from './cardUtils';

const GameCard: React.FC<IGameCardProps> = ({
    card,
    onClick,
    cardStyle = CardStyle.Plain,
    subcards = [],
    capturedCards = [],
    disabled = false,
}) => {
    const { sendGameMessage, connectedPlayer, getConnectedPlayerPrompt, distributionPromptData, gameState } = useGame();
    const { clearPopups } = usePopup();

    const distributeHealing = gameState?.players[connectedPlayer]?.promptState.distributeAmongTargets?.type === 'distributeHealing';

    const cardInPlayersHand = card.controller?.id === connectedPlayer && card.zone === 'hand';
    const cardInOpponentsHand = card.controller?.id !== connectedPlayer && card.zone === 'hand';
    
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const hoverTimeout = React.useRef<number | undefined>(undefined);
    const open = Boolean(anchorElement);

    const isStolen = React.useMemo(() => {
        if (!(card.controller && card.owner)) {
            return false
        }
        return card.controller.id !== card.owner.id
    }, [card.controller, card.owner])

    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.currentTarget;
        const imageUrl = target.getAttribute('data-card-url');
        
        if (!imageUrl) return;

        if (cardInOpponentsHand) {
            return;
        }

        hoverTimeout.current = window.setTimeout(() => {
            setAnchorElement(target);
            setPreviewImage(`url(${imageUrl})`);
        }, 200);
    };
    
    const handlePreviewClose = () => {
        clearTimeout(hoverTimeout.current);
        setAnchorElement(null);
        setPreviewImage(null);
    };

    const popoverConfig = (): { anchorOrigin: PopoverOrigin, transformOrigin: PopoverOrigin } => {
        if (cardInPlayersHand) {
            return { 
                anchorOrigin:{
                    vertical: -5,
                    horizontal: 'center',
                },
                transformOrigin: {
                    vertical: 'bottom',
                    horizontal: 'center',
                } };
        }

        return { 
            anchorOrigin:{
                vertical: 'center',
                horizontal: -5,
            },
            transformOrigin: {
                vertical: 'center',
                horizontal: 'right',
            } };
    }

    const showValueAdjuster = () => {
        const prompt = getConnectedPlayerPrompt();
    
        // Ensure prompt is valid and conditions are met
        if (!prompt || prompt.promptType !== 'distributeAmongTargets' || !card.selectable || !distributionPromptData) {
            return false;
        }
    
        const maxTargets = prompt.distributeAmongTargets.maxTargets;
        const isInDistributionData = distributionPromptData.valueDistribution.some(item => item.uuid === card.uuid);
    
        // If maxTargets is defined and already reached, allow only if the card is part of the selection
        if (maxTargets && distributionPromptData.valueDistribution.length >= maxTargets && !isInDistributionData) {
            return false;
        }
    
        return true;
    };

    if (!card) {
        return null;
    }

    const notImplemented = (card: ICardData) => card?.hasOwnProperty('implemented') && !card.implemented;

    const getBackgroundColor = (card: ICardData) => {
        if (
            notImplemented(card) ||
            card?.exhausted && card.zone !== 'resource'
        ) {
            return 'rgba(0, 0, 0, 0.5)';
        }

        return 'transparent';
    }

    const defaultClickFunction = () => {
        if (card.selectable) {
            sendGameMessage(['cardClicked', card.uuid]);
        }
    };

    const clickDisabled = () => {
        return showValueAdjuster() || disabled || card.selectable === false;
    }

    const handleClick = () => {
        if (clickDisabled()) {
            return;
        }
        if (getConnectedPlayerPrompt()?.selectCardMode !== 'multiple') {
            clearPopups();
        }  
        (onClick || defaultClickFunction)();
    }

    const subcardClick = (subCard: ICardData) => {
        if (subCard.selectable) {
            sendGameMessage(['cardClicked', subCard.uuid]);
        }
    }


    
    // helper function to get the correct aspects for the upgrade cards
    const cardUpgradebackground = (card: ICardData) => {
        if (!card.aspects){
            return null
        }
        if (card.aspects.includes('villainy') && card.aspects.length === 1) {
            return 'upgrade-black.png';
        }
        if (card.aspects.includes('heroism') && card.aspects.length === 1) {
            return 'upgrade-white.png';
        }
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
                return 'upgrade-grey.png';
        }
    };
    // Filter subcards into Shields and other upgrades
    const shieldCards = subcards.filter((subcard) => subcard.name === 'Shield');
    const otherUpgradeCards = subcards.filter((subcard) => subcard.name !== 'Shield');
    const borderColor = getBorderColor(card, connectedPlayer, getConnectedPlayerPrompt()?.promptType, cardStyle);
    const cardCounter = card.count || 0;
    const distributionAmount = distributionPromptData?.valueDistribution.find((item) => item.uuid === card.uuid)?.amount || 0;
    const isIndirectDamage = getConnectedPlayerPrompt()?.distributeAmongTargets?.isIndirectDamage;

    // Styles
    const styles = {
        cardContainer: {
            backgroundColor: 'black',
            borderRadius: '0.5rem',
            width: '100%',
            maxHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transform: card.exhausted && card.zone !== 'resource' ? 'rotate(4deg)' : 'none',
            transition: 'transform 0.15s ease',
            '&:hover': {
                cursor: clickDisabled() ? 'normal' : 'pointer',
            },
        },
        card: {
            borderRadius: '0.5rem',
            position: 'relative',
            backgroundImage: `url(${s3CardImageURL(card, cardStyle)})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio: cardStyle === CardStyle.InPlay ? '1' : '1/1.4',
            width: '100%',
            border: borderColor ? `2px solid ${borderColor}` : '2px solid transparent',
            boxSizing: 'border-box',
        },
        cardOverlay: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: getBackgroundColor(card),
            filter: 'none',
            clickEvents: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
        numberFont: {
            fontSize: '1em',
            fontWeight: '700',
            textShadow: '0px 0px 3px black',
            display: 'flex',          
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',   
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
            width: '28%',
            aspectRatio: '3 / 4',
            display: 'flex',
            bottom: '-6%',
            left: '-4%',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: `url(${s3TokenImageURL('power-badge')})`,
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(0.5rem, 1.8vw, 2rem)',
        },
        healthIcon:{
            position: 'absolute',
            width: '28%',
            aspectRatio: '3 / 4',
            display: 'flex',
            bottom: '-6%',
            right: '-4%',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: `url(${s3TokenImageURL('hp-badge')})`,
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(0.5rem, 1.8vw, 2rem)',
        },
        damageIcon:{
            position: 'absolute',
            width: '100%',
            height: '34%',
            display: 'flex',
            bottom: '-4%',
            right: '4%',
            
            background: 'linear-gradient(90deg, rgba(255, 0, 0, 0) 40.44%, rgba(255, 0, 0, 0.911111) 65%, #FF0000 102.56%)',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(0.5rem, 1.8vw, 2rem)',
        },
        damageNumber:{
            fontSize: '1em',
            fontWeight: '700',
            position: 'absolute',
            right: '24%',
            display: 'flex',          
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',   
        },
        shieldContainer: {
            position:'absolute',
            top:'-5%',
            right: '-4%',
            width: '100%',
            justifyContent: 'right',
            alignItems: 'center',
            columnGap: '4px'
        },
        shieldIcon:{
            width: '28%',
            aspectRatio: '1 / 1',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: `url(${s3TokenImageURL('shield-token')})`,
        },
        upgradeIcon:{
            width: '100%',
            aspectRatio: '4.85',
            display: 'flex',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'content-box',
        },
        upgradeName: {
            fontSize: 'clamp(4px, .65vw, 12px)',
            marginTop: '2px',
            fontWeight: '800',
            whiteSpace: 'nowrap',
            overflow: 'hidden',           
            color: 'black',
            textAlign: 'center', 
        },
        sentinelIcon:{
            position: 'absolute',
            width: '28%',
            aspectRatio: '1 / 1',
            top:'32%',
            right: '-4%',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: `url(${s3TokenImageURL('sentinel-icon')})`,
            filter: 'drop-shadow(0 6px 6px 0 #00000040)'
        },
        stolenIcon:{
            position: 'absolute',
            width: '28%',
            aspectRatio: '1 / 1',
            top:'32%',
            left: '-4%',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/StolenIcon.png)',
        },
        unimplementedAlert: {
            display: notImplemented(card) ? 'flex' : 'none',
            backgroundImage: 'url(/not-implemented.svg)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            aspectRatio: '1/1',
            width: '50%'
        },
        damageCounter: {
            fontWeight: '800',
            fontSize: '1.9rem',
            color: 'white',
            width: '2.5rem',
            aspectRatio: '1 / 1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: distributeHealing ? 'rgba(0, 186, 255, 1)' : 'url(/token-background.svg)',
            borderRadius: distributeHealing ? '17px 8px' : '0px',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            filter: 'drop-shadow(0 4px 4px 0 #00000040)',
            textShadow: '1px 1px #00000033'
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
        },
        cardPreview: {
            borderRadius: '.38em',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio: '1 / 1.4',
            width: '16rem',
        },
    }

    return (
        <Box sx={styles.cardContainer}>
            <Box 
                sx={styles.card} 
                onClick={handleClick}
                onMouseEnter={handlePreviewOpen}
                onMouseLeave={handlePreviewClose}
                data-card-url={s3CardImageURL(card)}
            >
                <Box sx={styles.cardOverlay}>
                    <Box sx={styles.unimplementedAlert}></Box>
                    { !!distributionAmount && (
                        <Typography variant="body1" sx={styles.damageCounter}>
                            {distributionAmount}
                        </Typography>
                    )}
                </Box>
                {cardStyle === CardStyle.Lobby && (
                    <Box sx={styles.counterIcon}>
                        <Typography sx={styles.numberFont}>{cardCounter}</Typography>
                    </Box>
                )}
                {isStolen && (
                    <Box sx={styles.stolenIcon}/>
                )}
                {cardStyle === CardStyle.InPlay && (
                    <>
                        { showValueAdjuster() && <CardValueAdjuster card={card} isIndirect={isIndirectDamage} /> }
                        <Grid direction="row" container sx={styles.shieldContainer}>
                            {shieldCards.map((shieldCard, index) => (
                                <Box
                                    key={`${card.uuid}-shield-${index}`}
                                    sx={{ ...styles.shieldIcon , border: shieldCard.selectable ? `2px solid ${getBorderColor(shieldCard, connectedPlayer)}` : 'none' }}
                                    onClick={() => subcardClick(shieldCard)}
                                />
                            ))}
                        </Grid>
                        {card.sentinel && (
                            <Box sx={styles.sentinelIcon}/>
                        )}
                        <Box sx={styles.powerIcon}>
                            <Typography sx={styles.numberFont}>{card.power}</Typography>
                        </Box>
                        {Number(card.damage) > 0 && (
                            <Box sx={styles.damageIcon}>
                                <Typography sx={styles.damageNumber}>
                                    {card.damage}
                                </Typography>
                            </Box>
                        )}
                        <Box sx={styles.healthIcon}>
                            <Typography sx={styles.numberFont}>{card.hp}</Typography>
                        </Box>
                    </>
                )}
            </Box>

            <Popover
                id="mouse-over-popover"
                sx={{ pointerEvents: 'none' }}
                open={open}
                anchorEl={anchorElement}
                onClose={handlePreviewClose}
                disableRestoreFocus
                slotProps={{ paper: { sx: { backgroundColor: 'transparent' } } }}
                {...popoverConfig()}
            >
                <Box sx={{ ...styles.cardPreview, backgroundImage: previewImage }} />
            </Popover>

            {otherUpgradeCards.map((subcard) => (
                <Box
                    key={subcard.uuid}
                    sx={{ ...styles.upgradeIcon,
                        backgroundImage: `url(${(cardUpgradebackground(subcard))})`,
                        border: subcard.selectable ? `2px solid ${getBorderColor(subcard, connectedPlayer)}` : 'none'
                    }}
                    onClick={() => subcardClick(subcard)}
                    onMouseEnter={handlePreviewOpen}
                    onMouseLeave={handlePreviewClose}
                    data-card-url={s3CardImageURL(subcard)}
                >
                    <Typography key={subcard.uuid} sx={styles.upgradeName}>{subcard.name}</Typography>
                </Box>
            ))}

            {capturedCards.length > 0 && (
                <>
                    <Typography sx={styles.capturedCardsDivider}>
                        Captured
                    </Typography>
                    {capturedCards.map((capturedCard: ICardData) => (
                        <Box
                            key={`captured-${capturedCard.uuid}`}
                            sx={{
                                ...styles.upgradeIcon,
                                backgroundImage: `url(${cardUpgradebackground(capturedCard)})`,
                                border: capturedCard.selectable ? `2px solid ${getBorderColor(capturedCard, connectedPlayer)}` : 'none'
                            }}
                            onClick={() => subcardClick(capturedCard)}
                            onMouseEnter={handlePreviewOpen}
                            onMouseLeave={handlePreviewClose}
                            data-card-url={s3CardImageURL(capturedCard)}
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
