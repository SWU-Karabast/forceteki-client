import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { CardStyle, ICardData, IGameCardProps } from './CardTypes';
import CardValueAdjuster from './CardValueAdjuster';
import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';
import { PopupSource, type SelectCardsPopup } from '../Popup/Popup.types';
import { cardImageLabel, s3CardImageURL } from '@/app/_utils/s3Utils';
import { useCardImageLocale } from '@/app/_contexts/CardImageLocale.context';
import { blockedFromPlay, cannotBeAttacked, getBorderColor, getUpgradeStripBg, hasSentinel, isBlanked, isStolen } from './cardUtils';
import { usePreviewCardPopover, usePopoverConfig } from './GameCard/cardHooks';
import { useImageLoadStatus } from '@/app/_hooks/useImageLoadStatus';
import { CardImageMissingOverlay, cardImageFillSx } from './CardImageMissingOverlay';
import { DistributionEntry } from '@/app/_hooks/useDistributionPrompt';
import { useOngoingEffectHighlightSx } from '@/app/_contexts/OngoingEffectHighlight.context';

import { DamageCounterToken } from '../_styledcomponents/damageCounterToken';
import { TokenBadge, type TokenBadgeType } from './GameCard/TokenBadge';
import { TokenBadgeStack } from './GameCard/TokenBadgeStack';
import StatusIcon from '@/app/_components/_sharedcomponents/Cards/GameCard/StatusIcon';
import { HealthBadge, PowerBadge } from './GameCard/StatBadge';
import UpgradeStrip from './UpgradeStrip';

// Maps a unit's selectable/selected upgrade subcards into cards for the select popup.
const buildUpgradeSelectCards = (subcards: ICardData[]): ICardData[] =>
    subcards
        .filter((s) => s.selectable || s.selected)
        .map((u) => ({
            ...u,
            selectionState: u.selected ? 'selected' : u.selectable ? 'selectable' : 'unselectable',
        }));

// Popup payload for selecting a unit's upgrades. Clicks toggle via 'cardClicked' (board
// SelectCardPrompt); the Close button only dismisses the popup, since confirmation happens
// on the board's own prompt Done.
const upgradeSelectPopupData = (
    unitUuid: string,
    unitName: string | undefined,
    subcards: ICardData[],
): Omit<SelectCardsPopup, 'type'> => ({
    uuid: unitUuid,
    title: unitName ?? 'Select upgrades',
    cards: buildUpgradeSelectCards(subcards),
    perCardButtons: [],
    buttons: [],
    source: PopupSource.User,
    clickMode: 'cardClicked',
    localCloseButton: true,
});

// Neutral token upgrades are consolidated into count badges on the right edge of the card,
// in this order; every other upgrade renders as a bar below the card. A subcard is matched
// to a badge by name, which is also how it is kept out of the bars.
const TOKEN_BADGES: readonly { name: string; type: TokenBadgeType }[] = [
    { name: 'Shield', type: 'shield' },
    { name: 'Experience', type: 'experience' },
    { name: 'Weakness', type: 'weakness' },
    { name: 'Advantage', type: 'advantage' },
];

