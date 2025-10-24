import * as React from 'react';
import Grid from '@mui/material/Grid2';
import { useUser } from '@/app/_contexts/User.context';
import { useEffect, useState } from 'react';
import { savePreferencesGeneric } from '@/app/_utils/genericPreferenceFunctions';
import CosmeticItem from '@/app/_components/_sharedcomponents/Preferences/_subComponents/CosmeticItem';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useCosmetics } from '@/app/_contexts/CosmeticsContext';

function CosmeticsTab() {
    const { user, updateUserPreferences } = useUser();
    const { cosmetics } = useCosmetics();
    const [selectedCardback, setSelectedCardback] = useState<string>('');
    const [selectedBackground, setSelectedBackground] = useState<string>('');

    const onCardbackClick = async (name: string) => {
        try {
            await savePreferencesGeneric(user, { cardback: name }, updateUserPreferences)
            setSelectedCardback(name);
        }catch (error) {
            console.error('Failed to save cardback preferences:', error);
        }
    }

    const onBackgroundClick = async (name: string) => {
        try {
            await savePreferencesGeneric(user, { background: name }, updateUserPreferences)
            setSelectedBackground(name);
        }catch (error) {
            console.error('Failed to save background preferences:', error);
        }
    }

    useEffect(() => {
        if(user){
            setSelectedCardback(user.preferences.cardback ? user.preferences.cardback : 'Default');
            setSelectedBackground(user.preferences.background ? user.preferences.background : 'Default');
        }
    }, [user]);

    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        contentContainer:{
            display:'flex',
            flexDirection:'row',
            alignItems: 'center'
        },
        functionContainer:{
            display:'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(10.5rem, 1fr))',
            rowGap:'14px',
            columnGap:'10px',
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
        <Box>
            <Box sx={styles.accordionContainer}>
                <Accordion sx={styles.accordionStyle} defaultExpanded>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: '#ECEFF4' }} />}
                        sx={styles.accordionSummaryStyle}
                    >
                        <Typography sx={styles.sectionTitle}>
                            Card Sleeves
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={styles.accordionDetailsStyle}>
                        <Grid sx={styles.functionContainer}>
                            {
                                cosmetics.cardbacks.length > 0 && cosmetics.cardbacks.map((cardback) => (
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
                <Accordion sx={styles.accordionStyle}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: '#ECEFF4' }} />}
                        sx={styles.accordionSummaryStyle}
                    >
                        <Typography sx={styles.sectionTitle}>
                            Game Backgrounds
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={styles.accordionDetailsStyle}>
                        <Grid sx={styles.functionContainer}>
                            {
                                cosmetics.backgrounds.length > 0 && cosmetics.backgrounds.map((background) => (
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
        </Box>
    );
}
export default CosmeticsTab;
