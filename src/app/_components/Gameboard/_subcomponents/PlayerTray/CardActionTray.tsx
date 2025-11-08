import React, { useEffect, useState } from 'react';
import { Button, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useGame } from '@/app/_contexts/Game.context';
import { keyframes } from '@mui/system';
import { debugBorder } from '@/app/_utils/debug';
import useScreenOrientation from '@/app/_utils/useScreenOrientation';
import { DistributionEntry } from '@/app/_hooks/useDistributionPrompt';

const pulseBorder = keyframes`
  0% {
    border-color: rgba(0, 140, 255, 0.4);
    box-shadow: 0 0 4px rgba(0, 140, 255, 0.4);
  }
  50% {
    border-color: rgba(0, 180, 255, 0.6);
    box-shadow: 0 0 8px rgba(0, 180, 255, 0.6);
  }
  100% {
    border-color: rgba(0, 140, 255, 0.4);
    box-shadow: 0 0 4px rgba(0, 140, 255, 0.4);
  }
`;

const pulseYellowBorder = keyframes`
  0% {
    border-color: rgba(204, 172, 0, 0.4);
    box-shadow: 0 0 4px rgba(204, 172, 0, 0.4);
  }
  50% {
    border-color: rgba(220, 185, 0, 0.6);
    box-shadow: 0 0 8px rgba(220, 185, 0, 0.6);
  }
  100% {
    border-color: rgba(204, 172, 0, 0.4);
    box-shadow: 0 0 4px rgba(204, 172, 0, 0.4);
  }
`;

const pulseYellowBorderAbility = keyframes`
  0% {
    border-color: rgba(204, 172, 0, 0.4);
    box-shadow: 0 0 8px rgba(204, 172, 0, 0.6);
  }
  50% {
    border-color: rgba(220, 185, 0, 0.6);
    box-shadow: 0 0 16px rgba(220, 185, 0, 0.8);
  }
  100% {
    border-color: rgba(204, 172, 0, 0.4);
    box-shadow: 0 0 8px rgba(204, 172, 0, 0.6);
  }
`;

const pulseGreenBorder = keyframes`
  0% {
    border-color: rgba(0, 170, 70, 0.4);
    box-shadow: 0 0 4px rgba(0, 170, 70, 0.4);
  }
  50% {
    border-color: rgba(0, 200, 90, 0.6);
    box-shadow: 0 0 8px rgba(0, 200, 90, 0.6);
  }
  100% {
    border-color: rgba(0, 170, 70, 0.4);
    box-shadow: 0 0 4px rgba(0, 170, 70, 0.4);
  }
`;

const pulseRedBorder = keyframes`
  0% {
    border-color: rgba(230, 0, 60, 0.4);
    box-shadow: 0 0 4px rgba(230, 0, 60, 0.4);
  }
  50% {
    border-color: rgba(255, 0, 70, 0.6);
    box-shadow: 0 0 8px rgba(255, 0, 70, 0.6);
  }
  100% {
    border-color: rgba(230, 0, 60, 0.4);
    box-shadow: 0 0 4px rgba(230, 0, 60, 0.4);
  }
`;

const createStyles = (isPortrait: boolean) => ({
    actionContainer: {
        ...debugBorder('yellow'),
        height: '100%',
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-end', 
        padding: { xs: '0.25rem', md: '0.5rem' },
    },
    buttonsContainer: {
        ...debugBorder('purple'),
        display: 'flex',
        flexWrap: isPortrait ? 'wrap' : 'nowrap',
        flexDirection: isPortrait ? 'column' : 'row',
        gap: { xs: '0.5rem', md: '.75rem' },
        alignItems: isPortrait ? 'stretch' : 'center',
        justifyContent: 'flex-end',
        width: isPortrait ? 'auto' : '100%', 
        maxWidth: '100%',
    },
    promptButton: {
        transform: 'skew(-10deg)',
        borderRadius: '1rem',
        height: { xs: '2.5rem', sm: '3rem', md: '3.8rem' },
        minWidth: { xs: '1.5rem', md: '2.5rem' },
        maxWidth: { xs: '5rem', sm: '7rem', md: '9rem' },
        flex: '1 1 auto', 
        
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid transparent',
        background: `linear-gradient(rgb(29, 29, 29),rgb(29, 29, 29)) padding-box, 
        linear-gradient(to top, #404040, #404040) border-box`,
        '&:hover': {
            background: `linear-gradient(rgb(29, 29, 29),rgb(20, 65, 81)) padding-box, 
            linear-gradient(to top,rgb(50, 81, 93), #404040) border-box`,
        },
        '&:not(:disabled)': {
            transition: 'box-shadow 0.3s ease-in-out',
        },
        // Improve touch target size for mobile
        touchAction: 'manipulation',
    },
    promptButtonText: {
        transform: 'skew(10deg)',
        lineHeight: '1.2',
        fontSize: { xs: '0.6rem', sm: '0.9rem', md: '1.05rem' },     
        textAlign: 'center',
        '& :disabled': {
            brightness: '0.7',
        },
    },
});