const TOKEN_BADGE_NAMES = TOKEN_BADGES.map((badge) => badge.name);

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
    const { clearPopups, openPopup, closePopup, popups } = usePopup();
    const highlightSx = useOngoingEffectHighlightSx(card?.uuid);

    const locale = useCardImageLocale();

    const distributeHealing = gameState?.players[connectedPlayer]?.promptState.distributeAmongTargets?.type === 'distributeHealing';
    const isOpponentEffect = gameState?.players[connectedPlayer]?.promptState.isOpponentEffect;
    const phase = gameState?.phase;
    const activePlayer = gameState?.players?.[connectedPlayer]?.isActionPhaseActivePlayer;

    const cardInOpponentsHand = card.controllerId !== connectedPlayer && card.zone === 'hand';
    const isHiddenHandCard = overlapEnabled && (cardInOpponentsHand || (isSpectator && card.zone === 'hand'));
    const popoverConfig = usePopoverConfig(card);
    const isHoveredInChat = hoveredChatCard.id === card.uuid;
    const {
        getCardPreviewProps,
        popover,
        closePreview
    } = usePreviewCardPopover(cardInOpponentsHand, popoverConfig);

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
    const cardbackPath = cardback;
    const styledCardUrl = card
        ? s3CardImageURL(
            { ...card, setId: card.clonedCardId ?? card.setId },
            locale,
            cardStyle,
            cardbackPath,
        )
        : '';
    const { status: cardImageStatus, imgProps: cardImgProps } = useImageLoadStatus(styledCardUrl);

    // Multi-select upgrade popup: keep it in sync with live board state and auto-close it when the
    // prompt ends or nothing stays selectable. Declared before the early return so hook order stays stable.
    const multiSelectActive = getConnectedPlayerPrompt()?.selectCardMode === 'multiple';
    const hasSelectableUpgrades = subcards.some((s) => s.selectable);
    const upgradeUnitUuid = card?.uuid;
    const upgradePopupOpen = popups.some((p) => p.uuid === upgradeUnitUuid);
    // Signature of the live selection so the open popup is re-fed only on real changes (no loop).
    const liveUpgradeSignature = subcards
        .filter((s) => s.selectable || s.selected)
        .map((u) => `${u.uuid}:${u.selected ? 's' : u.selectable ? 'a' : 'u'}`)
        .join(',');
    React.useEffect(() => {
        if (!upgradePopupOpen || !upgradeUnitUuid) {
            return;
        }
        if (!multiSelectActive || !hasSelectableUpgrades) {
            closePopup(upgradeUnitUuid);
            return;
        }
        openPopup('select', upgradeSelectPopupData(upgradeUnitUuid, card?.name, subcards));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [upgradePopupOpen, upgradeUnitUuid, multiSelectActive, hasSelectableUpgrades, liveUpgradeSignature]);

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
            closePreview();
            sendGameMessage(['cardClicked', subCard.uuid]);
        }
    }

    const nonShieldUpgradeCards = subcards.filter((subcard) => !TOKEN_BADGE_NAMES.includes(subcard.name ?? ''));

    const tokenBadges = TOKEN_BADGES
        .map(({ name, type }) => {
            const tokens = subcards.filter((subcard) => subcard.name === name);
            return {
                type,
                count: tokens.length,
                token: tokens[0],
                selectableToken: tokens.find((subcard) => subcard.selectable),
            };
        })
        .filter((badge) => badge.count > 0);

    // On a multi-select prompt (e.g. Power Failure), clicking a token badge opens a popup to
    // select any number of this unit's upgrades individually. On single-select prompts, badges
    // keep the inline behavior (select the first selectable token of that type). The popup itself
    // is kept live and auto-closed by an effect above the early return.
    const upgradesClickable = multiSelectActive && hasSelectableUpgrades;
    const openUpgradeSelectPopup = () => openPopup('select', upgradeSelectPopupData(card.uuid, card.name, subcards));
    const badgeClick = (e: React.MouseEvent, selectableToken?: ICardData) => {
        if (upgradesClickable) {
            e.stopPropagation();
            openUpgradeSelectPopup();
        } else if (selectableToken) {
            subcardClick(e, selectableToken);
        }
    };
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
            userSelect: 'none',
            '-webkit-touch-callout': 'none', /* Disables the long-press menu on iOS */
            '-webkit-user-select': 'none',   /* Prevents image selection */
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
        statBadge: {
            fontSize: 'clamp(0.5rem, 1.8vw, 2rem)',
            position: 'absolute',
            width: '28%',
            bottom: '-6%',
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
        tokenBadgeContainer: {
            position: 'absolute',
            top: '-5%',
            right: '-4%',
            fontSize: 'clamp(0.44rem, 1.1vw, 0.96rem)',
            zIndex: 2,
        },
        upgradeIcon: {
            position: 'relative',
            width: '100%',
            boxSizing: 'border-box',
        },
        upgradeName: {
            fontSize: 'clamp(4px, .65vw, 12px)',
            fontWeight: '600',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            color: 'black',
            textAlign: 'center',
            userSelect: 'none',
            margin: 0,
            padding: 0,
            lineHeight: 'normal',
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
        statusIconContainer: {
            position: 'absolute',
            bottom: cardStyle === CardStyle.InPlay ? '33%' : '50%',
            left: '-4%',
            width: cardStyle === CardStyle.InPlay ? '28%' : '35%',
            display: 'flex',
            flexDirection: 'column-reverse',
            alignItems: 'flex-start',
            fontSize: 'clamp(0.44rem, 1.1vw, 0.96rem)',
            rowGap: '0.2em',
            pointerEvents: 'none',
            zIndex: 2,
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
        unimplementedAlert: {
            display: notImplemented(card) ? 'flex' : 'none',
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
    }
    return (
        <Box sx={[styles.cardContainer, highlightSx]}>
            {cardStyle === CardStyle.InPlay && card.clonedCardId && (
                <Box
                    sx={styles.cloneIcon}
                    {...getCardPreviewProps({
                        cardUrl: s3CardImageURL({ ...card, setId: updatedCardId }, locale),
                        cardType: 'clone',
                        cardId: card.setId.set + '_' + card.setId.number
                    })}
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
                    {...getCardPreviewProps({
                        cardUrl: s3CardImageURL({ ...card, setId: updatedCardId }, locale),
                        cardType: card.printedType,
                        cardId: card.setId? card.setId.set+'_'+card.setId.number : card.id
                    })}
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
                <Box sx={styles.statusIconContainer}>
                    {cannotBeAttacked(card, cardStyle) && <StatusIcon type="hidden" />}
                    {hasSentinel(card, cardStyle) && <StatusIcon type="sentinel" />}
                    {isBlanked(card, cardStyle) && <StatusIcon type="blank" />}
                    {blockedFromPlay(card, cardStyle) && (
                        <Tooltip title={card.blockedFromPlayReason || 'Cannot play this card'} arrow>
                            <StatusIcon type="lock" />
                        </Tooltip>
                    )}
                    {isStolen(card, cardStyle) && <StatusIcon type="stolen" />}
                </Box>
                {cardStyle === CardStyle.InPlay && (
                    <>
                        { showValueAdjuster() && (
                            <CardValueAdjuster 
                                card={card} 
                                isIndirect={isIndirectDamage}
                            /> 
                        )}
                        <TokenBadgeStack sx={styles.tokenBadgeContainer}>
                            {tokenBadges.map(({ type, count, token, selectableToken }) => {
                                const clickable = !!selectableToken || upgradesClickable;
                                return (
                                    <TokenBadge
                                        key={type}
                                        type={type}
                                        count={count}
                                        stroke={selectableToken ? getBorderColor({ card: selectableToken, player: connectedPlayer }) : undefined}
                                        {...getCardPreviewProps({
                                            cardUrl: s3CardImageURL(token, locale, CardStyle.Plain, cardbackPath),
                                            cardType: token.printedType,
                                        })}
                                        onClick={clickable ? (e) => badgeClick(e, selectableToken) : undefined}
                                    />
                                );
                            })}
                        </TokenBadgeStack>

                        <PowerBadge sx={[styles.statBadge, { left: '-4%' } ]} value={card.power || 0} />
                        {Number(card.damage) > 0 && (
                            <Box sx={styles.damageIcon}>
                                <Typography sx={styles.damageNumber}>
                                    {card.damage}
                                </Typography>
                            </Box>
                        )}
                        <HealthBadge sx={[styles.statBadge, { right: '-4%' } ]} value={card.hp || 0} />
                    </>
                )}
            </Box>

            {card.isAttacker && <Box sx={styles.attackIcon}/>}
            {card.isDefender && <Box sx={styles.defendIcon}/>}

            {popover}

            {nonShieldUpgradeCards.map((subcard) => (
                <UpgradeStrip
                    key={subcard.uuid}
                    aspect={getUpgradeStripBg(subcard)}
                    reversed={card.controllerId === connectedPlayer}
                    sx={{ ...styles.upgradeIcon,
                        border: subcard.selectable ? `1.5px solid ${getBorderColor({ card: subcard, player: connectedPlayer })}` : 'none',
                        cursor: subcard.selectable ? 'pointer' : 'default'
                    }}
                    onClick={(e) => subcardClick(e, subcard)}
                    {...getCardPreviewProps({
                        cardUrl: s3CardImageURL(
                            { ...subcard, setId: subcard.clonedCardId ?? subcard.setId },
                            locale,
                            CardStyle.Plain,
                            cardbackPath),
                        cardType: subcard.printedType,
                        cardId: subcard.setId? subcard.setId.set+'_'+subcard.setId.number : subcard.id
                    })}
                >
                    <Typography sx={styles.upgradeName}>
                        {subcard.clonedCardName ?? subcard.name}
                    </Typography>

                    {subcard.isBlanked && (
                        <Box sx={styles.upgradeBlankIcon}/>
                    )}
                </UpgradeStrip>
            ))}

            {capturedCards.length > 0 && (
                <>
                    <Typography sx={styles.capturedCardsDivider}>
                        Captured
                    </Typography>
                    {capturedCards.map((capturedCard: ICardData) => {
                        return (
                            <UpgradeStrip
                                key={`captured-${capturedCard.uuid}`}
                                aspect={getUpgradeStripBg(capturedCard)}
                                reversed={card.controllerId === connectedPlayer}
                                sx={{
                                    ...styles.upgradeIcon,
                                    border: capturedCard.selectable ? `1.5px solid ${getBorderColor({ card: capturedCard, player: connectedPlayer })}` : 'none',
                                    cursor: capturedCard.selectable ? 'pointer' : 'default'
                                }}
                                onClick={(e) => subcardClick(e, capturedCard)}
                                {...getCardPreviewProps({
                                    cardUrl: s3CardImageURL(
                                        { ...capturedCard, setId: capturedCard.clonedCardId ?? capturedCard.setId },
                                        locale,
                                        CardStyle.Plain,
                                        cardbackPath),
                                    cardType: capturedCard.printedType,
                                    cardId: capturedCard.setId? capturedCard.setId.set+'_'+capturedCard.setId.number : capturedCard.id
                                })}
                            >
                                <Typography sx={styles.upgradeName}>
                                    {capturedCard.clonedCardName ?? capturedCard.name}
                                </Typography>
                            </UpgradeStrip>
                        );
                    })}
                </>
            )}
        </Box>
    );
};

export default GameCard;
