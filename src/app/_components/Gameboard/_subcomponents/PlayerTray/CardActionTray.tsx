import React from 'react';
import { Box, Popover, Tooltip } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useGame } from '@/app/_contexts/Game.context';
import { debugBorder } from '@/app/_utils/debug';
import useScreenOrientation from '@/app/_utils/useScreenOrientation';
import useIsCompactBoard from '@/app/_utils/useIsCompactBoard';
import { DistributionEntry } from '@/app/_hooks/useDistributionPrompt';
import { hasSelectedCards } from '@/app/_utils/gameStateHelpers';
import PulseButton from '@/app/components/Button/PulseButton';
import { SwuGameFormat } from '@/app/_constants/constants';

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
    disabledButtonTooltipWrapper: {
        display: 'flex',
        flex: '1 1 auto',
        minWidth: { xs: '6rem', md: '2.5rem' },
        maxWidth: { xs: '6rem', sm: '7rem', md: '9rem' },
        cursor: 'not-allowed',
    },
    claimMenuPaper: {
        backgroundColor: 'transparent',
        backgroundImage: 'none',
        boxShadow: 'none',
        overflow: 'visible',
    },
    claimMenuOptions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        // keeps the buttons' pulse glow from being clipped by the menu's edges
        p: '0.5rem',
    },
});

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

// the claim menu's button, and the label of each option in it (dropping the "Claim " that the menu button already says)
const CLAIM_MENU_TEXT = 'Claim';
const claimOptionText = (button: IButtonsProps) => button.text.replace(/^Claim /, '');

const PASS_BLOCKED_BY_COUNTER_TOOLTIP = 'You can\'t pass while a counter is still unclaimed. Claim one instead.';

type TrayItem = { kind: 'button'; button: IButtonsProps } | { kind: 'claimMenu'; buttons: IButtonsProps[] };

const CardActionTray: React.FC = () => {
    const { isPortrait } = useScreenOrientation();
    const { sendGameMessage, gameState, connectedPlayer, distributionPromptData } = useGame();
    const playerState = gameState.players[connectedPlayer];
    const isCompactBoard = useIsCompactBoard();
    const styles = createStyles(isPortrait);

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

    // On a compact board the claim buttons (up to three in Faux Suns) share one place in the tray: while more than one
    // counter is unclaimed they collapse into a single Claim button that opens a menu of them, and the last one left is
    // shown on its own in that place. Large screens show every button in a row.
    const promptType: string = playerState.promptState.promptType;
    const buttons: IButtonsProps[] = playerState.promptState.buttons ?? [];
    const claimButtons = buttons.filter((button) => CLAIM_COUNTER_ARGS.includes(button.arg));
    const collapseClaims = isCompactBoard && promptType === 'actionWindow' && claimButtons.length > 1;
    const trayItems: TrayItem[] = [];
    for (const button of buttons) {
        if (!collapseClaims || !CLAIM_COUNTER_ARGS.includes(button.arg)) {
            trayItems.push({ kind: 'button', button });
        } else if (button === claimButtons[0]) {
            trayItems.push({ kind: 'claimMenu', buttons: claimButtons });
        }
    }

    return (
        <Grid
            container
            justifyContent="center"
            alignItems="center"
            spacing={2}
            sx={styles.actionContainer}
        >
            <Box sx={styles.buttonsContainer}>
                {showTrayButtons() && trayItems.map((item) => {
                    if (item.kind === 'claimMenu') {
                        return (
                            <ClaimMenu
                                key="claimMenu"
                                buttons={item.buttons}
                                sendGameMessage={sendGameMessage}
                                cooldown={hasCooldown(item.buttons[0].arg, promptType)}
                            />
                        );
                    }

                    const { button } = item;
                    return (
                        <PromptButton
                            key={button.arg}
                            button={button}
                            cooldown={hasCooldown(button.arg, promptType)}
                            sendGameMessage={sendGameMessage}
                            disabled={buttonDisabled(button)}
                            disabledReason={button.arg === 'pass' && passBlockedByUnclaimedCounter ? PASS_BLOCKED_BY_COUNTER_TOOLTIP : undefined}
                        />
                    );
                })}
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
    const { button, sendGameMessage, cooldown, disabled = false, disabledReason } = props;
    const { isPortrait } = useScreenOrientation();
    const styles = createStyles(isPortrait);
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

interface IClaimMenuProps {
    // the claim buttons offered by the action window, at least two
    buttons: IButtonsProps[];
    sendGameMessage: (args: [string, string, string]) => void;
    cooldown?: boolean;
}

/**
 * The claim buttons collapsed into one Claim button, for a compact board. Clicking it opens the unclaimed counters as a
 * menu above it (beside it in portrait, where the tray is a column), and picking one claims it.
 */
const ClaimMenu: React.FC<IClaimMenuProps> = ({ buttons, sendGameMessage, cooldown }) => {
    const { isPortrait } = useScreenOrientation();
    const styles = createStyles(isPortrait);
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
    // the server enables and disables the claim buttons together (all of them are disabled while a card action is required)
    const disabled = buttons.every((button) => button.disabled);
    const isOpen = !!anchorEl && !disabled;

    const claim = (button: IButtonsProps) => {
        setAnchorEl(null);
        sendGameMessage([button.command, button.arg, button.uuid]);
    };

    return (
        <>
            <PulseButton
                variant={disabled ? 'default' : 'info'}
                sx={styles.promptButton}
                textSx={styles.promptButtonText}
                text={`${CLAIM_MENU_TEXT} ${isPortrait ? '\u25C2' : '\u25B4'}`}
                onClick={(event) => setAnchorEl(isOpen ? null : event.currentTarget)}
                disabled={disabled}
                cooldown={cooldown}
                aria-haspopup="menu"
                aria-expanded={isOpen}
            />
            <Popover
                open={isOpen}
                anchorEl={anchorEl}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={isPortrait ? { vertical: 'center', horizontal: 'left' } : { vertical: 'top', horizontal: 'center' }}
                transformOrigin={isPortrait ? { vertical: 'center', horizontal: 'right' } : { vertical: 'bottom', horizontal: 'center' }}
                slotProps={{ paper: { sx: styles.claimMenuPaper } }}
            >
                <Box role="menu" sx={styles.claimMenuOptions}>
                    {buttons.map((button) => (
                        <PulseButton
                            key={button.arg}
                            role="menuitem"
                            variant="info"
                            sx={{ ...styles.promptButton, width: anchorEl?.offsetWidth }}
                            textSx={styles.promptButtonText}
                            text={claimOptionText(button)}
                            onClick={() => claim(button)}
                            disabled={button.disabled}
                        />
                    ))}
                </Box>
            </Popover>
        </>
    );
};

export default CardActionTray;
