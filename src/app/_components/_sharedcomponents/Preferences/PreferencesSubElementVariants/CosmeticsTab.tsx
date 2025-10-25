import * as React from 'react';
import Grid from '@mui/material/Grid2';
import { useUser } from '@/app/_contexts/User.context';
import { useEffect, useState } from 'react';
import { savePreferencesGeneric } from '@/app/_utils/genericPreferenceFunctions';
import CosmeticItem from '@/app/_components/_sharedcomponents/Preferences/_subComponents/CosmeticItem';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, FormControlLabel, Checkbox } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useCosmetics } from '@/app/_contexts/CosmeticsContext';

import { CosmeticOption, CosmeticType } from '../Preferences.types';

function CosmeticsTab() {
    const { user, updateUserPreferences } = useUser();
    const { cosmetics } = useCosmetics();
    const [selectedCardback, setSelectedCardback] = useState<string|null>(null);
    const [selectedBackground, setSelectedBackground] = useState<string|null>(null);
    const [selectedPlaymat, setSelectedPlaymat] = useState<string|null>(null);
    const [disablePlaymats, setDisablePlaymats] = useState<boolean>(false);
    const [expandedAccordion, setExpandedAccordion] = useState<string>('cardbacks'); // Default to cardbacks expanded

    useEffect(() => {
        if (user) {
            const { cosmetics } = user.preferences;
            if (cosmetics) {
                setSelectedCardback(cosmetics.cardback ?? null);
                setSelectedBackground(cosmetics.background ?? null);
                setSelectedPlaymat(cosmetics.playmat ?? null);
                setDisablePlaymats(cosmetics.disablePlaymats ?? false);
            }
        }
    }, [user]);

    const onCardbackClick = async (is: string) => {
        try {
            await savePreferencesGeneric(user, {
                cosmetics: {
                    ...user?.preferences.cosmetics,
                    cardback: is
                }
            }, updateUserPreferences)
            setSelectedCardback(is);
        } catch (error) {
            console.error('Failed to save cardback preferences:', error);
        }
    }

    const onBackgroundClick = async (id: string) => {
        try {
            await savePreferencesGeneric(user, {
                cosmetics: {
                    ...user?.preferences.cosmetics,
                    background: id
                }
            }, updateUserPreferences)
            setSelectedBackground(id);
        } catch (error) {
            console.error('Failed to save background preferences:', error);
        }
    }

    const onPlaymatClick = async (id: string) => {
        try {
            await savePreferencesGeneric(user, {
                cosmetics: {
                    ...user?.preferences.cosmetics,
                    playmat: id
                }
            }, updateUserPreferences)
            setSelectedPlaymat(id);
        } catch (error) {
            console.error('Failed to save playmat preferences:', error);
        }
    }

    const onDisablePlaymatsChange = async (checked: boolean) => {
        try {
            await savePreferencesGeneric(user, {
                cosmetics: {
                    ...user?.preferences.cosmetics,
                    disablePlaymats: checked,
                }
            }, updateUserPreferences)
            setDisablePlaymats(checked);
        } catch (error) {
            console.error('Failed to save disable playmats preference:', error);
        }
    }

    const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpandedAccordion(isExpanded ? panel : '');
    };

    // Utility function to sort cosmetics by title, ignoring articles
    const sortCosmeticsByTitle = (cosmetics: CosmeticOption[]) => {
        return [...cosmetics].sort((a, b) => {
            // Always put "Default" first
            if (a.title === 'Default') return -1;
            if (b.title === 'Default') return 1;

            // Remove articles 'The', 'A', 'An' from the beginning of titles for sorting
            const cleanTitle = (title: string) => {
                return title.replace(/^(The|A|An)\s+/i, '').toLowerCase();
            };

            const titleA = cleanTitle(a.title);
            const titleB = cleanTitle(b.title);

            return titleA.localeCompare(titleB);
        });
    };

    // Create playmats list with 'None' option
    const getPlaymatOptions = () => {
        const noneOption: CosmeticOption = {
            id: 'none',
            title: 'None',
            type: CosmeticType.Playmat,
            path: '' // Empty path for none option
        };

        return [noneOption, ...sortCosmeticsByTitle(cosmetics.playmats)];
    };

    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        contentContainer: {
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(90vh - 240px)',
            overflowY: 'auto',
        },
        functionContainer: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(10.5rem, 1fr))',
            rowGap: '14px',
            columnGap: '10px',
        },
        accordionContainer: {
            mb: '1rem',
        },
        accordionStyle: {
            backgroundColor: 'rgba(59, 66, 82, 0.07)',
            border: '1px solid #4C566A',
            borderRadius: '8px',
            '&:before': {
                display: 'none',
            },
            '&.Mui-expanded': {
                margin: '0 0 16px 0',
            },
        },
        accordionSummaryStyle: {
            backgroundColor: 'rgba(67, 76, 94, 0.07)',
            borderRadius: '8px 8px 0 0',
            '&.Mui-expanded': {
                borderRadius: '8px 8px 0 0',
            },
        },
        accordionDetailsStyle: {
            backgroundColor: 'rgba(46, 52, 64, 0..07)',
            padding: '16px',
        },
        sectionTitle: {
            color: '#ECEFF4',
            fontSize: '1.1rem',
            fontWeight: 600,
        },
    }

    return (
        <Box sx={styles.contentContainer} data-testid="cosmetics-tab">
            <Box sx={styles.accordionContainer}>
                <Accordion
                    sx={styles.accordionStyle}
                    expanded={expandedAccordion === 'cardbacks'}
                    onChange={handleAccordionChange('cardbacks')}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: '#ECEFF4' }} />}
                        sx={styles.accordionSummaryStyle}
                    >
                        <Typography sx={styles.sectionTitle}>
                            Card Sleeves
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{
                        ...styles.accordionDetailsStyle,
                        maxHeight: '50vh',
                        overflowY: 'auto',
                        '::-webkit-scrollbar': {
                            width: '6px',
                        },
                        '::-webkit-scrollbar-thumb': {
                            backgroundColor: '#D3D3D3B3',
                            borderRadius: '3px',
                        },
                        '::-webkit-scrollbar-track': {
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '3px',
                        },
                    }}>
                        <Grid sx={styles.functionContainer}>
                            {
                                cosmetics.cardbacks.length > 0 && sortCosmeticsByTitle(cosmetics.cardbacks).map((cardback) => (
                                    <CosmeticItem
                                        key={cardback.id}
                                        id={cardback.id}
                                        path={cardback.path}
                                        onClick={() => onCardbackClick(cardback.id)}
                                        title={cardback.title}
                                        selected={selectedCardback === cardback.id}
                                    />
                                ))
                            }
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </Box>
            <Box sx={styles.accordionContainer}>
                <Accordion
                    sx={styles.accordionStyle}
                    expanded={expandedAccordion === 'backgrounds'}
                    onChange={handleAccordionChange('backgrounds')}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: '#ECEFF4' }} />}
                        sx={styles.accordionSummaryStyle}
                    >
                        <Typography sx={styles.sectionTitle}>
                            Game Backgrounds
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{
                        ...styles.accordionDetailsStyle,
                        maxHeight: '50vh',
                        overflowY: 'auto',
                        '::-webkit-scrollbar': {
                            width: '6px',
                        },
                        '::-webkit-scrollbar-thumb': {
                            backgroundColor: '#D3D3D3B3',
                            borderRadius: '3px',
                        },
                        '::-webkit-scrollbar-track': {
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '3px',
                        },
                    }}>
                        <Grid sx={styles.functionContainer}>
                            {
                                cosmetics.backgrounds.length > 0 && sortCosmeticsByTitle(cosmetics.backgrounds).map((background) => (
                                    <CosmeticItem
                                        key={background.id}
                                        id={background.id}
                                        path={background.path}
                                        onClick={() => onBackgroundClick(background.id)}
                                        title={background.title}
                                        selected={selectedBackground === background.id}
                                    />
                                ))
                            }
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </Box>
            <Box sx={styles.accordionContainer}>
                <Accordion
                    sx={styles.accordionStyle}
                    expanded={expandedAccordion === 'playmats'}
                    onChange={handleAccordionChange('playmats')}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: '#ECEFF4' }} />}
                        sx={styles.accordionSummaryStyle}
                    >
                        <Typography sx={styles.sectionTitle}>
                            Playmats
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{
                        ...styles.accordionDetailsStyle,
                        maxHeight: '50vh',
                        overflowY: 'auto',
                        '::-webkit-scrollbar': {
                            width: '6px',
                        },
                        '::-webkit-scrollbar-thumb': {
                            backgroundColor: '#D3D3D3B3',
                            borderRadius: '3px',
                        },
                        '::-webkit-scrollbar-track': {
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: '3px',
                        },
                    }}>
                        <Grid sx={styles.functionContainer}>
                            {
                                getPlaymatOptions().map((playmat) => (
                                    <CosmeticItem
                                        key={playmat.id}
                                        id={playmat.id}
                                        path={playmat.path}
                                        onClick={() => onPlaymatClick(playmat.id)}
                                        title={playmat.title}
                                        selected={selectedPlaymat === playmat.id}
                                        isNoneOption={playmat.id === 'none'}
                                    />
                                ))
                            }
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </Box>
            <Box sx={{
                ...styles.accordionContainer,
                backgroundColor: 'rgba(59, 66, 82, 0.07)',
                border: '1px solid #4C566A',
                borderRadius: '8px',
                padding: '16px',
            }}>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={disablePlaymats}
                            onChange={(e) => onDisablePlaymatsChange(e.target.checked)}
                            sx={{
                                color: '#ECEFF4',
                                '&.Mui-checked': {
                                    color: '#5E81AC',
                                },
                            }}
                        />
                    }
                    label={
                        <Typography sx={{
                            color: '#ECEFF4',
                            fontSize: '1rem',
                            fontWeight: 500,
                        }}>
                            Disable Playmats
                        </Typography>
                    }
                />
            </Box>
        </Box>
    );
}
export default CosmeticsTab;
