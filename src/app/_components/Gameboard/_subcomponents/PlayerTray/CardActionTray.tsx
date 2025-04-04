import React from 'react';
import { Button, Box } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { useGame } from '@/app/_contexts/Game.context';

// ------------------------STYLES------------------------//
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
        transform: 'skew(-10deg)', // Skew the button
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
    },
    promptButtonText: {
        transform: 'skew(10deg)',  // Counter-skew the text
        lineHeight: '1.2',
        fontSize: '1.1rem',
        '& :disabled': {
            brightness: '0.7',
        },
    },
};

/** --------------------- TYPES --------------------- **/
interface IButtonsProps {
    command: string;
    arg: string;
    text: string;
    uuid: string;
}

/** --------------------- COMPONENTS --------------------- **/

/**
 * CardActionTray Component
 */
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

        return false;
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


/**
 * PromptButton Subcomponent
 */
interface IPromptButtonProps {
    button: IButtonsProps;
    sendGameMessage: (args: [string, string, string]) => void;
    disabled?: boolean;
}


const PromptButton: React.FC<IPromptButtonProps> = ({ button, sendGameMessage, disabled }) => {
    const actionTrayStyles = (arg: string) => {
        switch (arg) {
            case 'claimInitiative':
                return {
                    background: `linear-gradient(rgb(29, 29, 29), #0A2A4A) padding-box, 
                        linear-gradient(to top, #0091EA, #2979FF) border-box`,
                    '&:hover': {
                        background: `linear-gradient(rgb(29, 29, 29), #0D47A1) padding-box, 
                        linear-gradient(to top, #2196F3, #2979FF) border-box`,
                    },
                    boxShadow: '0 0 15px rgba(33, 150, 243, 0.9)',
                    minWidth: '9rem',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                        '0%': {
                            boxShadow: '0 0 15px rgba(33, 150, 243, 0.7)'
                        },
                        '50%': {
                            boxShadow: '0 0 20px rgba(41, 121, 255, 0.9)'
                        },
                        '100%': {
                            boxShadow: '0 0 15px rgba(33, 150, 243, 0.7)'
                        }
                    }
                };
            case 'pass':
            case 'done':
                return {
                    background: `linear-gradient(rgb(29, 29, 29), #32301E) padding-box, 
                        linear-gradient(to top, #FFC107, #404040) border-box`,
                    '&:hover': {
                        background: `linear-gradient(rgb(29, 29, 29), #423D25) padding-box, 
                        linear-gradient(to top, #FFD54F, #404040) border-box`,
                    },
                    boxShadow: '0 0 10px rgba(255, 193, 7, 0.5)',
                    minWidth: '9rem',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                };
            default: return {};
        }
    };

    // Custom text styles for specific button types
    const getTextStyles = (arg: string) => {
        switch (arg) {
            case 'claimInitiative':
                return {
                    transform: 'skew(10deg)',
                    lineHeight: '1.2',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    textShadow: '0 0 8px rgba(33, 150, 243, 1)',
                    color: '#E3F2FD'
                };
            case 'pass':
            case 'done':
                return {
                    transform: 'skew(10deg)',
                    lineHeight: '1.2',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: '#FFFFFF',
                    textShadow: '0 0 5px rgba(255, 193, 7, 0.7)'
                };
            default:
                return styles.promptButtonText;
        }
    };

    return (
        <Button
            variant="contained"
            sx={{ ...styles.promptButton, ...actionTrayStyles(button.arg) }}
            onClick={() => sendGameMessage([button.command, button.arg, button.uuid])}
            disabled={disabled}
        >
            <Box sx={getTextStyles(button.arg)}>
                {button.text}
            </Box>
        </Button>
    );
};

export default CardActionTray;
