import React from 'react';
import { Box, Typography, useMediaQuery } from '@mui/material';
import { ICardData, ILeaderBaseCardProps, LeaderBaseCardStyle } from './CardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { cardImageLabel, s3CardImageURL, s3TokenImageURL } from '@/app/_utils/s3Utils';
import { useCardImageLocale } from '@/app/_contexts/CardImageLocale.context';
import { getBorderColor } from './cardUtils';
import { useImageLoadStatus } from '@/app/_hooks/useImageLoadStatus';
import { CardImageMissingOverlay, cardImageFillSx } from './CardImageMissingOverlay';
import CardValueAdjuster from './CardValueAdjuster';
import { DistributionEntry } from '@/app/_hooks/useDistributionPrompt';
import { DamageCounterToken } from '@/app/_components/_sharedcomponents/_styledcomponents/damageCounterToken';
import { useOngoingEffectHighlightSx } from '@/app/_contexts/OngoingEffectHighlight.context';
import UpgradeStrip, { UpgradeAspect } from '@/app/_components/_sharedcomponents/Cards/UpgradeStrip';
import { PopoverConfig, usePreviewCardPopover } from '@/app/_components/_sharedcomponents/Cards/GameCard/cardHooks';

const LeaderBaseCard: React.FC<ILeaderBaseCardProps> = ({
    card,
    title,
    cardStyle = LeaderBaseCardStyle.Plain,
    capturedCards = [],
    upgrades = [],
    disabled = false,
    isLeader = false,
}) => {
    const { sendGameMessage, connectedPlayer, getConnectedPlayerPrompt, distributionPromptData, gameState, hoveredChatCard } = useGame();
    const locale = useCardImageLocale();
    const highlightSx = useOngoingEffectHighlightSx(card?.uuid);
    const isMobilePortrait = useMediaQuery('(orientation: portrait) and (max-width:932px)');
    const isConnectedPlayer = !!card && card.controllerId === connectedPlayer;
    const popoverConfig: PopoverConfig = isMobilePortrait ? {
        anchorOrigin: {
            vertical: isConnectedPlayer ? -5 : 'bottom',
            horizontal: 'center',
        },
        transformOrigin: {
            vertical: isConnectedPlayer ? 'bottom' : -5,
            horizontal: 'center',
        }
    } : {
        anchorOrigin: {
            vertical: 'center',
            horizontal: -5,
        },
        transformOrigin: {
            vertical: 'center',
            horizontal: 'right',
        }
    };
    const {
        getCardPreviewProps,
        popover,
        closePreview,
        open: previewOpen
    } = usePreviewCardPopover(false, popoverConfig);
    const isHoveredInChat = hoveredChatCard.id === card?.uuid;

    // Compute card image URL + load status before any early return so hooks
    // are called in a stable order.
    const mainCardImageUrl = card ? s3CardImageURL(card, locale, cardStyle) : '';
    const { status: mainCardImageStatus, imgProps: mainCardImgProps } = useImageLoadStatus(mainCardImageUrl);

    if (!card) {
        return null
    }

    const controller = gameState?.players[card.controllerId];
    const controllerHasForceToken = controller?.forceToken.active || false;
    const forceTokenUuid = controller?.forceToken.uuid;
    const forceTokenSelectable = controller?.forceToken.selectionState?.selectable || false;

    const defaultClickFunction = () => {
        if (card.selectable) {
            sendGameMessage(['cardClicked', card.uuid]);
        }
    };

    const clickDisabled = () => {
        return showValueAdjuster() ||
            disabled ||
            card.selectable === false ||
            isDeployed;
    }

    const handleClick = () => {
        if (clickDisabled()) {
            return;
        }
        defaultClickFunction();
    }

    const handleForceTokenClick = () => {
        if (forceTokenSelectable) {
            sendGameMessage(['cardClicked', forceTokenUuid]);
        }
    }

    const notImplemented = (card: ICardData) => card?.hasOwnProperty('unimplemented') && card.unimplemented;

    const getBackgroundColor = (card: ICardData) => {
        if (
            (notImplemented(card) || card.exhausted) && !isDeployed
        ) {
            return 'rgba(0, 0, 0, 0.5)';
        }

        return 'transparent';
    }

    const showValueAdjuster = () => {
        const prompt = getConnectedPlayerPrompt();

        // Ensure prompt is valid and conditions are met
        if (!prompt || prompt.promptType !== 'distributeAmongTargets' || !card.selectable || !distributionPromptData || isDeployed) {
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

    const isDeployed = card.hasOwnProperty('zone') && card.zone !== 'base';
    const borderColor = getBorderColor({
        card,
        player: connectedPlayer,
        promptType: getConnectedPlayerPrompt()?.promptType,
        isHoveredInChat
    });
    const distributionAmount = distributionPromptData?.valueDistribution.find((item: DistributionEntry) => item.uuid === card.uuid)?.amount || 0;
    const distributeHealing = gameState?.players[connectedPlayer]?.promptState.distributeAmongTargets?.type === 'distributeHealing';
    const activePlayer = gameState?.players?.[connectedPlayer]?.isActionPhaseActivePlayer;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getForceTokenIconStyle = (player: any, isSelectable: boolean = false) => {
        const imageAspect = player.aspects.includes('villainy') ? 'Villainy' : 'Heroism';
        const opponentStr = player.id !== connectedPlayer ? 'Opponent' : '';
        const backgroundImage = `url(/ForceToken${imageAspect}${opponentStr}.png)`;

        return {
            position: 'absolute',
            width: 'clamp(1.5rem, 30%, 2.5rem)',
            aspectRatio: '1 / 1',
            top:'32%',
            right: '-13%',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage,
            filter: 'drop-shadow(1px 2px 1px rgba(0, 0, 0, 0.40))',
            zIndex: 2,
            cursor: isSelectable ? 'pointer' : 'default',
            border: isSelectable ? '2px solid var(--selection-green)' : 'none',
            borderRadius: isSelectable ? '4px' : 'none',
            backgroundColor: isSelectable ? 'rgba(114, 249, 121, 0.08)' : 'transparent',
            transition: 'border-color 0.3s ease, background-color 0.3s ease',
        };
    }

    const getUpgradeStripBg = (card: ICardData):UpgradeAspect => {
        if (!card.aspects){
            return 'neutral';
        }
        if (card.aspects.includes('villainy') && card.aspects.length === 1) {
            return 'villainy';
        }
        if (card.aspects.includes('heroism') && card.aspects.length === 1) {
            return 'heroism';
        }
        switch (true) {
            case card.aspects.includes('aggression'):
                return 'aggression';
            case card.aspects.includes('command'):
                return 'command';
            case card.aspects.includes('cunning'):
                return 'cunning';
            case card.aspects.includes('vigilance'):
                return 'vigilance';
            default:
                return 'neutral';
        }
    };

    const subcardClick = (subCard: ICardData) => {
        if (subCard.selectable) {
            closePreview();
            sendGameMessage(['cardClicked', subCard.uuid]);
        }
    }

    const styles = {
        card: {
            flex: 1,
            backgroundColor: 'black',
            borderRadius: '0.5rem',
            width: '100%',
            aspectRatio: '1.39',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'box-shadow 0.25s ease',
            cursor: clickDisabled() ? 'default' : 'pointer',
            position: 'relative',
            border: borderColor ? `2px solid ${borderColor}` : '2px solid transparent',
            boxSizing: 'border-box',
            userSelect: 'none',
            '-webkit-touch-callout': 'none', /* Disables the long-press menu on iOS */
            '-webkit-user-select': 'none',   /* Prevents image selection */
        },
        deployedPlaceholder: {
            flex: 1,
            backgroundColor: 'transparent',
            borderRadius: '0.5rem',
            width: '100%',
            maxHeight: '100%',
            aspectRatio: '1.39',
            cursor: 'default',
            position: 'relative',
            border: '2px solid #FFFFFF55',
        },
        cardOverlay : {
            position: 'absolute',
            height: '100%',
            width: '100%',
            backgroundColor: getBackgroundColor(card),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        epicActionIcon : {
            position: 'absolute',
            width: '1.8rem',
            aspectRatio: '1 / 1',
            top:'-4px',
            right: '-4px',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: `url(${s3TokenImageURL('epic-action-token')})`,
            display: card.epicActionSpent || card.epicDeployActionSpent && !isDeployed ? 'block' : 'none',
            zIndex: 1
        },
        leaderBlankIcon : {
            position: 'absolute',
            width: '1.8rem',
            aspectRatio: '1 / 1',
            top:'32%',
            right: '-4px',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/BlankIcon.png)',
            display: card.isBlanked && !isDeployed ? 'block' : 'none'
        },
        baseBlankIcon : {
            position: 'absolute',
            width: '2.5rem',
            aspectRatio: '1 / 1',
            top:'0%',
            right: '-4px',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage: 'url(/BlankIcon.png)',
            display: card.isBlanked ? 'block' : 'none'
        },
        damageCounterContainer: {
            position: 'absolute',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            pointerEvents: 'none',
        },
        nameplateBox: {
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            borderRadius: '0.5rem',
            p: { xs: '2px 5px', md: '5px 10px' },
            maxWidth: { xs: '100%', md: 'none' },
            backgroundColor: 'black',
        },
        unimplementedAlert: {
            display: notImplemented(card) && !isDeployed ? 'flex' : 'none',
            backgroundImage: 'url(/not-implemented.svg)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            aspectRatio: '1/1',
            width: '50%'
        },
        nameplateText: {
            color: 'white',
            fontWeight: '600',
            fontSize: '1em',
            textOverflow: 'ellipsis',
            textWrap: 'nowrap',
            overflow: { xs: 'hidden', md: 'visible' },
        },
        mobileFlipButton: {
            position: 'absolute',
            top: '0.35rem',
            right: '0.35rem',
            zIndex: 2,
            width: '3.25rem',
            height: '3.25rem',
            color: 'white',
            backgroundColor: 'rgba(3, 12, 19, 0.72)',
            border: '1px solid rgba(255, 255, 255, 0.38)',
            borderRadius: '999px',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.55)',
            transition: 'opacity 140ms ease, background-color 140ms ease',
            '&:hover': {
                backgroundColor: 'rgba(3, 12, 19, 0.9)',
            },
        },
        defendIcon: {
            position: 'absolute',
            backgroundImage:  'url(/defending.svg)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            width: '60%',
            height: '10%',
            top: !activePlayer ? '-11%' : '',
            bottom: activePlayer ? '-11%' : '',
            left: '50%',
            transform: !activePlayer ? 'translate(-50%, 0) rotate(180deg)' : 'translate(-50%, 0)',
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
        capturedCardsDivider:{
            top: '-40%',
            textAlign: 'center',
            color: 'white',
            width: '100%',
            backgroundColor:'black',
            zIndex: 2,
            fontSize: 'clamp(4px, .65vw, 12px)'
        },
        capturedCardIcon:{
            width: '100%',
            display: 'flex',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'content-box',
            position: 'relative',
        },
        capturedCardName: {
            lineHeight: 'normal',
            fontSize: 'clamp(4px, .65vw, 12px)',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            color: 'black',
            textAlign: 'center',
        },
    };

    const capturedCardsDecoration = (
        <Box sx={{ flex: 1, position: 'relative' }}>
            {capturedCards.map((capturedCard: ICardData) => (
                <Box
                    key={`captured-${capturedCard.uuid}`}
                    sx={{
                        ...styles.capturedCardIcon,
                        cursor: capturedCard.selectable ? 'pointer' : 'default',
                    }}
                    {...getCardPreviewProps({
                        cardUrl: s3CardImageURL({ ...capturedCard, setId: capturedCard.setId }, locale),
                        cardType:capturedCard.printedType,
                        cardId: capturedCard.setId ? capturedCard.setId.set + '_' + capturedCard.setId.number : capturedCard.id
                    })}
                >
                    <UpgradeStrip
                        aspect={getUpgradeStripBg(capturedCard)}
                        reversed={isConnectedPlayer}
                        sx={{
                            border: capturedCard.selectable ? `1.5px solid ${getBorderColor({ card: capturedCard, player: connectedPlayer })}` : 'none',
                        }}>
                        <Typography sx={styles.capturedCardName}>
                            {capturedCard.name}
                        </Typography>
                    </UpgradeStrip>
                </Box>
            ))}
        </Box>
    )

    // Base upgrades (via the Fortify keyword) render as aspect-colored strips tucked against the base,
    // mirroring the captured-cards decoration above.
    const upgradesDecoration = (
        <Box sx={{ flex: 1, position: 'relative' }}>
            {upgrades.map((upgrade: ICardData) => (
                <Box
                    key={`base-upgrade-${upgrade.uuid}`}
                    sx={{
                        ...styles.capturedCardIcon,
                        cursor: upgrade.selectable ? 'pointer' : 'default',
                    }}
                    onClick={() => subcardClick(upgrade)}
                    {...getCardPreviewProps({
                        cardUrl: s3CardImageURL({ ...upgrade, setId: upgrade.setId }, locale),
                        cardType: upgrade.printedType,
                        cardId: upgrade.setId ? upgrade.setId.set + '_' + upgrade.setId.number : upgrade.id
                    })}
                >
                    <UpgradeStrip
                        aspect={getUpgradeStripBg(upgrade)}
                        reversed={isConnectedPlayer}
                        sx={{
                            border: upgrade.selectable ? `1.5px solid ${getBorderColor({ card: upgrade, player: connectedPlayer })}` : 'none',
                        }}>
                        <Typography sx={styles.capturedCardName}>
                            {upgrade.name}
                        </Typography>
                    </UpgradeStrip>
                </Box>
            ))}
        </Box>
    )
    return (
        <Box sx={{ position: 'relative', width: '100%', display: 'flex', flexDirection: isConnectedPlayer ? 'column' : 'column-reverse' }}>
            <Box sx={{
                position: 'relative',
                flex: 1,
                // zIndex must be higher than prompt text, upgrades must remain interactive so they must be on top
                zIndex: 2,
                mb: '',
            }}>
                <Box 
                    sx={{
                        display: 'flex',
                        flexDirection: !isConnectedPlayer ? 'column' : 'column-reverse',
                        mb: !isConnectedPlayer ? '0px' : '-5px',
                        mt: !isConnectedPlayer ? '-5px' : '0px',

                        backgroundColor: 'black',
                        p: !isConnectedPlayer ? '0 0 1px' : '1px 0 0',
                        borderRadius: !isConnectedPlayer ? '0 0 4px 4px' : '4px 4px 0 0',

                    }}>
                    {upgrades.length > 0 && upgradesDecoration}
                    {capturedCards.length > 0 && (
                        <Box sx={{ position: 'relative' }}>
                            <Typography sx={styles.capturedCardsDivider}>
                                Captured
                            </Typography>
                        </Box>
                    )}
                    {capturedCards.length > 0 && capturedCardsDecoration}
                </Box>
            </Box>

            <Box
                sx={isDeployed ? styles.deployedPlaceholder : [styles.card, highlightSx]}
                onClick={handleClick}
                aria-owns={previewOpen ? 'mouse-over-popover' : undefined}
                aria-haspopup="true"
                {...getCardPreviewProps({
                    cardUrl: s3CardImageURL(card, locale),
                    cardType: isLeader ? 'leader' : 'base',
                    cardId: card.setId ? `${card.setId.set}_${card.setId.number.toString().padStart(3, '0')}` : card.id,
                    cardSide: card.onStartingSide ? '0' : '1',
                    cardNotDeployed: !isDeployed,
                })}
            >
                {!isDeployed && (
                    <Box
                        component="img"
                        src={mainCardImageUrl}
                        alt=""
                        draggable={false}
                        {...mainCardImgProps}
                        sx={cardImageFillSx}
                    />
                )}
                {mainCardImageStatus === 'error' && !isDeployed && (
                    <CardImageMissingOverlay label={cardImageLabel(card, locale)} />
                )}
                <Box sx={styles.cardOverlay}>
                    <Box sx={styles.unimplementedAlert}></Box>
                </Box>
                <Box sx={styles.epicActionIcon}></Box>

                {cardStyle === LeaderBaseCardStyle.Base && (
                    <>
                        <Box sx={styles.damageCounterContainer}>
                            { !!distributionAmount &&(
                                <DamageCounterToken value={distributionAmount} variant={distributeHealing ? 'distributeHealing' : 'distributeDamage'} />
                            )}
                            <DamageCounterToken value={card.damage || 0} />
                        </Box>
                        {
                            controllerHasForceToken &&
                            <Box
                                sx={getForceTokenIconStyle(controller, forceTokenSelectable)}
                                onClick={handleForceTokenClick}
                            />
                        }
                        {card.isDefender && <Box sx={styles.defendIcon}/>}
                        <Box sx={styles.baseBlankIcon}/>
                    </>
                )}
                {popover}

                {cardStyle === LeaderBaseCardStyle.Leader && title && (
                    <>
                        <Box sx={styles.nameplateBox}>
                            <Typography variant="body2" sx={styles.nameplateText}>
                                {title}
                            </Typography>
                        </Box>
                        <Box sx={styles.epicActionIcon}></Box>
                        <Box sx={styles.leaderBlankIcon}/>
                    </>
                )}
                { showValueAdjuster() && <CardValueAdjuster card={card} /> }
            </Box>
        </Box>
    );
};

export default LeaderBaseCard;
