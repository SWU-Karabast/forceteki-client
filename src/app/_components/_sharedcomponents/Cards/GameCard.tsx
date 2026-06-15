import React from 'react';
import { Box, Popover, PopoverOrigin, Tooltip, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { CardStyle, ICardData, IGameCardProps } from './CardTypes';
import CardValueAdjuster from './CardValueAdjuster';
import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';
import { cardImageLabel, s3CardImageURL, s3TokenImageURL } from '@/app/_utils/s3Utils';
import { useCardImageLocale } from '@/app/_contexts/CardImageLocale.context';
import { getBorderColor } from './cardUtils';
import { useImageLoadStatus } from '@/app/_hooks/useImageLoadStatus';
import { CardImageMissingOverlay, cardImageFillSx } from './CardImageMissingOverlay';
import { useLeaderCardFlipPreview } from '@/app/_hooks/useLeaderPreviewFlip';
import { useLongPress } from '@/app/_hooks/useLongPress';
import { DistributionEntry } from '@/app/_hooks/useDistributionPrompt';
import { useCosmetics } from '@/app/_contexts/CosmeticsContext';
import { useEffectHighlightSx } from '@/app/_contexts/ConstantEffectHighlight.context';
import { ZoneName } from '@/app/_constants/constants';

import { DamageCounterToken } from '../_styledcomponents/damageCounterToken';


const usePopoverConfig = (card: ICardData): { anchorOrigin: PopoverOrigin, transformOrigin: PopoverOrigin } => {
    const { connectedPlayer } = useGame();
    const cardInPlayersHand = card.controllerId === connectedPlayer && card.zone === 'hand';
    const arena = card.zone;

    if (cardInPlayersHand) {
        return {
            anchorOrigin:{
                vertical: -5,
                horizontal: 'center',
            },
            transformOrigin: {
                vertical: 'bottom',
                horizontal: 'center',
            }
        };
    }

    // if the unit is on the left side, we display the popover to the right.
    // if the unit is on the right side, we display the popover to the left
    // we want to avoid displaying the popover on the same place as the card if there's no remaining screen left
    return {
        anchorOrigin:{
            vertical: 'center',
            horizontal: arena === ZoneName.SpaceArena ? 'right' : -5,
        },
        transformOrigin: {
            vertical: 'center',
            horizontal: arena === ZoneName.SpaceArena ? -5 : 'right',
        }
    };
}

const GameCard: React.FC<IGameCardProps> = ({
    card,
    onClick,
    cardStyle = CardStyle.Plain,
    subcards = [],
    capturedCards = [],
    disabled = false,
    overlapEnabled = false,
    cardback = undefined,
}) => {
    const { sendGameMessage, connectedPlayer, getConnectedPlayerPrompt, distributionPromptData, gameState, isSpectator, hoveredChatCard } = useGame();
    const { clearPopups } = usePopup();
    const { getCardback } = useCosmetics();
    const highlightSx = useEffectHighlightSx(card?.uuid);

    const locale = useCardImageLocale();

    const distributeHealing = gameState?.players[connectedPlayer]?.promptState.distributeAmongTargets?.type === 'distributeHealing';
    const isOpponentEffect = gameState?.players[connectedPlayer]?.promptState.isOpponentEffect;
    const phase = gameState?.phase;
    const activePlayer = gameState?.players?.[connectedPlayer]?.isActionPhaseActivePlayer;

    const cardInOpponentsHand = card.controllerId !== connectedPlayer && card.zone === 'hand';
    const isHiddenHandCard = overlapEnabled && (cardInOpponentsHand || (isSpectator && card.zone === 'hand'));
    const popoverConfig = usePopoverConfig(card);

    // Check if card is blocked from play by opponent's effect (e.g., Regional Governor, Trade Route Taxation)
    const isBlockedFromPlay = !!card.blockedFromPlayReason;

    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const hoverTimeout = React.useRef<number | undefined>(undefined);
    const open = Boolean(anchorElement);
    const isHoveredInChat = hoveredChatCard.id === card.uuid;
    const isPreviewingLeaderCard = anchorElement?.getAttribute('data-card-type') === 'leader';

    const {
        aspectRatio,
        width,
        isFlipped,
    } = useLeaderCardFlipPreview({
        anchorElement,
        cardId: anchorElement?.getAttribute('data-card-id') || undefined,
        setPreviewImage,
        frontCardStyle: CardStyle.Plain,
        backCardStyle: CardStyle.PlainLeader,
        isLeader: isPreviewingLeaderCard,
        isDeployed: true,
    });

    const [isTouchDevice, setIsTouchDevice] = React.useState(false);

    const longPressHandlers = useLongPress({
        onLongPress: (target) => {
            const imageUrl = target.getAttribute('data-card-url');
            if (!imageUrl || cardInOpponentsHand) return;
            setIsTouchDevice(true);
            setAnchorElement(target);
            setPreviewImage(`url(${imageUrl})`);
        },
        onRelease: () => {
            setAnchorElement(null);
            setPreviewImage(null);
        },
    });

    const isStolen = React.useMemo(() => {
        if (!(card.controllerId && card.ownerId)) {
            return false
        }
        return card.controllerId !== card.ownerId
    }, [card.controllerId, card.ownerId])

    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
        // Skip hover preview on touch devices to avoid brief flash on tap
        if (window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches) return;

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

    // Tap-anywhere-to-close fallback for touch devices
    React.useEffect(() => {
        if (!open || !isTouchDevice) return;
        const onTouchStart = () => handlePreviewClose();
        document.addEventListener('touchstart', onTouchStart);
        return () => document.removeEventListener('touchstart', onTouchStart);
    }, [open, isTouchDevice]);



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

    // Compute card image URL + load status before any early return so hooks
    // are called in a stable order.
    const cardbackPath = getCardback(cardback).path;
    const styledCardUrl = card
        ? s3CardImageURL(
            { ...card, setId: card.clonedCardId ?? card.setId },
            locale,
            cardStyle,
            cardbackPath,
        )
        : '';
    const { status: cardImageStatus, imgProps: cardImgProps } = useImageLoadStatus(styledCardUrl);

    if (!card) {
        return null;
    }

    const notImplemented = (card: ICardData) => card?.hasOwnProperty('unimplemented') && card.unimplemented;

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

    const subcardClick = (event: React.MouseEvent, subCard: ICardData) => {
        if (subCard.selectable) {
            // Widgets can render on top of their parent card, which themselves are
            // clickable (like Shield). Without stopping propagation, a single click on a selectable
            // subcard widget also bubbles to the parent card's onClick and emits a second cardClicked
            // for the underlying unit. With Alliance Outpost that buffered second click
            // auto-applies the buff to the token whose shield was just defeated, for example.
            event.stopPropagation();
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
    const nonShieldUpgradeCards = subcards.filter((subcard) => subcard.name !== 'Shield');
    const promptType = getConnectedPlayerPrompt()?.promptType;
    const borderColor = getBorderColor({
        card,
        player:connectedPlayer,
        promptType,
        style: cardStyle,
        isOpponentEffect,
        isHoveredInChat
    });
    const cardCounter = card.count || 0;
    const distributionAmount = distributionPromptData?.valueDistribution.find((item: DistributionEntry) => item.uuid === card.uuid)?.amount || 0;
    const isIndirectDamage = getConnectedPlayerPrompt()?.distributeAmongTargets?.isIndirectDamage;
    const updatedCardId = card.clonedCardId ?? card.setId;
    const showSelectedGradient = card.selected && (phase === 'setup' || phase === 'regroup');
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
            transition: 'box-shadow 0.25s ease, transform 0.15s ease',
            '&:hover': {
                cursor: clickDisabled() ? 'normal' : 'pointer',
            },
        },
        card: {
            borderRadius: '0.5rem',
            position: 'relative',
            backgroundColor: 'black',
            aspectRatio: cardStyle === CardStyle.InPlay ? '1' : '1/1.4',
            width: '100%',
            border: isHiddenHandCard
                ? '1px solid rgb(32, 30, 30)'
                : borderColor
                    ? card.selected && card.zone !== 'hand'
                        ? `4px solid ${borderColor}`
                        : `2px solid ${borderColor}`
                    : '2px solid transparent',
            boxShadow: borderColor && card.selected && card.zone !== 'hand' ? `0 0 7px 3px ${borderColor}` : 'none',
            boxSizing: 'border-box',
        },
        cardImage: cardImageFillSx,
        selectedGradient: {
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            background: 'linear-gradient(rgba(255, 254, 80, 0.2), rgba(255, 254, 80, 0.6))',
            pointerEvents: 'none',
            zIndex: 1,
        },
        cardOverlay: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: getBackgroundColor(card),
            filter: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            WebkitTouchCallout: 'none',
            userSelect: 'none',
        },
        upgradeOverlay: {
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            filter: 'none',
            clickEvents: 'none',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            paddingRight: '4px',
        },
        numberFont: {
            fontSize: '1em',
            fontWeight: '700',
            textShadow: '0px 0px 3px black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            cursor: 'default',
            userSelect: 'none',
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
            '-webkit-touch-callout': 'none', /* Disables the long-press menu on iOS */
            '-webkit-user-select': 'none',   /* Prevents image selection */
            userSelect: 'none',
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
            '-webkit-touch-callout': 'none', /* Disables the long-press menu on iOS */
            '-webkit-user-select': 'none',   /* Prevents image selection */
            userSelect: 'none',
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
            userSelect: 'none',
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
        blankedShieldIcon:{
            width: '28%',
            aspectRatio: '1 / 1',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: `url(${s3TokenImageURL('shield-token-blanked')})`,
        },
        upgradeIcon:{
            position: 'relative',
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
            fontWeight: '800',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            color: 'black',
            userSelect: 'none',
            margin: 0,
            padding: 0,
            lineHeight: 1,
        },
        cloneIcon:{
            width: '100%',
            aspectRatio: '4.85',
            display: 'flex',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            backgroundColor: '#234a2a',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            borderRadius: '0.5rem',
            border: '2px solid #333',
            boxShadow: `
                inset 0 0 4px rgba(0, 200, 0, 0.6),
                inset 0 0 8px rgba(50, 220, 50, 0.5),
                inset 0 0 12px rgba(100, 240, 100, 0.4),
                inset 0 0 16px rgba(150, 255, 150, 0.3)
            `,
        },
        cloneName: {
            fontSize: 'clamp(4px, .65vw, 12px)',
            marginTop: '2px',
            fontWeight: '800',
            whiteSpace: 'nowrap',
            overflow: 'visible',
            color: '#d0f0d0',
            textAlign: 'center',
            userSelect: 'none',
            textShadow: `
                -1px -1px 0 #000,
                 0px -1px 0 #000,
                 1px -1px 0 #000,
                -1px  0px 0 #000,
                 1px  0px 0 #000,
                -1px  1px 0 #000,
                 0px  1px 0 #000,
                 1px  1px 0 #000
            `
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
        blankIcon:{
            position: 'absolute',
            width: cardStyle === CardStyle.InPlay ? '28%' : '35%',
            aspectRatio: '1 / 1',
            top: '32%',
            right: cardStyle === CardStyle.InPlay ? '-4%' : 'auto',
            left: cardStyle === CardStyle.InPlay ? 'auto' : '1%',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/BlankIcon.png)',
        },
        upgradeBlankIcon:{
            position: 'absolute',
            right: '4px',
            width: '18%',
            aspectRatio: '1 / 1',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/BlankIcon.png)',
        },
        cannotBeAttacked:{
            position: 'absolute',
            width: '28%',
            aspectRatio: '1 / 1',
            top:'-5%',
            left: '-4%',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/HiddenIcon.png)',
        },
        blockedFromPlayIcon:{
            position: 'absolute',
            width: '35%',
            aspectRatio: '1 / 1',
            // Move down when blank icon is also visible (both icons would be at top: 32% otherwise)
            top: card.isBlanked && cardStyle !== CardStyle.InPlay ? '60%' : '32%',
            left: '1%',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/LockIcon.png)',
            filter: 'drop-shadow(0 4px 4px 0 #00000080)',
            zIndex: 2,
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
            imageRendering: '-webkit-optimize-contrast',
            backfaceVisibility: 'hidden',
            aspectRatio,
            width,
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
            backgroundImage: card.selected && card.zone === 'hand' && promptType === 'resource' ? 'url(resource-icon.png)' : '',
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
        <Box sx={[styles.cardContainer, highlightSx]}>
            {cardStyle === CardStyle.InPlay && card.clonedCardId && (
                <Box
                    sx={styles.cloneIcon}
                    onMouseEnter={handlePreviewOpen}
                    onMouseLeave={handlePreviewClose}
                    data-card-url={s3CardImageURL({ ...card, setId: updatedCardId }, locale)}
                    data-card-type="clone"
                    data-card-id={card.setId.set + '_' + card.setId.number}
                >
                    <Typography sx={styles.cloneName}>Clone</Typography>
                </Box>
            )}

            <Box
                sx={styles.card}
                onClick={handleClick}
            >
                <Box
                    component="img"
                    src={styledCardUrl}
                    alt=""
                    draggable={false}
                    {...cardImgProps}
                    sx={styles.cardImage}
                />
                {showSelectedGradient && <Box sx={styles.selectedGradient} />}
                {cardImageStatus === 'error' && (
                    <CardImageMissingOverlay label={cardImageLabel({ ...card, setId: updatedCardId }, locale)} />
                )}
                <Box
                    sx={styles.cardOverlay}
                    onMouseEnter={handlePreviewOpen}
                    onMouseLeave={handlePreviewClose}
                    {...longPressHandlers}
                    data-card-url={s3CardImageURL({ ...card, setId: updatedCardId }, locale)}
                    data-card-type={card.printedType}
                    data-card-id={card.setId? card.setId.set+'_'+card.setId.number : card.id}
                >
                    <Box sx={styles.unimplementedAlert}></Box>
                    <Box sx={styles.resourceIcon}/>
                    { !!distributionAmount && (
                        <DamageCounterToken value={distributionAmount} variant={distributeHealing ? 'distributeHealing' : 'distributeDamage'} />
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
                {card.cannotBeAttacked && (
                    <Box sx={styles.cannotBeAttacked}/>
                )}
                {isBlockedFromPlay && (
                    <Tooltip title={card.blockedFromPlayReason || 'Cannot play this card'} arrow>
                        <Box sx={styles.blockedFromPlayIcon}/>
                    </Tooltip>
                )}
                {card.isBlanked && (
                    <Box sx={styles.blankIcon}/>
                )}
                {cardStyle === CardStyle.InPlay && (
                    <>
                        { showValueAdjuster() && (
                            <CardValueAdjuster 
                                card={card} 
                                isIndirect={isIndirectDamage}
                            /> 
                        )}
                        <Grid direction="row" container sx={styles.shieldContainer}>
                            {shieldCards.map((shieldCard, index) => (
                                <Box
                                    key={`${card.uuid}-shield-${index}`}
                                    sx={{
                                        ...(shieldCard.isBlanked ? styles.blankedShieldIcon : styles.shieldIcon),
                                        border: shieldCard.selectable ? `2px solid ${getBorderColor({ card: shieldCard, player: connectedPlayer })}` : 'none',
                                        cursor: shieldCard.selectable ? 'pointer' : 'normal'
                                    }}
                                    onClick={(e) => subcardClick(e, shieldCard)}
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
                {...popoverConfig}
            >
                <Box sx={{ ...styles.cardPreview, backgroundImage: previewImage }} />
                {isPreviewingLeaderCard && !isTouchDevice && !isFlipped && (
                    <Typography variant={'body1'} sx={styles.ctrlText}
                    >CTRL: View Flipside</Typography>
                )}
            </Popover>

            {nonShieldUpgradeCards.map((subcard) => (
                <Box
                    key={subcard.uuid}
                    sx={{ ...styles.upgradeIcon,
                        backgroundImage: `url(${(cardUpgradebackground(subcard))})`,
                        border: subcard.selectable ? `2px solid ${getBorderColor({ card: subcard, player: connectedPlayer })}` : 'none',
                        cursor: subcard.selectable ? 'pointer' : 'normal'
                    }}
                    onClick={(e) => subcardClick(e, subcard)}
                    onMouseEnter={handlePreviewOpen}
                    onMouseLeave={handlePreviewClose}
                    {...longPressHandlers}
                    data-card-url={s3CardImageURL(
                        { ...subcard, setId: subcard.clonedCardId ?? subcard.setId },
                        locale,
                        CardStyle.Plain,
                        cardbackPath)
                    }
                    data-card-type={subcard.printedType}
                    data-card-id={subcard.setId? subcard.setId.set+'_'+subcard.setId.number : subcard.id}
                >
                    <Box sx={styles.upgradeOverlay}>
                        <Typography key={subcard.uuid} sx={styles.upgradeName}>
                            {subcard.clonedCardName ?? subcard.name}
                        </Typography>

                        {subcard.isBlanked && (
                            <Box sx={styles.upgradeBlankIcon}/>
                        )}
                    </Box>
                </Box>
            ))}

            {capturedCards.length > 0 && (
                <>
                    <Typography sx={styles.capturedCardsDivider}>
                        Captured
                    </Typography>
                    {capturedCards.map((capturedCard: ICardData) => {
                        return (
                            <Box
                                key={`captured-${capturedCard.uuid}`}
                                sx={{
                                    ...styles.upgradeIcon,
                                    backgroundImage: `url(${cardUpgradebackground(capturedCard)})`,
                                    border: capturedCard.selectable ? `2px solid ${getBorderColor({ card:capturedCard, player:connectedPlayer })}` : 'none',
                                    cursor: capturedCard.selectable ? 'pointer' : 'normal'
                                }}
                                onClick={(e) => subcardClick(e, capturedCard)}
                                onMouseEnter={handlePreviewOpen}
                                onMouseLeave={handlePreviewClose}
                                {...longPressHandlers}
                                data-card-url={s3CardImageURL(
                                    { ...capturedCard, setId: capturedCard.clonedCardId ?? capturedCard.setId },
                                    locale,
                                    CardStyle.Plain,
                                    cardbackPath)
                                }
                                data-card-type={capturedCard.printedType}
                                data-card-id={capturedCard.setId? capturedCard.setId.set+'_'+capturedCard.setId.number : capturedCard.id}
                            >
                                <Typography sx={styles.upgradeName}>
                                    {capturedCard.clonedCardName ?? capturedCard.name}
                                </Typography>
                            </Box>
                        );
                    })}
                </>
            )}
        </Box>
    );
};

export default GameCard;
