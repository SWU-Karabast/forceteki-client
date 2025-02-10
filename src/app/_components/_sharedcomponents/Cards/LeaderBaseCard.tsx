import React from 'react';
import {
    Typography,
    Box,
} from '@mui/material';
import { ILeaderBaseCardProps, LeaderBaseCardStyle } from './CardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { getBorderColor } from './cardUtils';


const LeaderBaseCard: React.FC<ILeaderBaseCardProps> = ({
    card,
    title,
    cardStyle = LeaderBaseCardStyle.Plain,
    disabled = false,
}) => {
    const { sendGameMessage, connectedPlayer, getConnectedPlayerPrompt } = useGame();

    if (!card) {
        return null
    }

    const isDeployed = card.hasOwnProperty('zone') && card.zone !== 'base';
    const borderColor = getBorderColor(card, connectedPlayer, getConnectedPlayerPrompt()?.promptType);

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
        damageCounter: {
            fontWeight: '800',
            fontSize: '1.9rem',
            color: 'white',
            width: '2.5rem',
            aspectRatio: '1 / 1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundImage: 'url(/token-background.svg)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            filter: 'drop-shadow(0 4px 4px 0 #00000040)',
            textShadow: '1px 1px #00000033'
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
            <Box sx={styles.cardOverlay}></Box>
            <Box sx={styles.epicActionIcon}></Box>
            {cardStyle === LeaderBaseCardStyle.Base && (
                <Typography variant="body1" sx={styles.damageCounter}>
                    {card.damage}
                </Typography>
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