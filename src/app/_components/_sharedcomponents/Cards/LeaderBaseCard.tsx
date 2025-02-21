import React from 'react';
import {
    Typography,
    Box
} from '@mui/material';
import { ILeaderBaseCardProps, LeaderBaseCardStyle } from './CardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { getBorderColor } from './cardUtils';
import CardValueAdjuster from './CardValueAdjuster';


const LeaderBaseCard: React.FC<ILeaderBaseCardProps> = ({
    card,
    title,
    cardStyle = LeaderBaseCardStyle.Plain,
    disabled = false,
}) => {
    const { sendGameMessage, connectedPlayer, getConnectedPlayerPrompt, distributionPromptData } = useGame();

    if (!card) {
        return null
    }
    const isDeployed = card.hasOwnProperty('zone') && card.zone !== 'base';
    const borderColor = getBorderColor(card, connectedPlayer, getConnectedPlayerPrompt()?.promptType);
    const distributionAmount = distributionPromptData?.valueDistribution.find((item) => item.uuid === card.uuid)?.amount || 0;
    const showValueAdjuster = getConnectedPlayerPrompt()?.promptType === 'distributeAmongTargets' && card.selectable && !isDeployed;
    if (showValueAdjuster) {
        // override when using damage adjuster to show border but prevent click events
        disabled = true;
    };


    const styles = {
        card: {
            backgroundColor: 'black',
            backgroundImage: `url(${s3CardImageURL(card)})`,
            borderRadius: '0.5rem',
            backgroundSize: 'cover',
            width: '10rem',
            aspectRatio: '1.39',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: disabled ? 'normal' : 'pointer',
            position: 'relative', 
            border: borderColor ? `2px solid ${borderColor}` : '2px solid transparent',
            boxSizing: 'border-box',
        },
        deployedPlaceholder: {
            backgroundColor: 'transparent',
            borderRadius: '0.5rem',
            width: '10rem',
            aspectRatio: '1.39',
            cursor: 'normal',
            position: 'relative', 
            border: '2px solid #FFFFFF55',
        },
        cardOverlay : {
            position: 'absolute',
            height: '100%',
            width: '100%',
            backgroundColor: card.exhausted ? 'rgba(0, 0, 0, 0.5)' : 'transparent',
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
            backgroundImage: 'url(/epicActionToken.png)',
            display: card.epicActionSpent && !isDeployed ? 'block' : 'none'
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
            backgroundSize: 'contain',
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
            display: card?.hasOwnProperty('implemented') && !card?.implemented ? 'flex' : 'none',
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
        }
    }

    return (
        <Box
            sx={isDeployed ? styles.deployedPlaceholder : styles.card}
            onClick={() => {
                if (!disabled && card.selectable) {
                    sendGameMessage(['cardClicked', card.uuid]);
                }
            }}
        >
            <Box sx={styles.cardOverlay}>
                <Box sx={styles.unimplementedAlert}></Box>
            </Box>
            <Box sx={styles.epicActionIcon}></Box>
            { showValueAdjuster && <CardValueAdjuster cardId={card.uuid} /> }
            {cardStyle === LeaderBaseCardStyle.Base && (
                <Box sx={styles.damageCounterContainer}>
                    { !!distributionAmount && 
                        <Typography variant="body1" sx={styles.damageCounter}>
                            {distributionAmount}
                        </Typography>
                    }
                    <Typography variant="body1" sx={styles.damageCounter}>
                        {card.damage}
                    </Typography>
                </Box>
            )}

            {cardStyle === LeaderBaseCardStyle.Leader && title && (
                <>
                    <Box sx={styles.nameplateBox}>
                        <Typography variant="body2" sx={styles.nameplateText}>
                            {title}
                        </Typography>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default LeaderBaseCard;