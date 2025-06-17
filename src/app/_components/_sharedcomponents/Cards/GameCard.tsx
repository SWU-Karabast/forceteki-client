import React from 'react';
import { Box, Popover, PopoverOrigin, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { CardStyle, ICardData, IGameCardProps } from './CardTypes';
import CardValueAdjuster from './CardValueAdjuster';
import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';
import { s3CardImageURL, s3TokenImageURL } from '@/app/_utils/s3Utils';
import { getBorderColor } from './cardUtils';
import { useLeaderCardFlipPreview } from '@/app/_hooks/useLeaderPreviewFlip';
import { DistributionEntry } from '@/app/_hooks/useDistributionPrompt';

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
    const isOpponentEffect = gameState?.players[connectedPlayer]?.promptState.isOpponentEffect;
    const phase = gameState?.phase;
    const activePlayer = gameState?.players?.[connectedPlayer]?.isActionPhaseActivePlayer;

    const cardInPlayersHand = card.controllerId === connectedPlayer && card.zone === 'hand';
    const cardInOpponentsHand = card.controllerId !== connectedPlayer && card.zone === 'hand';

    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const [isCtrl, setIsCtrl] = React.useState<boolean>(false);
    const [isLeader, setIsLeader] = React.useState<boolean>(false);
    const hoverTimeout = React.useRef<number | undefined>(undefined);
    const open = Boolean(anchorElement);

    const isStolen = React.useMemo(() => {
        if (!(card.controllerId && card.ownerId)) {
            return false
        }
        return card.controllerId !== card.ownerId
    }, [card.controllerId, card.ownerId])

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
        setIsCtrl(false);
    };


    useLeaderCardFlipPreview(
        anchorElement,
        anchorElement?.getAttribute('data-card-id') || undefined,
        setPreviewImage,
        CardStyle.Plain,
        CardStyle.PlainLeader,
        setIsCtrl,
        setIsLeader
    )

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
        const isInDistributionData = distributionPromptData.valueDistribution.some((item: DistributionEntry) => item.uuid === card.uuid);
    
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
            setAnchorElement(null);
            setPreviewImage(null);
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
    const distributionAmount = distributionPromptData?.valueDistribution.find((item: DistributionEntry) => item.uuid === card.uuid)?.amount || 0;
    const isIndirectDamage = getConnectedPlayerPrompt()?.distributeAmongTargets?.isIndirectDamage;
    // Styles
    const styles = {
        cardContainer: {
            position: 'relative',
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
            backgroundImage: card.selected && (phase === 'setup' || phase === 'regroup') ? `linear-gradient(rgba(255, 254, 80, 0.2), rgba(255, 254, 80, 0.6)), url(${s3CardImageURL(card, cardStyle)})` : `url(${s3CardImageURL(card, cardStyle)})`,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio: cardStyle === CardStyle.InPlay ? '1' : '1/1.4',
            width: '100%',
            border: borderColor && card.selected && card.zone !== 'hand' ? `4px solid ${borderColor}` : isOpponentEffect && card.selectable ? '2px solid rgba(198, 4, 198, 1)' : borderColor ? `2px solid ${borderColor}` : '2px solid transparent',
            boxShadow: borderColor && card.selected && card.zone !== 'hand' ? `0 0 7px 3px ${borderColor}` : 'none',
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
            userSelect: 'none'
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
        isHidden:{
            position: 'absolute',
            width: '28%',
            aspectRatio: '1 / 1',
            top:'-5%',
            left: '-4%',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/HiddenIcon.png)',
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
            aspectRatio: isCtrl ? '1.4 / 1' : '1 / 1.4',
            width: isCtrl ? '25rem' : '16rem',
        },
        attackIcon: {
            position: 'absolute',
            backgroundImage: 'url(/Attacking.svg)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            width: '60%',
            height: '10%',
            top: activePlayer ? '-7%' : '',
            bottom: !activePlayer ? '-7%' : '',
            left: '50%',
            transform: !activePlayer ? 'translate(-50%, 0) rotate(180deg)' : 'translate(-50%, 0)',
            zIndex: '1',
        },
        defendIcon: {
            position: 'absolute',
            backgroundImage: 'url(/defending.svg)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            width: '60%',
            height: '10%',
            top: !activePlayer ? '-10%' : '',
            bottom: activePlayer ? '-10%' : '',
            left: '50%',
            transform: !activePlayer ? 'translate(-50%, 0) rotate(180deg)' : 'translate(-50%, 0)',
            zIndex: '1',
        },
        resourceIcon: {
            position: 'absolute', 
            backgroundImage: card.selected && card.zone === 'hand' && (phase === 'setup' || phase === 'regroup') ? 'url(resource-icon.png)' : '',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            top: '20%',
            left: '50%',
            transform: 'translate(-50%, 0)',   
            width: '24%',
            height: '24%',
        },
        ctrlText: {
            bottom: '0px',
            display: 'flex',
            justifySelf: 'center',
            width: 'fit-content',
            height: '2rem',
            color: 'white',
            fontSize: '1rem',
            fontWeight: 'bold',
            textShadow: `
                -1px -1px 0 #000,  
                 1px -1px 0 #000,
                -1px  1px 0 #000,
                 1px  1px 0 #000
            `
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
                data-card-type={card.printedType}
                data-card-id={card.setId? card.setId.set+'_'+card.setId.number : card.id}
            >
                <Box sx={styles.cardOverlay}>
                    <Box sx={styles.unimplementedAlert}></Box>
                    <Box sx={styles.resourceIcon}/>
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
                {card.hidden && (
                    <Box sx={styles.isHidden}/>
                )}
                {cardStyle === CardStyle.InPlay && (
                    <>
                        { showValueAdjuster() && <CardValueAdjuster card={card} isIndirect={isIndirectDamage} /> }
                        <Grid direction="row" container sx={styles.shieldContainer}>
                            {shieldCards.map((shieldCard, index) => (
                                <Box
                                    key={`${card.uuid}-shield-${index}`}
                                    sx={{ 
                                        ...styles.shieldIcon, 
                                        border: shieldCard.selectable ? `2px solid ${getBorderColor(shieldCard, connectedPlayer)}` : 'none',
                                        cursor: shieldCard.selectable ? 'pointer' : 'normal'
                                    }}
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

            {card.isAttacker && <Box sx={styles.attackIcon}/>}
            {card.isDefender && <Box sx={styles.defendIcon}/>}

            <Popover
                id="mouse-over-popover"
                sx={{ pointerEvents: 'none' }}
                open={open}
                anchorEl={anchorElement}
                onClose={handlePreviewClose}
                disableRestoreFocus
                slotProps={{ paper: { sx: { backgroundColor: 'transparent', boxShadow: 'none' }, tabIndex: -1 } }}
                {...popoverConfig()}
            >
                <Box sx={{ ...styles.cardPreview, backgroundImage: previewImage }} />
                {(isLeader) && (
                    <Typography variant={'body1'} sx={styles.ctrlText}
                    >CTRL: View Flipside</Typography>
                )}
            </Popover>

            {otherUpgradeCards.map((subcard) => (
                <Box
                    key={subcard.uuid}
                    sx={{ ...styles.upgradeIcon,
                        backgroundImage: `url(${(cardUpgradebackground(subcard))})`,
                        border: subcard.selectable ? `2px solid ${getBorderColor(subcard, connectedPlayer)}` : 'none',
                        cursor: subcard.selectable ? 'pointer' : 'normal'
                    }}
                    onClick={() => subcardClick(subcard)}
                    onMouseEnter={handlePreviewOpen}
                    onMouseLeave={handlePreviewClose}
                    data-card-url={s3CardImageURL(subcard)}
                    data-card-type={subcard.printedType}
                    data-card-id={subcard.setId? subcard.setId.set+'_'+subcard.setId.number : subcard.id}
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
                                border: capturedCard.selectable ? `2px solid ${getBorderColor(capturedCard, connectedPlayer)}` : 'none',
                                cursor: capturedCard.selectable ? 'pointer' : 'normal'
                            }}
                            onClick={() => subcardClick(capturedCard)}
                            onMouseEnter={handlePreviewOpen}
                            onMouseLeave={handlePreviewClose}
                            data-card-url={s3CardImageURL(capturedCard)}
                            data-card-type={capturedCard.printedType}
                            data-card-id={capturedCard.setId? capturedCard.setId.set+'_'+capturedCard.setId.number : capturedCard.id}
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
