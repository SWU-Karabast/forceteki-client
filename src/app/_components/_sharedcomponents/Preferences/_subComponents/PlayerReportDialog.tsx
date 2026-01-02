import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Typography,
    Alert,
    Box,
    Link,
    Button, Checkbox, FormControlLabel
} from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import {
    IPlayerReportDialogProps,
    IReportTypeConfig,
    PlayerReportType
} from "@/app/_components/_sharedcomponents/Preferences/Preferences.types";

const REPORT_TYPES: IReportTypeConfig[] = [
    {
        type: PlayerReportType.AbusingMechanics,
        label: 'Mechanic Abuse',
        description: 'Exploiting game mechanics like the rollback feature',
    },
    {
        type: PlayerReportType.ChatHarrasment,
        label: 'Chat Harrasment',
        description: 'Racial slurs, homophobia, threats, or other harmful communication',
    },
    {
        type: PlayerReportType.OffensiveUsername,
        label: 'Offensive Username',
        description: 'Opponents username contains harmful communication',
    }
];

const MIN_DESCRIPTION_LENGTH = 10;
const MAX_DESCRIPTION_LENGTH = 1000;

const PlayerReportDialog: React.FC<IPlayerReportDialogProps> = ({
                                                                   open,
                                                                   onClose,
                                                               }) => {
    const { sendLobbyMessage, isAnonymousPlayer, playerReportState, isSpectator, getOpponent, hasChatDisabled, connectedPlayer  } = useGame();

    const [selectedReportType, setSelectedReportType] = useState<PlayerReportType | null>(null);
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [disableChat, setDisableChat] = useState(true);
    const isChatDisabled = hasChatDisabled(getOpponent(connectedPlayer)) ||
        hasChatDisabled(connectedPlayer) ||
        isAnonymousPlayer(getOpponent(connectedPlayer)) ||
        isAnonymousPlayer(connectedPlayer);

    const requiresDescription = selectedReportType === PlayerReportType.AbusingMechanics;
    const isDescriptionValid = !requiresDescription || description.trim().length >= MIN_DESCRIPTION_LENGTH;
    const showDescriptionError = requiresDescription && description.length > 0 && description.length < MIN_DESCRIPTION_LENGTH;
    // Reset form when popup opens
    useEffect(() => {
        if (open) {
            setSelectedReportType(null);
            setDescription('');
            setError('');
            setSuccess(false);
        }
    }, [open]);

    // Handle report result from server
    useEffect(() => {
        setSuccess(playerReportState?.success);
        if(!success){
            setError(playerReportState?.message);
        }
    }, [playerReportState?.id]);

    const handleReportTypeSelect = (type: PlayerReportType) => {
        setSelectedReportType(type);
        if (error) setError('');
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value.length <= MAX_DESCRIPTION_LENGTH) {
            setDescription(value);
            if (error) setError('');
        }
    };

    const handleSubmit = async () => {
        if (!selectedReportType) {
            setError('Please select a report type');
            return;
        }

        if (requiresDescription && description.trim().length < MIN_DESCRIPTION_LENGTH) {
            setError(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters for Mechanic Abuse reports`);
            return;
        }

        setError('');

        try {

            if(disableChat || isChatDisabled) {
                sendLobbyMessage(['muteChat']);
            }
            // Send the player report to the server
            sendLobbyMessage(['submitReport','player', description, selectedReportType]);
        } catch (err) {
            setError('An error occurred while submitting the report');
            console.error('Error submitting player report:', err);
        }
    };

    const handleClose = () => {
        onClose();
        // Reset the form after dialog closes
        setTimeout(() => {
            setSelectedReportType(null);
            setDescription('');
            setError('');
            setSuccess(false);
        }, 300);
    };

    const getDescriptionHelperText = () => {
        const charCount = `${description.length}/${MAX_DESCRIPTION_LENGTH} characters`;

        if (requiresDescription) {
            if (showDescriptionError) {
                return `${charCount} (minimum ${MIN_DESCRIPTION_LENGTH} required)`;
            }
            return charCount;
        }

        // Other report types - description is optional
        return `${charCount} (optional)`;
    };

    /* STYLES */
    const reportDialogStyles = {
        dialog: {
            '& .MuiDialog-paper': {
                backgroundColor: '#1A2331',
                color: 'white',
                borderRadius: '12px',
                border: '1px solid rgba(79, 171, 210, 0.3)',
                boxShadow: '0 0 15px rgba(79, 171, 210, 0.2)',
                overflow: 'hidden',
                maxWidth: '500px',
                width: '100%'
            },
            '& .MuiBackdrop-root': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)'
            }
        },
        dialogTitle: {
            fontSize: '1.5rem',
            fontWeight: 500,
            borderBottom: '1px solid rgba(79, 171, 210, 0.2)',
            padding: '20px 24px',
            color: 'white'
        },
        dialogContent: {
            padding: '24px',
            color: 'rgba(255, 255, 255, 0.9)'
        },
        dialogActions: {
            padding: '16px 24px',
            borderTop: '1px solid rgba(79, 171, 210, 0.2)',
            justifyContent: 'center'
        },
        textField: {
            '& .MuiOutlinedInput-root': {
                color: 'white',
                '& fieldset': {
                    borderColor: 'rgba(79, 171, 210, 0.5)',
                },
                '&:hover fieldset': {
                    borderColor: 'rgba(79, 171, 210, 0.8)',
                },
                '&.Mui-focused fieldset': {
                    borderColor: '#4FABD2',
                },
            },
            '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-focused': {
                    color: '#4FABD2',
                },
            },
            '& .MuiFormHelperText-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-error': {
                    color: 'error.main',
                },
            },
        },
        checkbox: {
            color: 'rgba(79, 171, 210, 0.5)',
            '&.Mui-checked': {
                color: '#4FABD2',
            },
            '&:hover': {
                backgroundColor: 'rgba(79, 171, 210, 0.1)',
            }
        },
        formControlLabel: {
            marginLeft: 0,
            marginRight: 0,
            '& .MuiFormControlLabel-label': {
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.875rem',
            }
        },
        alerts: {
            info: {
                backgroundColor: 'rgba(255, 214, 0, 0.2)',
                color: '#ffd54f',
                border: '1px solid rgba(255, 214, 0, 0.3)',
                '& .MuiAlert-icon': {
                    color: '#ffd54f'
                }
            },
            success: {
                backgroundColor: 'rgba(46, 125, 50, 0.2)',
                color: '#81c784',
                border: '1px solid rgba(46, 125, 50, 0.3)',
                '& .MuiAlert-icon': {
                    color: '#81c784'
                }
            },
            error: {
                backgroundColor: 'rgba(211, 47, 47, 0.2)',
                color: '#ef5350',
                border: '1px solid rgba(211, 47, 47, 0.3)',
                '& .MuiAlert-icon': {
                    color: '#ef5350'
                }
            }
        },
        reportTypeButton: (selected: boolean) => ({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            textAlign: 'left',
            padding: '12px 16px',
            marginBottom: '8px',
            width: '100%',
            backgroundColor: selected ? 'rgba(79, 171, 210, 0.3)' : 'transparent',
            borderColor: selected ? '#4FABD2' : 'rgba(79, 171, 210, 0.5)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderRadius: '8px',
            color: 'white',
            textTransform: 'none',
            '&:hover': {
                backgroundColor: selected ? 'rgba(79, 171, 210, 0.4)' : 'rgba(79, 171, 210, 0.1)',
                borderColor: '#4FABD2'
            }
        }),
        checkboxContainer: (disabled: boolean) => ({
            backgroundColor: 'rgba(79, 171, 210, 0.1)',
            borderRadius: '8px',
            padding: '12px 16px',
            border: '1px solid rgba(79, 171, 210, 0.3)',
            opacity: disabled ? 0.6 : 1
        }),
        helperText: {
            display: 'block',
            color: 'rgba(255, 255, 255, 0.5)',
            ml: 4,
            mt: -0.5
        },
        descriptionText: {
            mb: 2,
            mt: 2.5,
            color: 'rgba(255, 255, 255, 0.7)'
        },
        sectionLabel: {
            mb: 1,
            fontWeight: 'bold',
            color: 'white'
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} sx={reportDialogStyles.dialog}>
            <DialogTitle sx={reportDialogStyles.dialogTitle}>
                Report Player
            </DialogTitle>
            <DialogContent sx={reportDialogStyles.dialogContent}>
                {isSpectator ? (
                    /* Spectator warning */
                    <Alert severity="info" sx={{ my: 1, ...reportDialogStyles.alerts.info }}>
                        Player reporting is disabled for spectators. Feel free to report at our{' '}
                        <Link
                            href="https://discord.com/channels/1220057752961814568/1345468050568380568"
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ color: 'inherit', textDecoration: 'underline' }}
                        >
                            discord channel
                        </Link>
                    </Alert>
                ) : success ? (
                    <Alert severity="success" sx={{ my: 1, ...reportDialogStyles.alerts.success }}>
                        Report submitted successfully. Thank you for helping keep our community safe!
                    </Alert>
                ) : (
                    <>
                        {error && (
                            <Alert severity="error" sx={{ mb: 2, ...reportDialogStyles.alerts.error }}>
                                {error}
                            </Alert>
                        )}

                        <Typography variant="body2" sx={reportDialogStyles.descriptionText}>
                            Please select the type of violation and provide details about what happened.
                        </Typography>

                        <Typography variant="subtitle2" sx={reportDialogStyles.sectionLabel}>
                            Select Report Type:
                        </Typography>

                        <Box sx={{ mb: 2 }}>
                            {REPORT_TYPES.map((config) => (
                                <Button
                                    key={config.type}
                                    onClick={() => handleReportTypeSelect(config.type)}
                                    sx={reportDialogStyles.reportTypeButton(selectedReportType === config.type)}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                        <Typography variant="subtitle2" fontWeight="bold">
                                            {config.label}
                                        </Typography>
                                    </Box>
                                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                        {config.description}
                                    </Typography>
                                </Button>
                            ))}
                        </Box>

                        {selectedReportType && (
                            <>
                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold', color: 'white' }}>
                                    Describe what happened:
                                </Typography>

                                <TextField
                                    label="Description"
                                    multiline
                                    rows={4}
                                    fullWidth
                                    variant="outlined"
                                    value={description}
                                    onChange={handleDescriptionChange}
                                    error={showDescriptionError}
                                    helperText={
                                        <span style={{
                                            color: showDescriptionError ? '#ef5350' : 'inherit'
                                        }}>
                                            {description.length}/{MAX_DESCRIPTION_LENGTH} characters
                                            {requiresDescription && showDescriptionError && ` (minimum ${MIN_DESCRIPTION_LENGTH})`}
                                            {!requiresDescription && ' (optional)'}
                                        </span>
                                    }
                                    placeholder="Please provide specific details about the incident..."
                                    sx={{ mb: 1, ...reportDialogStyles.textField }}
                                />
                                <Box sx={reportDialogStyles.checkboxContainer(isChatDisabled)}>
                                    <FormControlLabel
                                        sx={reportDialogStyles.formControlLabel}
                                        control={
                                            <Checkbox
                                                checked={disableChat}
                                                onChange={(e) => setDisableChat(e.target.checked)}
                                                disabled={isChatDisabled}
                                                sx={reportDialogStyles.checkbox}
                                            />
                                        }
                                        label="Disable chat with this player"
                                    />
                                    <Typography
                                        variant="caption"
                                        sx={reportDialogStyles.helperText}
                                    >{isChatDisabled
                                        ? 'Chat is already disabled for this game'
                                        : 'This will disable chat for the rest of this game'
                                    }
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </>
                )}
            </DialogContent>
            <DialogActions sx={reportDialogStyles.dialogActions}>
                {success ? (
                    <PreferenceButton
                        buttonFnc={handleClose}
                        variant="standard"
                        text="Ok"
                    />
                ) : (
                    <>
                        <PreferenceButton
                            buttonFnc={handleClose}
                            variant="concede"
                            text="Cancel"
                        />
                        <PreferenceButton
                            buttonFnc={handleSubmit}
                            variant="standard"
                            disabled={
                                !selectedReportType ||
                                !isDescriptionValid ||
                                success
                            }
                            text="Submit Report"
                        />
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default PlayerReportDialog;