interface IButtonsProps {
    command: string;
    arg: string;
    text: string;
    uuid: string;
    disabled?: boolean;
}

const CardActionTray: React.FC = () => {
    const { isPortrait } = useScreenOrientation();
    const [ resourcePromptDoneButtonOverride, setResourcePromptDoneButtonOverride ] = useState<boolean | null>(null);
    const { sendGameMessage, gameState, connectedPlayer, distributionPromptData, getConnectedPlayerPrompt } = useGame();
    const playerState = gameState.players[connectedPlayer];

    const styles = createStyles(isPortrait);

    let hasSelectedCards = false;
    for (const player in gameState.players) {
        if (!gameState.players.hasOwnProperty(player)){
            continue;
        }
        hasSelectedCards ||=
            gameState.players[player].cardPiles.groundArena.some((card: any) => card.selected)
            || gameState.players[player].cardPiles.spaceArena.some((card: any) => card.selected);
    }

    const showTrayButtons = () => {
        if ( playerState.promptState.promptType === 'actionWindow' ||
             playerState.promptState.promptType === 'resource' ||
             playerState.promptState.promptType === 'distributeAmongTargets' ||
             (hasSelectedCards && playerState.promptState.buttons?.length == 2) ||
             !!playerState.promptState.selectCardMode === true ) {
            return true;
        }
        return false;
    };

    const buttonDisabled = (button: IButtonsProps) => {
        if (button.arg === 'done') {
            const distributeValues = playerState.promptState.distributeAmongTargets;
            if (distributeValues) {
                const damageSpent = distributionPromptData?.valueDistribution.reduce((acc: number, curr: DistributionEntry) => acc + curr.amount, 0) ?? 0;
                if ((!distributeValues.canChooseNoTargets && damageSpent === 0) || (!distributeValues.canDistributeLess && damageSpent > 0 && damageSpent < distributeValues.amount)) {
                    return true;
                }
            }

            // for a resource prompt, we disable the "done" button briefly to avoid double clicks
            if (getConnectedPlayerPrompt()?.promptType === 'resource') {
                if (resourcePromptDoneButtonOverride == null) {
                    setResourcePromptDoneButtonOverride(true);
                    setTimeout(() => {
                        setResourcePromptDoneButtonOverride(false);
                    }, 500);

                    return true;
                }

                return resourcePromptDoneButtonOverride;
            }
        }

        return !!button.disabled;
    };

    useEffect(() => {
        if (getConnectedPlayerPrompt()?.promptType !== 'resource') {
            setResourcePromptDoneButtonOverride(null);
        }
    }, [gameState]);

    return (
        <Grid
            container
            justifyContent="center"
            alignItems="center"
            spacing={2}
            sx={styles.actionContainer}
        >
            <Box sx={styles.buttonsContainer}>
                {showTrayButtons() &&
          playerState.promptState.buttons.map((button: IButtonsProps) => (
              <PromptButton
                  key={button.arg}
                  button={button}
                  sendGameMessage={sendGameMessage}
                  disabled={buttonDisabled(button)}
              />
          ))}
            </Box>
        </Grid>
    );
};


interface IPromptButtonProps {
    button: IButtonsProps;
    sendGameMessage: (args: [string, string, string]) => void;
    disabled?: boolean;
}


