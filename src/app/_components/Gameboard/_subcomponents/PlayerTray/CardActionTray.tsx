import React from 'react';
import { Button, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useGame } from '@/app/_contexts/Game.context';
import { keyframes } from '@mui/system';


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

const styles = {
    actionContainer: {
        height: '5.5rem',
        justifyContent: 'right',
    },
    buttonsContainer: {
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
    },
    promptButton: {
        transform: 'skew(-10deg)',
        borderRadius: '1rem',
        height: '3.8rem',
        minWidth: '7rem',
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
    },
    promptButtonText: {
        transform: 'skew(10deg)',
        lineHeight: '1.2',
        fontSize: '1.1rem',
        '& :disabled': {
            brightness: '0.7',
        },
    },
};


interface IButtonsProps {
    command: string;
    arg: string;
    text: string;
    uuid: string;
    disabled?: boolean;
}

const CardActionTray: React.FC = () => {
    const { sendGameMessage, gameState, connectedPlayer, distributionPromptData } = useGame();
    const playerState = gameState.players[connectedPlayer];

    const showTrayButtons = () => {
        if ( playerState.promptState.promptType === 'actionWindow' ||
             playerState.promptState.promptType === 'resource' ||
             playerState.promptState.promptType === 'distributeAmongTargets' ||
             !!playerState.promptState.selectCardMode === true ) {
            return true;
        }
        return false;
    };

    const buttonDisabled = (button: IButtonsProps) => {
        if (button.arg === 'done') {
            const distributeValues = playerState.promptState.distributeAmongTargets;
            if (distributeValues) {
                const damageSpent = distributionPromptData?.valueDistribution.reduce((acc, curr) => acc + curr.amount, 0);
                if (!distributeValues.canDistributeLess && damageSpent !== distributeValues.amount) {
                    return true;
                }
            }
        }

        return !!button.disabled;
    };

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

        if (button.arg === 'pass') {
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
                    animation: `${pulseYellowBorder} 4s infinite ease-in-out`,
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
