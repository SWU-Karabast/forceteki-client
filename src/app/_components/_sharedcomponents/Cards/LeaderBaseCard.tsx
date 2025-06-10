import React from 'react';
import { Box, Popover, Typography } from '@mui/material';
import { CardStyle, ICardData, ILeaderBaseCardProps, LeaderBaseCardStyle } from './CardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { s3CardImageURL, s3TokenImageURL } from '@/app/_utils/s3Utils';
import { getBorderColor } from './cardUtils';
import CardValueAdjuster from './CardValueAdjuster';
import { useLeaderCardFlipPreview } from '@/app/_hooks/useLeaderPreviewFlip';
import { DistributionEntry } from '@/app/_hooks/useDistributionPrompt';

const LeaderBaseCard: React.FC<ILeaderBaseCardProps> = ({
    card,
    title,
    cardStyle = LeaderBaseCardStyle.Plain,
    disabled = false,
    isLeader = false,
}) => {
    const { sendGameMessage, connectedPlayer, getConnectedPlayerPrompt, distributionPromptData, gameState } = useGame();
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const hoverTimeout = React.useRef<number | undefined>(undefined);
    const open = Boolean(anchorElement);
    const {
        aspectRatio,
        width,
    } = useLeaderCardFlipPreview({
        anchorElement,
        cardId: card?.setId ? `${card.setId.set}_${card.setId.number}` : card?.id,
        setPreviewImage,
        frontCardStyle: CardStyle.PlainLeader,
        backCardStyle: CardStyle.Plain,
        isDeployed: false,
        isLeader: anchorElement?.getAttribute('data-card-type') === 'leader',
        card: card ? {
            onStartingSide: card.onStartingSide,
            id: card.id
        } : undefined,
    });

    if (!card) {
        return null
    }

    const controller = gameState?.players[card.controller?.id];

    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.currentTarget;
        const imageUrl = target.getAttribute('data-card-url');
        if (!imageUrl) return;
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
        defaultClickFunction();
    }

    const notImplemented = (card: ICardData) => card?.hasOwnProperty('implemented') && !card.implemented;
    
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
    const borderColor = getBorderColor(card, connectedPlayer, getConnectedPlayerPrompt()?.promptType);
    const distributionAmount = distributionPromptData?.valueDistribution.find((item: DistributionEntry) => item.uuid === card.uuid)?.amount || 0;
    const distributeHealing = gameState?.players[connectedPlayer]?.promptState.distributeAmongTargets?.type === 'distributeHealing';
    const activePlayer = gameState?.players?.[connectedPlayer]?.isActionPhaseActivePlayer;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getForceTokenIconStyle = (player: any) => {
        const imageAspect = player.aspects.includes('villainy') ? 'Villainy' : 'Heroism';
        const opponentStr = player.id !== connectedPlayer ? 'Opponent' : '';
        const backgroundImage = `url(/ForceToken${imageAspect}${opponentStr}.png)`;

        return {
            position: 'absolute',
            width: '3rem',
            aspectRatio: '1 / 1',
            top:'32%',
            right: '-20px',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundImage,
            filter: 'drop-shadow(1px 2px 1px rgba(0, 0, 0, 0.40))',
        };
    }

    const styles = {
        card: {
            backgroundColor: 'black',
            backgroundImage: `url(${s3CardImageURL(card, cardStyle)})`,
            borderRadius: '0.5rem',
            backgroundSize: 'cover',
            width: '100%',
            aspectRatio: '1.39',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: clickDisabled() ? 'normal' : 'pointer',
            position: 'relative', 
            border: borderColor ? `2px solid ${borderColor}` : '2px solid transparent',
            boxSizing: 'border-box',
        },
        deployedPlaceholder: {
            backgroundColor: 'transparent',
            borderRadius: '0.5rem',
            width: '100%',
            maxHeight: '100%',
            aspectRatio: '1.39',
            cursor: 'normal',
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
            display: card.epicActionSpent || card.epicDeployActionSpent && !isDeployed ? 'block' : 'none'
        },
        damageCounterContainer: {
            position: 'absolute',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            pointerEvents: 'none',
        },
        damageCounter: {
            fontWeight: '700',
            fontSize: '1.9rem',
            color: 'white',
            minWidth: '2.5rem',
            padding: '0 10px', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'url(/dmgbg-l.png) left no-repeat, url(/dmgbg-r.png) right no-repeat',
            backgroundSize: '50% 100%, 50% 100%',
            backgroundRepeat: 'no-repeat',
            filter: 'drop-shadow(1px 2px 1px rgba(0, 0, 0, 0.40))',
            textShadow: '2px 2px rgba(0, 0, 0, 0.20)'
        },
        nameplateBox: {
            position: 'absolute',
            bottom: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'black',
            borderRadius: '0.5rem 0.5rem 0 0',
            p: '5px 10px',
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
        },
        cardPreview: {
            borderRadius: '.38em',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio,
            width,
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
    }
    return (
        <Box
            sx={isDeployed ? styles.deployedPlaceholder : styles.card}
            onClick={handleClick}
            aria-owns={open ? 'mouse-over-popover' : undefined}
            aria-haspopup="true"
            data-card-url={s3CardImageURL(card)}
            data-card-type={isLeader ? 'leader' : 'base'}
            onMouseEnter={handlePreviewOpen}
            onMouseLeave={handlePreviewClose}
        >
            <Box sx={styles.cardOverlay}>
                <Box sx={styles.unimplementedAlert}></Box>
            </Box>
            <Box sx={styles.epicActionIcon}></Box>
            { showValueAdjuster() && <CardValueAdjuster card={card} /> }
            {cardStyle === LeaderBaseCardStyle.Base && (
                <>
                    <Box sx={styles.damageCounterContainer}>
                        { !!distributionAmount && 
                        // Need to change background/borderRadius to backgroundImage
                        <Typography variant="body1" sx={{ ...styles.damageCounter, background: distributeHealing ? 'rgba(0, 186, 255, 1)' : 'url(/dmgbg-l.png) left no-repeat, url(/dmgbg-r.png) right no-repeat', borderRadius: distributeHealing ? '17px 8px' : '0px' }}>
                            {distributionAmount}
                        </Typography>
                        }
                        <Typography variant="body1" sx={styles.damageCounter}>
                            {card.damage}
                        </Typography>
                    </Box>
                    {controller?.hasForceToken && <Box sx={getForceTokenIconStyle(controller)}/>}
                    {card.isDefender && <Box sx={styles.defendIcon}/>}
                </>
            )}

            <Popover
                id="mouse-over-popover"
                sx={{ pointerEvents: 'none' }}
                open={open}
                anchorEl={anchorElement}
                anchorOrigin={{
                    vertical: 'center',
                    horizontal: -5,
                }}
                transformOrigin={{
                    vertical: 'center',
                    horizontal: 'right',
                }}
                onClose={handlePreviewClose}
                disableRestoreFocus
                slotProps={{ paper: { sx: { backgroundColor: 'transparent', boxShadow: 'none' } } }}
            >
                <Box sx={{
                    ...styles.cardPreview,backgroundImage: previewImage
                }} >
                </Box>
                {isLeader && (
                    <Typography variant={'body1'} sx={styles.ctrlText}
                    >CTRL: View Flipside</Typography>
                )}
            </Popover>

            {cardStyle === LeaderBaseCardStyle.Leader && title && (
                <>
                    <Box sx={styles.nameplateBox}>
                        <Typography variant="body2" sx={styles.nameplateText}>
                            {title}
                        </Typography>
                    </Box>
                    <Box sx={styles.epicActionIcon}></Box>
                </>
            )}
        </Box>
    );
};

export default LeaderBaseCard;
