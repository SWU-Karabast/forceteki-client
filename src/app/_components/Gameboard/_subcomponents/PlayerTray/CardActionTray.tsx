import React from 'react';
import { Box, Tooltip } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useGame } from '@/app/_contexts/Game.context';
import { debugBorder } from '@/app/_utils/debug';
import useScreenOrientation from '@/app/_utils/useScreenOrientation';
import { DistributionEntry } from '@/app/_hooks/useDistributionPrompt';
import { hasSelectedCards } from '@/app/_utils/gameStateHelpers';
import PulseButton from '@/app/components/Button/PulseButton';
import { SwuGameFormat } from '@/app/_constants/constants';

// From this many buttons (e.g. Pass + the three Faux Suns claims) a landscape row no longer fits the tray's column
// below desktopHD widths, so there the buttons switch to a compact two-column grid. Its row height also follows the
// viewport height, so both rows still fit the short tray of a phone in landscape.
const CROWDED_BUTTON_COUNT = 4;

const crowdedStyles = {
    buttonsContainer: {
        display: { xs: 'grid', desktopHD: 'flex' },
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: { xs: '0.25rem', desktopHD: '.75rem' },
    },
    promptButton: {
        height: { xs: 'min(2.5rem, 6vh)', desktopHD: '3.8rem' },
        width: { xs: '100%', desktopHD: 'auto' },
        minWidth: { xs: 0, desktopHD: '2.5rem' },
        maxWidth: { xs: 'none', desktopHD: '9rem' },
        padding: { xs: '0 0.25rem', desktopHD: '6px 16px' },
    },
    promptButtonText: {
        fontSize: { xs: '0.65rem', md: '0.75rem', ipadPro: '0.9rem', desktopHD: '1.05rem' },
        lineHeight: 1.05,
    },
};

const createBaseStyles = (isPortrait: boolean) => ({
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
    disabledButtonTooltipWrapper: {
        display: 'flex',
        flex: '1 1 auto',
        minWidth: { xs: '6rem', md: '2.5rem' },
        maxWidth: { xs: '6rem', sm: '7rem', md: '9rem' },
        cursor: 'not-allowed',
    },
});

const createStyles = (isPortrait: boolean, isCrowded = false) => {
    const styles = createBaseStyles(isPortrait);
    if (!isCrowded) {
        return styles;
    }

    return {
        ...styles,
        buttonsContainer: { ...styles.buttonsContainer, ...crowdedStyles.buttonsContainer },
        promptButton: { ...styles.promptButton, ...crowdedStyles.promptButton },
        promptButtonText: { ...styles.promptButtonText, ...crowdedStyles.promptButtonText },
        disabledButtonTooltipWrapper: { ...styles.disabledButtonTooltipWrapper, ...crowdedStyles.promptButton, height: 'auto', padding: 0 },
    };
};

interface IButtonsProps {
    command: string;
    arg: string;
    text: string;
    uuid: string;
    disabled?: boolean;
}

// action window buttons for claiming a counter (Plan and Blast only exist in Faux Suns)
const CLAIM_COUNTER_ARGS = ['claimInitiative', 'claimPlan', 'claimBlast'];

// disabling certain actions briefly to avoid double clicks:
// - for a resource prompt, we disable the "done" button
// - for the action window, we disable the "pass" and "claim <counter>" buttons
const hasCooldown = (buttonType: string, promptType: string) => (buttonType === 'done' && promptType === 'resource') || (promptType === 'actionWindow' && ['pass', ...CLAIM_COUNTER_ARGS].includes(buttonType));

const PASS_BLOCKED_BY_COUNTER_TOOLTIP = 'You can\'t pass while a counter is still unclaimed. Claim one instead.';

const CardActionTray: React.FC = () => {
    const { isPortrait } = useScreenOrientation();
    const { sendGameMessage, gameState, connectedPlayer, distributionPromptData } = useGame();
    const playerState = gameState.players[connectedPlayer];
    const isCrowded = !isPortrait && (playerState.promptState.buttons?.length ?? 0) >= CROWDED_BUTTON_COUNT;
    const styles = createStyles(isPortrait, isCrowded);

    // In Faux Suns the server disables Pass while a counter is still unclaimed. A claim button that is still enabled
    // tells that apart from Pass being disabled because a card action must be taken (that disables the claims too).
    const passBlockedByUnclaimedCounter = gameState.format === SwuGameFormat.FauxSuns &&
        playerState.promptState.promptType === 'actionWindow' &&
        playerState.promptState.buttons?.some((button: IButtonsProps) => CLAIM_COUNTER_ARGS.includes(button.arg) && !button.disabled);

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
                  disabledReason={button.arg === 'pass' && passBlockedByUnclaimedCounter ? PASS_BLOCKED_BY_COUNTER_TOOLTIP : undefined}
                  isCrowded={isCrowded}
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
    // shown as a tooltip while the button is disabled
    disabledReason?: string;
    // the tray holds too many buttons for one row, see CROWDED_BUTTON_COUNT
    isCrowded?: boolean;
}

const getPulseButtonVariant = (button: IButtonsProps) => {
    if (CLAIM_COUNTER_ARGS.includes(button.arg) || button.text === 'Draw') {
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
    const { button, sendGameMessage, cooldown, disabled = false, disabledReason, isCrowded = false } = props;
    const { isPortrait } = useScreenOrientation();
    const styles = createStyles(isPortrait, isCrowded);
    const variant = disabled ? 'default' : getPulseButtonVariant(button);

    const pulseButton = (
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

    if (!disabled || !disabledReason) {
        return pulseButton;
    }

    // a disabled button fires no pointer events, so the tooltip listens on a wrapper that takes the button's place in the tray
    return (
        <Tooltip title={disabledReason} arrow enterTouchDelay={0} leaveTouchDelay={4000}>
            <Box component="span" sx={styles.disabledButtonTooltipWrapper} aria-label={disabledReason}>
                {pulseButton}
            </Box>
        </Tooltip>
    );
};

export default CardActionTray;
