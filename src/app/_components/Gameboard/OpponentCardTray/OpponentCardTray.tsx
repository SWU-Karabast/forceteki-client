import React from 'react';
import { CloseOutlined, SettingsOutlined } from '@mui/icons-material';
import { Box, Grid2 as Grid, Popover, PopoverOrigin } from '@mui/material';
import Resources from '../_subcomponents/PlayerTray/Resources';
import PlayerHand from '../_subcomponents/PlayerTray/PlayerHand';
import DeckDiscard from '../_subcomponents/PlayerTray/DeckDiscard';
import { IOpponentCardTrayProps } from '@/app/_components/Gameboard/GameboardTypes';
import { useGame } from '@/app/_contexts/Game.context';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { v4 as uuidv4 } from 'uuid';
import { usePopup } from '@/app/_contexts/Popup.context';
import { PopupSource } from '@/app/_components/_sharedcomponents/Popup/Popup.types';
import { useRouter } from 'next/navigation';
import { Stack } from '@mui/system';
import { debugBorder } from '@/app/_utils/debug';
import useScreenOrientation from '@/app/_utils/useScreenOrientation';
import GameTimer from '../_subcomponents/OpponentTray/GameTimer';

const OpponentCardTray: React.FC<IOpponentCardTrayProps> = ({ trayPlayer, preferenceToggle }) => {
    const { gameState, connectedPlayer, getOpponent, isSpectator } = useGame();
    const { openPopup } = usePopup();
    const { isPortrait } = useScreenOrientation();
    const router = useRouter();
    const handleExitButton = () => {
        if (isSpectator){
            router.push('/');
        } else {
            const popupId = `${uuidv4()}`;
            openPopup('leaveGame', {
                uuid: popupId,
                source: PopupSource.User
            });
        }
    };

    const activePlayer = gameState.players[connectedPlayer].isActionPhaseActivePlayer;
    const phase = gameState.phase;
    const opponentsCardback = isSpectator ? undefined : gameState?.players[getOpponent(connectedPlayer)].user?.cosmetics?.cardback;

    const lastPlayedCardUrl = gameState.clientUIProperties?.lastPlayedCard ? `url(${s3CardImageURL({ setId: gameState.clientUIProperties.lastPlayedCard, type: '', id: '' })})` : 'none';

    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const hoverTimeout = React.useRef<number | undefined>(undefined);
    const open = Boolean(anchorElement);
    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.currentTarget;
        hoverTimeout.current = window.setTimeout(() => {
            setAnchorElement(target);
        }, 200);
    };

    const handlePreviewClose = () => {
        clearTimeout(hoverTimeout.current);
        setAnchorElement(null);
    };

    const popoverConfig = (): { anchorOrigin: PopoverOrigin, transformOrigin: PopoverOrigin } => {
        return {
            anchorOrigin:{
                vertical: 'top',
                horizontal: 'left',
            },
            transformOrigin: {
                vertical: 'top',
                horizontal: 'right',
            }
        };
    }

    // ---------------Styles------------------- //
    const styles = {
        leftColumn: {
            ...debugBorder('red'),
            flexDirection: isPortrait ? 'column' : 'row',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            padding: isPortrait ? '0.5rem' : '1.0rem',
            gap: '1rem',
            height: '100%',
            boxSizing: 'border-box',
        },
        centerColumn: {
            ...debugBorder('green'),
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
        },
        opponentHandWrapper: {
            width: '100%',
            height: '100%',
            zIndex: '1',
            display: 'flex',
            alignItems: 'center'
        },
        rightColumn: {
            ...debugBorder('red'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            padding: '1rem 2rem 1rem 0',
            gap: '2rem',
        },
        lastPlayed: {
            ...debugBorder('yellow'),
            width: '4.6rem',
            height: '6.5rem',
            borderRadius: '5px',
            backgroundSize: 'cover',
            backgroundImage: lastPlayedCardUrl,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
        },
        menuStyles: {
            ...debugBorder('yellow'),
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
        },
        opponentTurnAura: {
            height: '100px',
            width: '90%',
            position: 'absolute',
            top: '-100px',
            boxShadow: activePlayer === false ? '0px 20px 35px var(--initiative-red)' : phase === 'regroup' || phase === 'setup' ? '0px 15px 35px rgba(187, 169, 0, 255)' : 'none',
            transition: 'box-shadow .5s',
            borderRadius: '50%',
            left: '0',
            right: '0',
            marginInline: 'auto',
        },
        lastCardPlayedPreview: {
            borderRadius: '.38em',
            backgroundImage: lastPlayedCardUrl,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio: '1 / 1.4',
            width: '16rem',
        },
    };

    return (
        <Grid
            container
            sx={{
                height: '100%',
                display: 'flex',
                flexWrap: 'nowrap',
                columnGap: '1rem', // 2rem gap between columns
                position: 'relative',
                zIndex: 2 // Above playmats
            }}
        >
            {/* Left column (fixed 360px) */}
            <Grid
                size={3}
                sx={{
                    ...styles.leftColumn,
                }}
            >
                <DeckDiscard trayPlayer={trayPlayer} cardback={opponentsCardback} />
                <Resources trayPlayer={trayPlayer}/>
            </Grid>

            {/* Center column (flexes to fill space) */}
            <Grid
                size={6}
                sx={{
                    ...styles.centerColumn,
                }}
            >
                <Box sx={styles.opponentHandWrapper}>
                    <PlayerHand
                        clickDisabled={true}
                        maxCardOverlapPercent={0.95}
                        scrollbarEnabled={false}
                        cards={gameState?.players[getOpponent(connectedPlayer)].cardPiles['hand'] || []}
                        cardback={opponentsCardback} />
                </Box>
                <Box sx={ styles.opponentTurnAura} />
            </Grid>

            {/* Right column (fixed 360px) */}
            <Grid
                size={3}
                sx={{
                    ...styles.rightColumn,
                }}
            >
                <GameTimer 
                    player={gameState?.players[connectedPlayer]} 
                    opponent={gameState?.players[getOpponent(connectedPlayer)]} 
                />
                <Box
                    onMouseEnter={handlePreviewOpen}
                    onMouseLeave={handlePreviewClose}
                    sx={styles.lastPlayed}>
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
                    <Box sx={{ ...styles.lastCardPlayedPreview }} />
                </Popover>
                <Box sx={styles.menuStyles}>
                    <CloseOutlined onClick={handleExitButton} sx={{ cursor:'pointer' }}/>
                    <SettingsOutlined onClick={preferenceToggle} sx={{ cursor:'pointer' }} />
                </Box>
            </Grid>
        </Grid>
    );
};

export default OpponentCardTray;
