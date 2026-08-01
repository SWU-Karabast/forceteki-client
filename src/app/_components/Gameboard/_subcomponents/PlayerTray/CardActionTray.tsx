import React from 'react';
import { Box } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useGame } from '@/app/_contexts/Game.context';
import { debugBorder } from '@/app/_utils/debug';
import useScreenOrientation from '@/app/_utils/useScreenOrientation';
import { DistributionEntry } from '@/app/_hooks/useDistributionPrompt';
import { hasSelectedCards } from '@/app/_utils/gameStateHelpers';
import PulseButton from '@/app/components/Button/PulseButton';

const createStyles = (isPortrait: boolean) => ({
    actionContainer: {
        ...debugBorder('yellow'),
        height: '100%',
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'flex-end', 
        padding: { xs: '0.25rem 15px 15px 0.25rem', md: '0.5rem' },
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
        height: { xs: '3rem', md: '3.8rem' },
        minWidth: { xs: '6rem', md: '2.5rem' },
        maxWidth: { xs: '6rem', sm: '7rem', md: '9rem' },
    },
    promptButtonText: {
        fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1.05rem' },
    },
});

interface IButtonsProps {
    command: string;
    arg: string;
    text: string;
    uuid: string;
    disabled?: boolean;
}

// disabling certain actions briefly to avoid double clicks:
// - for a resource prompt, we disable the "done" button
// - for the action window, we disable the "claim initiative" button
const hasCooldown = (buttonType: string, promptType: string) => (buttonType === 'done' && promptType === 'resource') || (promptType === 'actionWindow' && ['pass', 'claimInitiative'].includes(buttonType));

const CardActionTray: React.FC = () => {
    const { isPortrait } = useScreenOrientation();
    const { sendGameMessage, gameState, connectedPlayer, distributionPromptData } = useGame();
    const playerState = gameState.players[connectedPlayer];
    const styles = createStyles(isPortrait);

    const showTrayButtons = () => {
        if (playerState.promptState.promptType === 'displayCards') {
            // Buttons for the display cards prompt are rendered within the popup itself, not in the action tray
            return false;
        }

        if ( playerState.promptState.promptType === 'actionWindow' ||
             playerState.promptState.promptType === 'resource' ||
             playerState.promptState.promptType === 'distributeAmongTargets' ||
             (hasSelectedCards(gameState, ['groundArena','spaceArena']) && playerState.promptState.buttons?.length == 2) ||
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
                  cooldown={hasCooldown(button.arg, playerState.promptState.promptType)}
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
    cooldown?: boolean;
}

const getPulseButtonVariant = (button: IButtonsProps) => {
    if (button.arg === 'claimInitiative' || button.text === 'Draw') {
        return 'info';
    }

    if (button.arg === 'pass' || button.arg === 'passAbility' || button.text === 'Return' || button.text === 'Exhaust' || button.text === 'Discard') {
        return 'warning';
    }

    if (button.arg === 'done' || button.text === 'Pay' || button.text === 'Top' || button.text === 'Play') {
        return 'success';
    }

    if (button.arg === 'cancel' || button.text === 'Damage' || button.text === 'Bottom') {
        return 'danger';
    }

    return 'default';
}

const PromptButton: React.FC<IPromptButtonProps> = (props) => {
    const { button, sendGameMessage, cooldown, disabled = false } = props;
    const { isPortrait } = useScreenOrientation();
    const styles = createStyles(isPortrait);
    const variant = disabled ? 'default' : getPulseButtonVariant(button);

    return (
        <PulseButton
            variant={variant}
            sx={styles.promptButton}
            textSx={styles.promptButtonText}
            text={button.text}
            pulse={button.arg === 'pass' ? 'big' : 'small'}
            onClick={() => sendGameMessage([button.command, button.arg, button.uuid])}
            disabled={disabled}
            cooldown={cooldown}
        />
    );
};

export default CardActionTray;
