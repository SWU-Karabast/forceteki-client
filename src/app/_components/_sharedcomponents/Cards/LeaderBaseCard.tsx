import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
} from '@mui/material';
import { ILeaderBaseCardProps } from './CardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { getBorderColor } from './cardUtils';


const LeaderBaseCard: React.FC<ILeaderBaseCardProps> = ({
    variant,
    isLobbyView = false,
    size = 'standard',
    title,
    card,
    disabled = false,
}) => {
    const { sendGameMessage, connectedPlayer, getConnectedPlayerPrompt } = useGame();

    const styles = {

        cardStyle: {
            backgroundColor: 'black',
            backgroundImage: `url(${s3CardImageURL(card)})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            width: '10rem',
            height: '7.18rem',
            textAlign: 'center',
            display: 'flex',
            cursor: 'pointer',
            m: '0em',
            position: 'relative', // Needed for positioning the red box
            border: `2px solid ${getBorderColor(card, connectedPlayer, getConnectedPlayerPrompt().promptType)}`,
        },
        cardStyleLobby: card ? {
            backgroundColor: 'transparent',
            backgroundImage: `url(${s3CardImageURL(card)})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            width: size === 'standard' ? '9.5vw' : '14rem',
            height: size === 'standard' ? '13vh' : '10.18rem',
            backgroundRepeat: 'no-repeat',
            textAlign: 'center' as const,
            display: 'flex',
            cursor: 'pointer',
            position: 'relative' as const,
            mb: '10px',
        } : {
            backgroundColor: '#00000040',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            width: size === 'standard' ? '9.5vw' : '14rem',
            height: size === 'standard' ? '13vh' : '10.18rem',
            backgroundRepeat: 'no-repeat',
            textAlign: 'center' as const,
            display: 'flex',
            cursor: 'pointer',
            position: 'relative' as const,
            mb: '10px',
        },
        damageStyle: {
            fontWeight: '600',
            fontSize: '2em',
            color: 'hotpink',
        },
        nameplateBoxStyle: {
            position: 'absolute',
            bottom: '0px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'black',
            borderRadius: '4px',
            p: '4px 8px',
        },
        nameplateBoxTypographyStyle: {
            color: 'white',
            fontWeight: '600',
            fontSize: '1em',
        }
    }


    return (
        <Box>
            <Card
                sx={isLobbyView ? styles.cardStyleLobby : styles.cardStyle}
                onClick={() => {
                    // Only allow clicking if not lobby view and the card is selectable
                    if (!disabled && card.selectable) {
                        sendGameMessage(['cardClicked', card.uuid]);
                    }
                }}
            >
                {/* Only show card content if not in lobby view */}
                {!isLobbyView && card && (
                    <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'end' }}>
                            <Typography variant="body1" sx={styles.damageStyle}>
                                {card.damage}
                            </Typography>
                        </Box>
                    </CardContent>
                )}

                {/* Show nameplate only if variant is leader and not lobby view */}
                {variant === 'leader' && !isLobbyView && title && (
                    <Box sx={styles.nameplateBoxStyle}>
                        <Typography variant="body2" sx={styles.nameplateBoxTypographyStyle}>
                            {title}
                        </Typography>
                    </Box>
                )}
            </Card>
        </Box>
    );
};

export default LeaderBaseCard;