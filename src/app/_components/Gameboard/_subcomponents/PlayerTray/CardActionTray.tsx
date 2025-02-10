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
        minWidth: '8rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid transparent',
        background: `linear-gradient(#1D1D1D, #1D1D1D) padding-box, 
        linear-gradient(to top, #404040, #404040) border-box`,
        '&:hover': {
            background: `linear-gradient(#1D1D1D, #1E2D32) padding-box, 
            linear-gradient(to top, #038FC3, #404040) border-box`,
        },
    },
    promptButtonText: {
        transform: 'skew(10deg)',  // Counter-skew the text
        lineHeight: '1.2',
        fontSize: '1.1rem',
        maxWidth: '4.3ch',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
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
    const { sendGameMessage, gameState, connectedPlayer } = useGame();
    const playerState = gameState.players[connectedPlayer];

    const showTrayButtons = () => {
        if (
            playerState.promptState.promptType === 'actionWindow' ||
      playerState.promptState.promptType === 'resource' ||
      playerState.promptState.selectCard
        ) {
            return true;
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
}

const PromptButton: React.FC<IPromptButtonProps> = ({ button, sendGameMessage }) => {
    return (
        <Button
            variant="contained"
            sx={styles.promptButton}
            onClick={() => sendGameMessage([button.command, button.arg, button.uuid])}
        >
            <Box sx={styles.promptButtonText}>
                {button.text}
            </Box>
        </Button>
    );
};

export default CardActionTray;