import * as React from 'react';
import Grid from '@mui/material/Grid2';
import { s3ImageURL } from '@/app/_utils/s3Utils';
import { useUser } from '@/app/_contexts/User.context';
import { useEffect, useState } from 'react';
import { savePreferencesGeneric } from '@/app/_utils/genericPreferenceFunctions';
import CosmeticItem from '@/app/_components/_sharedcomponents/Preferences/_subComponents/CosmeticItem';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Cosmetics } from './cosmetics';

function CosmeticsTab() {
    const { user, updateUserPreferences } = useUser();
    const [selectedCardback, setSelectedCardback] = useState<string>('Default');
    const [selectedBackground, setSelectedBackground] = useState<string>('Default');

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
            {/* Card Sleeves Section */}
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
                                Cosmetics.cardbacks.map((cardback) => (
                                    <CosmeticItem
                                        key={cardback.name}
                                        image={cardback.path}
                                        onClick={() => onCardbackClick(cardback.name)}
                                        name={cardback.name}
                                        selected={selectedCardback === cardback.name}
                                    />
                                ))
                            }
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </Box>

            {/* Game Backgrounds Section */}
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
                                Cosmetics.backgrounds.map((background) => (
                                    <CosmeticItem
                                        key={background.name}
                                        image={background.path}
                                        onClick={() => onBackgroundClick(background.name)}
                                        name={background.name}
                                        selected={selectedBackground === background.name}
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