const PromptButton: React.FC<IPromptButtonProps> = ({ button, sendGameMessage, disabled }) => {
    const { isPortrait } = useScreenOrientation();
    const styles = createStyles(isPortrait);
    
    const actionTrayStyles = (button: IButtonsProps, disabled = false) => {
        if (button.arg === 'claimInitiative') {
            return disabled ? {} : {
                background: `linear-gradient(rgb(29, 29, 29), #0a3b4d) padding-box, 
                    linear-gradient(to top, #038FC3, #0a3b4d) border-box`,
                '&:hover': {
                    background: `linear-gradient(rgb(29, 29, 29),rgb(20, 65, 81)) padding-box, 
                    linear-gradient(to top, #038FC3, #0a3b4d) border-box`,
                },
                '&:not(:disabled)': {
                    animation: `${pulseBorder} 4s infinite ease-in-out`,
                    boxShadow: '0 0 6px rgba(0, 140, 255, 0.5)',
                    border: '1px solid rgba(0, 140, 255, 0.5)',
                },
            };
        }

        if (button.arg === 'pass' || button.arg === 'passAbility') {
            return disabled ? {} : {
                background: `linear-gradient(rgb(29, 29, 29), #3d3a0a) padding-box, 
                    linear-gradient(to top, #b3a81c, #3d3a0a) border-box`,
                '&:hover': {
                    background: `linear-gradient(rgb(29, 29, 29),rgb(81, 77, 20)) padding-box, 
                    linear-gradient(to top, #d4c82a, #3d3a0a) border-box`,
                    boxShadow: '0 0 8px rgba(204, 172, 0, 0.7)',
                    border: '1px solid rgba(220, 185, 0, 0.7)',
                },
                '&:not(:disabled)': {
                    animation: button.arg === 'pass' ? `${pulseYellowBorder} 4s infinite ease-in-out` : `${pulseYellowBorderAbility} 3s infinite ease-in-out`,
                    boxShadow: '0 0 6px rgba(204, 172, 0, 0.5)',
                    border: '1px solid rgba(204, 172, 0, 0.5)',
                },
            };
        }
        
        if (button.arg === 'done') {
            return disabled ? {} : {
                background: `linear-gradient(rgb(29, 29, 29), #0a3d1e) padding-box, 
                    linear-gradient(to top, #1cb34a, #0a3d1e) border-box`,
                '&:hover': {
                    background: `linear-gradient(rgb(29, 29, 29),rgb(20, 81, 40)) padding-box, 
                    linear-gradient(to top, #2ad44c, #0a3d1e) border-box`,
                    boxShadow: '0 0 8px rgba(0, 170, 70, 0.7)',
                    border: '1px solid rgba(0, 200, 90, 0.7)',
                },
                '&:not(:disabled)': {
                    animation: `${pulseGreenBorder} 4s infinite ease-in-out`,
                    boxShadow: '0 0 6px rgba(0, 170, 70, 0.5)',
                    border: '1px solid rgba(0, 170, 70, 0.5)',
                },
            };
        }

        if (button.arg === 'cancel') {
            return disabled ? {} : {
                background: `linear-gradient(rgb(29, 29, 29), #641515) padding-box, 
                    linear-gradient(to top, #b82121, #641515) border-box`,
                '&:hover': {
                    background: `linear-gradient(rgb(29, 29, 29),rgb(110, 25, 25)) padding-box, 
                    linear-gradient(to top, #e02929, #641515) border-box`,
                    boxShadow: '0 0 8px rgba(230, 0, 60, 0.7)',
                    border: '1px solid rgba(255, 0, 70, 0.7)',
                },
                '&:not(:disabled)': {
                    animation: `${pulseRedBorder} 4s infinite ease-in-out`,
                    boxShadow: '0 0 6px rgba(230, 0, 60, 0.5)',
                    border: '1px solid rgba(230, 0, 60, 0.5)',
                },
            };
        }
        
        return {};
    }

    return (
        <Button
            variant="contained"
            sx={{ ...styles.promptButton, ...actionTrayStyles(button, button.disabled) }}
            onClick={() => sendGameMessage([button.command, button.arg, button.uuid])}
            disabled={disabled}
        >
            <Box sx={styles.promptButtonText}>
                {button.text}
            </Box>
        </Button>
    );
};

export default CardActionTray;
