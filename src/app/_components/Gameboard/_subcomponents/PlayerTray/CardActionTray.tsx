import React, { useEffect, useState } from 'react';
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
    disabled?: boolean;
}

/** --------------------- COMPONENTS --------------------- **/

/**
 * CardActionTray Component
 */
const CardActionTray: React.FC = () => {
    const [ resourcePromptDoneButtonOverride, setResourcePromptDoneButtonOverride ] = useState<boolean | null>(null);
    const { sendGameMessage, gameState, connectedPlayer, distributionPromptData, getConnectedPlayerPrompt } = useGame();
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
                const damageSpent = distributionPromptData?.valueDistribution.reduce((acc, curr) => acc + curr.amount, 0) ?? 0;
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


/**
 * PromptButton Subcomponent
 */
interface IPromptButtonProps {
    button: IButtonsProps;
    sendGameMessage: (args: [string, string, string]) => void;
    disabled?: boolean;
}


const PromptButton: React.FC<IPromptButtonProps> = ({ button, sendGameMessage, disabled }) => {
    const actionTrayStyles = (arg: string, disabled = false) => {
        switch (arg) {
            case 'claimInitiative':
                return disabled ? {} : {
                    badckground: `linear-gradient(rgb(29, 29, 29), #1E2D32) padding-box, 
                        linear-gradient(to top, #038FC3, #404040) border-box`,
                    '&:hover': {
                        background: `linear-gradient(rgb(29, 29, 29),rgb(20, 65, 81)) padding-box, 
                        linear-gradient(to top, #038FC3, #404040) border-box`,
                    },
                };
            default: return {};
        }
    }

    return (
        <Button
            variant="contained"
            sx={{ ...styles.promptButton, ...actionTrayStyles(button.arg, button.disabled) }}
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