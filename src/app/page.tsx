'use client';
import Grid from '@mui/material/Grid2';
import { Typography } from '@mui/material';
import KarabastBanner from './_components/_sharedcomponents/Banner/Banner';
import PublicGames from './_components/HomePage/PublicGames/PublicGames';
import HomePagePlayMode from './_components/HomePage/HomePagePlayMode';
import NewsColumn from './_components/HomePage/News/News';

const Home: React.FC = () => {
    const styles = {
        gridContainer: {
            position: 'relative',
            overflow: 'hidden',
        },
        columnContainer: {
            height: '100vh',
            padding: '1rem 0.75rem 3rem',
        },
        column: {
            justifyContent: 'center',
            height: 'calc(100% - 10.5rem)',
            alignSelf: 'end',
            padding: '0 0.75rem',
        },
        disclaimer: {
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: '1rem',
            textAlign: 'center',
            fontSize: '0.75rem',
        },
    };
    return (
        <Grid container sx={styles.gridContainer}>

            <KarabastBanner />

            <Grid container size={12} sx={styles.columnContainer}>
                <Grid size={4} sx={styles.column}>
                    <PublicGames />
                </Grid>
                <Grid size={4} sx={styles.column}>
                    <HomePagePlayMode />
                </Grid>
                <Grid size={4} sx={styles.column}>
                    <NewsColumn />
                </Grid>
            </Grid>

            <Grid size={12}>
                <Typography variant="body1" sx={styles.disclaimer}>
                    Karabast is in no way affiliated with Disney or Fantasy Flight Games.
                    Star Wars characters, cards, logos, and art are property of Disney
                    and/or Fantasy Flight Games.
                </Typography>
            </Grid>
        </Grid>
    );
};

export default Home;